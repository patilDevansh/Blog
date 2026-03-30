#!/usr/bin/env npx tsx
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Loads repo-root `.env` (Blog/.env) if present so keys need not be exported manually. */
function loadRepoRootEnv() {
  const rootEnv = join(__dirname, "..", "..", ".env");
  if (!existsSync(rootEnv)) return;
  const text = readFileSync(rootEnv, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadRepoRootEnv();

/**
 * Search Unsplash and print manifest-ready `image` blocks (JSON).
 *
 * Requires: UNSPLASH_ACCESS_KEY (Unsplash "Access Key" → API Client-ID header)
 *
 * Usage:
 *   UNSPLASH_ACCESS_KEY=... npx tsx scripts/unsplash-search.ts "quiet morning light"
 *   npm run unsplash-search -- "forest path" --limit 2
 *
 * Flags: --limit N (default 1), --json (raw API results for debugging)
 *
 * @see https://unsplash.com/documentation
 */
const UNSPLASH_SEARCH = "https://api.unsplash.com/search/photos";

type UnsplashPhoto = {
  id: string;
  urls: { regular: string; small: string };
  alt_description: string | null;
  description: string | null;
  links: { html: string };
  user: { name: string; links: { html: string } };
};

type SearchResponse = { results: UnsplashPhoto[] };

function withUtm(photoPageUrl: string): string {
  try {
    const u = new URL(photoPageUrl);
    u.searchParams.set("utm_source", "stillwater");
    u.searchParams.set("utm_medium", "referral");
    return u.toString();
  } catch {
    return photoPageUrl;
  }
}

function photoToBlock(p: UnsplashPhoto) {
  const alt =
    p.alt_description?.trim() ||
    p.description?.trim() ||
    "Photograph";
  return {
    type: "image" as const,
    src: p.urls.regular,
    alt,
    creditName: p.user.name,
    creditLink: withUtm(p.links.html),
  };
}

async function trackDownload(
  accessKey: string,
  photoId: string,
): Promise<void> {
  const res = await fetch(
    `https://api.unsplash.com/photos/${photoId}/download`,
    { headers: { Authorization: `Client-ID ${accessKey}` } },
  );
  if (!res.ok) {
    console.warn(`Unsplash download trigger failed: ${res.status}`);
  }
}

async function main() {
  const rawArgs = process.argv.slice(2);
  let jsonDebug = false;
  let limit = 1;
  const positional: string[] = [];
  for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if (a === "--json") {
      jsonDebug = true;
      continue;
    }
    if (a === "--limit" && rawArgs[i + 1]) {
      limit = Math.min(
        10,
        Math.max(1, parseInt(rawArgs[++i], 10) || 1),
      );
      continue;
    }
    const m = a.match(/^--limit=(\d+)$/);
    if (m) {
      limit = Math.min(10, Math.max(1, parseInt(m[1], 10) || 1));
      continue;
    }
    if (a.startsWith("--")) continue;
    positional.push(a);
  }
  const query = positional.join(" ").trim();

  const accessKey = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!accessKey) {
    console.error(
      "Set UNSPLASH_ACCESS_KEY (Unsplash developer Access Key) in the environment.",
    );
    process.exit(1);
  }
  if (!query) {
    console.error('Usage: unsplash-search "search terms" [--limit N] [--json]');
    process.exit(1);
  }

  const url = new URL(UNSPLASH_SEARCH);
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(Math.min(10, limit + 2)));
  url.searchParams.set("orientation", "landscape");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error(`Unsplash API ${res.status}: ${errText}`);
    process.exit(1);
  }

  const data = (await res.json()) as SearchResponse;
  if (jsonDebug) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const picked = data.results.slice(0, limit);
  if (picked.length === 0) {
    console.error("No results for that query.");
    process.exit(1);
  }

  for (const p of picked) {
    await trackDownload(accessKey, p.id);
  }

  if (limit === 1) {
    console.log(JSON.stringify(photoToBlock(picked[0]), null, 2));
  } else {
    console.log(JSON.stringify(picked.map(photoToBlock), null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
