/**
 * Netlify Function: generate a publish manifest JSON from draft text (OpenAI).
 * Env (set in Netlify UI or `netlify env`):
 *   CREATOR_PASSWORD — required; must match POST body.password
 *   OPENAI_API_KEY   — required
 *   OPENAI_MODEL     — optional, default gpt-4o-mini
 *   UNSPLASH_ACCESS_KEY — optional; when set, inserts 1–2 Unsplash images after paragraphs (no images if manifest already has image blocks)
 */

const SYSTEM = `You are a publishing agent for "Stillwater", a spiritual blog. The user sends English blog prose and metadata.

Output a single JSON object (no markdown fences, no commentary) with this shape:

{
  "slug": "kebab-case-ids-only",
  "title": "string",
  "summary": "1-2 sentence summary for the journal grid card",
  "createdAt": "ISO 8601 datetime with Z offset, e.g. 2026-03-29T12:00:00.000Z",
  "category": "short label for grid card, e.g. Meditation",
  "cardVariant": "purple" | "teal" | "amber" | "pink",
  "readTimeMinutes": positive integer estimate,
  "theme": {
    "accent": "#3C3489",
    "background": "#faf9f7",
    "surface": "#ffffff",
    "text": "#1a1a2e",
    "motion": "subtle" | "playful" | "none"
  },
  "tiles": [
    {
      "id": "kebab-case-unique",
      "label": "Section heading readers see (substantive, not Part 1)",
      "blocks": [ block objects ],
      "interaction": optional
    }
  ]
}

Rules:
- 4–10 tiles. Split the draft into coherent sections; each tile has blocks.
- Omit "navigation" unless you need a custom order; otherwise order tiles in reading order.
- Block types only: { "type": "heading", "level": 1|2|3, "text": "..." }, { "type": "paragraph", "text": "..." }, { "type": "list", "ordered": boolean, "items": ["..."] }, { "type": "quote", "text": "...", "attribution": "optional" }, { "type": "code", "language": "optional", "code": "..." }, { "type": "image", "src": "https://...", "alt": "...", "creditName": "...", "creditLink": "https://unsplash.com/photos/..." }.
- For "image" blocks: never invent URLs. Only use "src"/"creditLink" from the Unsplash API (or the human-run unsplash-search script). If you have no verified URLs, omit "image" blocks entirely — the compile server may still add images when Unsplash is configured.
- Add 2–4 interactions total across the post (not every tile). Allowed interaction types:
  - reveal: { "type": "reveal", "pairs": [ { "prompt": "...", "hidden": "..." } ] }
  - accordion: { "type": "accordion", "sections": [ { "title": "...", "body": "..." } ] }
  - tabs: { "type": "tabs", "tabs": [ { "label": "...", "content": "..." } ] } (at least 2 tabs)
  - dragOrder: { "type": "dragOrder", "prompt": "optional", "items": ["..."], "correctOrder": same strings in correct sequence order }
  - sliderReveal: { "type": "sliderReveal", "slides": [ { "title": "...", "body": "..." } ], "autoAdvanceMs": optional number }
- Theme: keep Stillwater mood; use motion "none" for heavy/somber pieces.
- slug and tile ids: lowercase letters, digits, hyphens only.
- dragOrder: items and correctOrder must be same multiset, same length, unique strings within each array.`;

function jsonResponse(statusCode, obj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(obj),
  };
}

function extractJson(text) {
  const t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  return t;
}

function withUtm(photoPageUrl) {
  try {
    const u = new URL(photoPageUrl);
    u.searchParams.set("utm_source", "stillwater");
    u.searchParams.set("utm_medium", "referral");
    return u.toString();
  } catch {
    return photoPageUrl;
  }
}

function photoToBlock(p) {
  const alt =
    (p.alt_description && String(p.alt_description).trim()) ||
    (p.description && String(p.description).trim()) ||
    "Photograph";
  return {
    type: "image",
    src: p.urls.regular,
    alt,
    creditName: p.user.name,
    creditLink: withUtm(p.links.html),
  };
}

async function unsplashSearch(query, accessKey) {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "6");
  url.searchParams.set("orientation", "landscape");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

async function trackUnsplashDownload(accessKey, photoId) {
  await fetch(`https://api.unsplash.com/photos/${photoId}/download`, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });
}

function manifestHasImageBlock(manifest) {
  for (const t of manifest.tiles || []) {
    for (const b of t.blocks || []) {
      if (b && b.type === "image") return true;
    }
  }
  return false;
}

function buildUnsplashQuery(title, draft) {
  const blob = `${title || ""} ${(draft || "").slice(0, 240)}`.toLowerCase();
  const words = blob
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const seen = new Set();
  const unique = [];
  for (const w of words) {
    if (seen.has(w)) continue;
    seen.add(w);
    unique.push(w);
    if (unique.length >= 6) break;
  }
  return unique.join(" ") || "calm nature light";
}

function paragraphAnchors(manifest) {
  const out = [];
  const tiles = manifest.tiles || [];
  for (let ti = 0; ti < tiles.length; ti++) {
    const blocks = tiles[ti].blocks;
    if (!Array.isArray(blocks)) continue;
    for (let bi = 0; bi < blocks.length; bi++) {
      if (blocks[bi].type === "paragraph") out.push({ ti, bi });
    }
  }
  return out;
}

async function injectUnsplashImages(manifest, draft, accessKey) {
  if (!accessKey?.trim() || !manifest.tiles?.length) return;
  if (manifestHasImageBlock(manifest)) return;

  const results = await unsplashSearch(
    buildUnsplashQuery(manifest.title, draft),
    accessKey.trim(),
  );
  if (!results.length) return;

  const anchors = paragraphAnchors(manifest);
  if (!anchors.length) {
    const t0 = manifest.tiles[0];
    if (!Array.isArray(t0.blocks)) t0.blocks = [];
    const p = results[0];
    await trackUnsplashDownload(accessKey, p.id);
    t0.blocks.push(photoToBlock(p));
    return;
  }

  const i1 = Math.min(
    anchors.length - 1,
    Math.max(0, Math.floor(anchors.length * 0.28)),
  );
  const i2 = Math.min(
    anchors.length - 1,
    Math.max(0, Math.floor(anchors.length * 0.72)),
  );
  const indices = i1 === i2 ? [i1] : [i1, i2];
  const insertions = [];

  for (let n = 0; n < indices.length && n < results.length; n++) {
    const p = results[n];
    await trackUnsplashDownload(accessKey, p.id);
    const { ti, bi } = anchors[indices[n]];
    insertions.push({ ti, bi, block: photoToBlock(p) });
  }

  insertions.sort((a, b) => b.bi - a.bi || b.ti - a.ti);

  for (const ins of insertions) {
    manifest.tiles[ins.ti].blocks.splice(ins.bi + 1, 0, ins.block);
  }
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const secret = process.env.CREATOR_PASSWORD;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!secret || !apiKey) {
    return jsonResponse(503, {
      error: "Server not configured (CREATOR_PASSWORD and OPENAI_API_KEY required).",
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const { password, title, slug: slugIn, category, readTimeMinutes, draft } = body;

  if (password !== secret) {
    return jsonResponse(401, { error: "Invalid password" });
  }

  if (!draft || typeof draft !== "string" || draft.trim().length < 20) {
    return jsonResponse(400, { error: "Draft must be a string with at least 20 characters." });
  }

  if (!title || typeof title !== "string") {
    return jsonResponse(400, { error: "Title is required." });
  }

  const userContent = [
    `Suggested title: ${title.trim()}`,
    slugIn ? `Preferred slug (kebab-case): ${String(slugIn).trim()}` : "Infer slug from title.",
    category ? `Category for grid card: ${String(category).trim()}` : "Infer a short category.",
    readTimeMinutes != null
      ? `Suggested read time (minutes): ${readTimeMinutes}`
      : "Estimate readTimeMinutes.",
    "",
    "Blog draft (English):",
    draft.trim(),
  ].join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
        temperature: 0.5,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || res.statusText;
      return jsonResponse(502, { error: `OpenAI error: ${msg}` });
    }

    const raw = data?.choices?.[0]?.message?.content;
    if (!raw || typeof raw !== "string") {
      return jsonResponse(502, { error: "Empty model response" });
    }

    const parsed = JSON.parse(extractJson(raw));
    if (!parsed.slug || !parsed.title || !parsed.summary || !parsed.createdAt) {
      return jsonResponse(502, { error: "Model output missing required fields" });
    }

    if (!parsed.createdAt.includes("Z") && !parsed.createdAt.match(/[+-]\d{2}:\d{2}$/)) {
      parsed.createdAt = new Date().toISOString();
    }

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    if (unsplashKey) {
      try {
        await injectUnsplashImages(parsed, draft, unsplashKey);
      } catch {
        /* non-fatal: publish without auto images */
      }
    }

    return jsonResponse(200, { manifest: parsed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: msg });
  }
};
