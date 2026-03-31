import crypto from "node:crypto";
import {
  dbEnabled,
  dbUpsertManifest,
  getSql,
} from "../lib/db-publishes.mjs";

/**
 * Saves a manifest to Postgres (preferred) or GitHub (legacy).
 * Env:
 *   CREATOR_PASSWORD — required
 *   DATABASE_URL — optional; when set, Postgres is the source of truth (Neon-style URL)
 *   GITHUB_* — used only when DATABASE_URL is unset
 */

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(statusCode, obj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
    body: JSON.stringify(obj),
  };
}

function passwordMatches(provided, expected) {
  if (!expected || typeof provided !== "string") return false;
  const ha = crypto.createHash("sha256").update(provided, "utf8").digest();
  const hb = crypto.createHash("sha256").update(expected, "utf8").digest();
  return crypto.timingSafeEqual(ha, hb);
}

function safeSlug(slug) {
  return (
    typeof slug === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    slug.length <= 120
  );
}

function parseRepo(repo) {
  if (!repo || typeof repo !== "string") return null;
  const parts = repo.trim().split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  return { owner: parts[0], name: parts[1] };
}

async function publishToGitHub(manifest, {
  token,
  repoStr,
  branch,
  prefix,
}) {
  const repo = parseRepo(repoStr);
  if (!repo) {
    return { error: "Invalid GITHUB_REPO (expected owner/repo).", status: 503 };
  }

  const slug = manifest.slug;
  const path = `${prefix}/${slug}/manifest.json`;
  const pathEncoded = path.split("/").map(encodeURIComponent).join("/");
  const fileUtf8 = `${JSON.stringify(manifest, null, 2)}\n`;
  const contentB64 = Buffer.from(fileUtf8, "utf8").toString("base64");

  const headers = {
    Authorization: `Bearer ${token.trim()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  const apiBase = `https://api.github.com/repos/${repo.owner}/${repo.name}/contents/${pathEncoded}`;

  let sha = undefined;
  try {
    const getUrl = new URL(apiBase);
    getUrl.searchParams.set("ref", branch);
    const getRes = await fetch(getUrl.toString(), { headers });
    if (getRes.status === 200) {
      const existing = await getRes.json();
      if (existing.sha) sha = existing.sha;
    } else if (getRes.status !== 404) {
      const errText = await getRes.text();
      return {
        status: 502,
        error: `GitHub read failed (${getRes.status}): ${errText.slice(0, 200)}`,
      };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "GitHub request failed";
    return { status: 502, error: msg };
  }

  const message =
    sha != null
      ? `Update post: ${manifest.title}`
      : `Publish post: ${manifest.title}`;

  const putBody = {
    message,
    content: contentB64,
    branch,
  };
  if (sha) putBody.sha = sha;

  try {
    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers,
      body: JSON.stringify(putBody),
    });
    const putData = await putRes.json().catch(() => ({}));

    if (!putRes.ok) {
      const msg =
        putData?.message ||
        putData?.error ||
        `GitHub write failed (${putRes.status})`;
      return { status: 502, error: String(msg).slice(0, 300) };
    }

    const commitUrl = putData?.commit?.html_url || null;
    return {
      ok: true,
      path,
      branch,
      commitUrl,
      slug,
      source: "github",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "GitHub write failed";
    return { status: 502, error: msg };
  }
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders(),
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const secret = process.env.CREATOR_PASSWORD;
  const token = process.env.GITHUB_TOKEN;
  const repoStr = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const prefix = (
    process.env.GITHUB_CONTENT_PREFIX || "interactive/content/publishes"
  ).replace(/^\/+|\/+$/g, "");

  if (!secret) {
    return jsonResponse(503, {
      error: "Server not configured (CREATOR_PASSWORD).",
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const { password, manifest } = body;
  if (!passwordMatches(typeof password === "string" ? password : "", secret)) {
    return jsonResponse(401, { error: "Invalid password" });
  }

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return jsonResponse(400, { error: "manifest must be a JSON object" });
  }

  const slug = manifest.slug;
  if (!safeSlug(slug)) {
    return jsonResponse(400, {
      error:
        "manifest.slug must be kebab-case (lowercase letters, digits, hyphens only).",
    });
  }

  if (
    !manifest.title ||
    typeof manifest.title !== "string" ||
    !manifest.summary ||
    typeof manifest.summary !== "string" ||
    !Array.isArray(manifest.tiles) ||
    manifest.tiles.length < 1
  ) {
    return jsonResponse(400, {
      error:
        "manifest must include title, summary, and at least one tile (run Generate in the studio first).",
    });
  }

  if (dbEnabled()) {
    const sql = getSql();
    if (!sql) {
      return jsonResponse(503, { error: "DATABASE_URL is invalid." });
    }
    try {
      await dbUpsertManifest(sql, manifest);
      return jsonResponse(200, {
        ok: true,
        slug,
        source: "database",
      });
    } catch (e) {
      console.error("publish-manifest db:", e);
      const msg =
        e instanceof Error
          ? e.message
          : "Database write failed (run netlify/db/schema.sql?)";
      return jsonResponse(502, { error: msg.slice(0, 300) });
    }
  }

  if (!token?.trim() || !repoStr?.trim()) {
    return jsonResponse(503, {
      error:
        "Publishing not configured. Set DATABASE_URL, or GITHUB_TOKEN + GITHUB_REPO on Netlify.",
    });
  }

  const gh = await publishToGitHub(manifest, {
    token,
    repoStr,
    branch,
    prefix,
  });
  if (gh.error) {
    return jsonResponse(gh.status ?? 502, { error: gh.error });
  }
  return jsonResponse(200, gh);
};
