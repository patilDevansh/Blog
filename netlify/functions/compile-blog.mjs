/**
 * Netlify Function: generate a publish manifest JSON from draft text (OpenAI).
 * Env (set in Netlify UI or `netlify env`):
 *   CREATOR_PASSWORD      — required; must match POST body.password
 *   OPENAI_API_KEY        — required
 *   OPENAI_MODEL          — optional, default gpt-4o
 *   UNSPLASH_ACCESS_KEY   — optional; when set, resolves AI-placed image placeholders
 *                           via Unsplash. If absent, image blocks are dropped cleanly.
 */

const SYSTEM = `You are the aesthetic intelligence for "Stillwater", a contemplative spiritual blog.
The creator sends you their draft and you produce a fully-designed, publication-ready manifest.

Output a single JSON object (no markdown fences, no commentary) with this exact shape:

{
  "slug": "kebab-case-ids-only",
  "title": "string",
  "summary": "1–2 sentence summary for the journal grid card",
  "createdAt": "ISO 8601 datetime with Z offset, e.g. 2026-03-29T12:00:00.000Z",
  "category": "short label, e.g. Reflection",
  "cardVariant": "purple" | "teal" | "amber" | "pink",
  "readTimeMinutes": positive integer,
  "theme": {
    "accent": "#rrggbb",
    "background": "#rrggbb",
    "surface": "#rrggbb",
    "text": "#rrggbb",
    "fontPreset": "editorial" | "serif-warm" | "rounded" | "mono",
    "motion": "none" | "subtle" | "playful"
  },
  "tiles": [ tile objects ]
}

═══════════════════════════════════════
LAYOUT — CRITICAL
═══════════════════════════════════════
Default: ONE primary prose tile containing the entire essay. Inside it, use heading blocks
(level 2–3) and paragraph / list / quote / divider blocks for rhythm. Do NOT split into
many tiles just for structure — that produces a stacked-box layout the reader rejected.

Only add extra tiles when the schema requires it: the schema allows ONE interaction per tile.
If you need more than one widget, add minimal extra tiles. Never add empty or micro-tiles.

═══════════════════════════════════════
BLOCK TYPES (exact shapes)
═══════════════════════════════════════
{ "type": "heading", "level": 2 | 3, "text": "..." }
{ "type": "paragraph", "text": "..." }
{ "type": "list", "ordered": boolean, "items": ["..."] }
{ "type": "quote", "text": "...", "attribution": "optional" }
{ "type": "code", "language": "optional", "code": "..." }
{ "type": "divider", "style": "ornamental" | "minimal" | "heavy" }
{ "type": "image", "_query": "unsplash search query", "src": "", "alt": "...", "creditName": "", "creditLink": "" }

═══════════════════════════════════════
DIVIDERS — editorial rhythm
═══════════════════════════════════════
Insert dividers at genuine thematic turning points: a shift in time, scene, tone, or argument.
NOT every few paragraphs. Use 1–3 per post; 0 is fine for short or unified pieces.

Style choice — match the essay's register:
• "ornamental" — for contemplative, spiritual, literary essays
• "minimal"    — for personal, intimate, fragmented or poetic essays
• "heavy"      — for essays with strong structural movements or stark contrasts

You may mix styles within one post if different breaks serve different purposes.

═══════════════════════════════════════
PULL QUOTES — voice emphasis
═══════════════════════════════════════
Use { "type": "quote", "text": "..." } WITHOUT attribution for 1–2 pull quotes:
a powerful or resonant phrase extracted verbatim from the prose, placed just before or
after the paragraph it comes from. These break the column and give visual weight to
the essay's most important moments. Also use with attribution for genuine external quotes.

═══════════════════════════════════════
THEME — per-essay color + typography personality
═══════════════════════════════════════
Choose values that fit the emotional register of THIS specific essay. Do not default to
the same palette every time. Use the full hex color space.

Palette guidance:
• Introspective / heavy / grief:      accent ~#3C3489 (deep violet), bg ~#faf9f7 (parchment)
• Restorative / nature / spacious:    accent ~#2D7D72 (forest teal), bg ~#f5faf9
• Warm / domestic / tender memory:    accent ~#8B6914 (amber), bg ~#faf8f4
• Vulnerable / soft / raw emotion:    accent ~#8B4A6B (rose), bg ~#faf7f9
• Dark night / crisis / weight:       accent ~#1a1a3e (near-black blue), bg ~#f0eeec
• Clear-eyed / practical / grounded:  accent ~#3d6b4f (sage green), bg ~#f7faf7

Derive the right hex from the essay's specific emotional core — not a mechanical lookup.
surface should be slightly lighter/whiter than background. text should ensure readability.

fontPreset — typographic character:
• "editorial"   — Cormorant Garamond headings + Jost body — elegant, spiritual, unhurried (default)
• "serif-warm"  — Lora throughout — intimate, book-like, diary or personal-essay register
• "rounded"     — DM Sans throughout — warm, approachable, lighter or more accessible essays
• "mono"        — monospace body — raw, confessional, journalistic, unfiltered voice

motion:
• "none"    — for heavy, somber, grief, crisis pieces
• "subtle"  — for most contemplative essays (default)
• "playful" — only for genuinely light, joyful, curious pieces

cardVariant:
• "purple" — introspective, meditative, searching
• "teal"   — restorative, nature, renewal, spaciousness
• "amber"  — warmth, memory, domestic, tenderness
• "pink"   — vulnerable, gentle, intimate, emotionally raw

═══════════════════════════════════════
IMAGES — editorial placement
═══════════════════════════════════════
You MAY place image blocks at positions in blocks[] where a photograph would genuinely
serve the reading. Use the placeholder format — the server will resolve each _query
against Unsplash and fill in the real src/credit:

  { "type": "image", "_query": "...", "src": "", "alt": "...", "creditName": "", "creditLink": "" }

When to place an image:
• After a paragraph that describes a scene, setting, or strong sensory moment
• At a tonal shift where a visual breath would deepen the transition
• When a concrete image in the prose calls for its photographic equivalent

When NOT to place an image:
• Mid-argument, mid-list, inside code blocks
• In purely interior/psychological essays where no visual fits
• If the essay is abstract throughout — 0 images is correct and elegant

_query construction — anchor in the draft:
• Read the paragraph the image follows. Pull concrete nouns, atmosphere, time of day,
  sensory details. The query should read like honest photo tags for THAT moment.
• Contemplative register: soft light, mist, dawn, hands, window, water, path, candle, fabric
• Only use Himalayan/Buddhist/Zen vocabulary when the essay's themes actually support it
• Each image should have a distinct query reflecting a different beat in the essay

alt: write descriptive accessibility text tied to the image's emotional function in the essay.

═══════════════════════════════════════
INTERACTIONS — content-specific widgets
═══════════════════════════════════════
Add 1–2 interactions where they genuinely serve THIS essay's content. Each goes on a
separate tile (one interaction per tile in the schema). Prefer consolidating over many tiles.

Available types:
• reveal:       { "type": "reveal", "pairs": [{ "prompt": "...", "hidden": "..." }] }
• accordion:    { "type": "accordion", "sections": [{ "title": "...", "body": "..." }] }
• tabs:         { "type": "tabs", "tabs": [{ "label": "...", "content": "..." }] }
• dragOrder:    { "type": "dragOrder", "prompt": "...", "items": [...], "correctOrder": [...] }
  — items and correctOrder must be the same set of unique strings; same length; different order
• sliderReveal: { "type": "sliderReveal", "slides": [{ "title": "...", "body": "..." }] }

Design the interaction content around this essay's specific themes, not generically.

═══════════════════════════════════════
EDITORIAL RULES
═══════════════════════════════════════
• slug and tile ids: lowercase letters, digits, hyphens only
• tile.label must NOT repeat the full post title
• Fix clear spelling/grammar errors silently; do not rewrite sentences
• Do not duplicate the title as the first paragraph block
• dragOrder: items and correctOrder must be same multiset, same length, unique strings`;

function jsonResponse(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
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

function photoToBlock(p, existingAlt) {
  const alt =
    existingAlt ||
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
  }).catch(() => {});
}

/**
 * Resolve every image block the AI placed as a placeholder.
 * The AI writes: { type: "image", _query: "...", src: "", alt: "...", creditName: "", creditLink: "" }
 * We search Unsplash using _query, fill in real URLs, and drop blocks with no results.
 * Iterates backwards so splices don't shift indices.
 */
async function resolveImagePlaceholders(manifest, accessKey) {
  if (!accessKey?.trim() || !manifest.tiles?.length) return;

  for (const tile of manifest.tiles) {
    if (!Array.isArray(tile.blocks)) continue;
    for (let i = tile.blocks.length - 1; i >= 0; i--) {
      const block = tile.blocks[i];
      if (block?.type !== "image") continue;

      const query = block._query;
      delete block._query;

      if (block.src && block.src.startsWith("https://")) continue;

      if (!query || !query.trim()) {
        tile.blocks.splice(i, 1);
        continue;
      }

      try {
        const results = await unsplashSearch(query.trim(), accessKey.trim());
        if (results.length > 0) {
          const photo = results[0];
          const filled = photoToBlock(photo, block.alt || "");
          tile.blocks[i] = filled;
          await trackUnsplashDownload(accessKey.trim(), photo.id);
        } else {
          tile.blocks.splice(i, 1);
        }
      } catch {
        tile.blocks.splice(i, 1);
      }
    }
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
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  if (!secret || !apiKey) {
    return jsonResponse(503, {
      error:
        "Server not configured (CREATOR_PASSWORD and OPENAI_API_KEY required).",
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const { password, title, slug: slugIn, category, readTimeMinutes, draft } =
    body;

  if (password !== secret) {
    return jsonResponse(401, { error: "Invalid password" });
  }

  if (!draft || typeof draft !== "string" || draft.trim().length < 20) {
    return jsonResponse(400, {
      error: "Draft must be a string with at least 20 characters.",
    });
  }

  if (!title || typeof title !== "string") {
    return jsonResponse(400, { error: "Title is required." });
  }

  const userContent = [
    `Title: ${title.trim()}`,
    slugIn
      ? `Preferred slug (kebab-case): ${String(slugIn).trim()}`
      : "Infer slug from title.",
    category
      ? `Category hint: ${String(category).trim()}`
      : "Choose an appropriate category.",
    readTimeMinutes != null
      ? `Read time hint (minutes): ${readTimeMinutes}`
      : "Estimate readTimeMinutes.",
    "",
    "Draft:",
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
        temperature: 0.4,
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
      return jsonResponse(502, {
        error: "Model output missing required fields",
      });
    }

    if (
      !parsed.createdAt.includes("Z") &&
      !parsed.createdAt.match(/[+-]\d{2}:\d{2}$/)
    ) {
      parsed.createdAt = new Date().toISOString();
    }

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    if (unsplashKey) {
      try {
        await resolveImagePlaceholders(parsed, unsplashKey);
      } catch {
        /* non-fatal: publish without images */
      }
    } else {
      // No Unsplash key — drop all unresolved image placeholder blocks
      for (const tile of parsed.tiles || []) {
        if (!Array.isArray(tile.blocks)) continue;
        tile.blocks = tile.blocks.filter(
          (b) =>
            b?.type !== "image" || (b.src && b.src.startsWith("https://"))
        );
      }
    }

    return jsonResponse(200, { manifest: parsed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: msg });
  }
};
