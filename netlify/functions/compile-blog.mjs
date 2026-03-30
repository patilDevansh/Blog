/**
 * Netlify Function: generate a publish manifest JSON from draft text (OpenAI).
 * Env (set in Netlify UI or `netlify env`):
 *   CREATOR_PASSWORD — required; must match POST body.password
 *   OPENAI_API_KEY   — required
 *   OPENAI_MODEL     — optional, default gpt-4o-mini
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
- Block types only: { "type": "heading", "level": 1|2|3, "text": "..." }, { "type": "paragraph", "text": "..." }, { "type": "list", "ordered": boolean, "items": ["..."] }, { "type": "quote", "text": "...", "attribution": "optional" }, { "type": "code", "language": "optional", "code": "..." }.
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

    return jsonResponse(200, { manifest: parsed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: msg });
  }
};
