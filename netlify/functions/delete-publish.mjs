import crypto from "node:crypto";
import { dbEnabled, getSql } from "../lib/db-publishes.mjs";

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
    headers: { "Content-Type": "application/json", ...corsHeaders() },
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

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
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
    return jsonResponse(503, { error: "Server not configured (CREATOR_PASSWORD)." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  if (!passwordMatches(typeof body?.password === "string" ? body.password : "", secret)) {
    return jsonResponse(401, { error: "Invalid password" });
  }

  const slug = body?.slug;
  if (!safeSlug(typeof slug === "string" ? slug : "")) {
    return jsonResponse(400, { error: "Invalid slug." });
  }

  if (dbEnabled()) {
    const sql = getSql();
    if (!sql) {
      return jsonResponse(503, { error: "DATABASE_URL is invalid." });
    }
    try {
      const rows =
        await sql`DELETE FROM publishes WHERE slug = ${slug} RETURNING slug`;
      if (!rows.length) {
        return jsonResponse(404, { error: "Post not found." });
      }
      return jsonResponse(200, {
        ok: true,
        slug,
        source: "database",
      });
    } catch (e) {
      console.error("delete-publish db:", e);
      const msg =
        e instanceof Error ? e.message : "Database delete failed";
      return jsonResponse(502, { error: msg.slice(0, 300) });
    }
  }

  if (!token?.trim() || !repoStr?.trim()) {
    return jsonResponse(503, {
      error:
        "Storage not configured. Set DATABASE_URL, or GITHUB_TOKEN + GITHUB_REPO on Netlify.",
    });
  }

  const repo = parseRepo(repoStr);
  if (!repo) {
    return jsonResponse(503, { error: "Invalid GITHUB_REPO (expected owner/repo)." });
  }

  const path = `${prefix}/${slug}/manifest.json`;
  const pathEncoded = path.split("/").map(encodeURIComponent).join("/");
  const headers = {
    Authorization: `Bearer ${token.trim()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  const apiBase = `https://api.github.com/repos/${repo.owner}/${repo.name}/contents/${pathEncoded}`;
  const getUrl = new URL(apiBase);
  getUrl.searchParams.set("ref", branch);

  let sha;
  try {
    const getRes = await fetch(getUrl.toString(), { headers });
    if (getRes.status === 404) {
      return jsonResponse(404, { error: "Post not found on GitHub." });
    }
    if (!getRes.ok) {
      const t = await getRes.text();
      return jsonResponse(502, {
        error: `GitHub read failed (${getRes.status}): ${t.slice(0, 200)}`,
      });
    }
    const file = await getRes.json();
    if (!file.sha) {
      return jsonResponse(502, { error: "Could not read file SHA from GitHub." });
    }
    sha = file.sha;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "GitHub request failed";
    return jsonResponse(502, { error: msg });
  }

  try {
    const delRes = await fetch(apiBase, {
      method: "DELETE",
      headers,
      body: JSON.stringify({
        message: `Delete post: ${slug}`,
        sha,
        branch,
      }),
    });
    const delData = await delRes.json().catch(() => ({}));
    if (!delRes.ok) {
      const msg =
        delData?.message || delData?.error || `GitHub delete failed (${delRes.status})`;
      return jsonResponse(502, { error: String(msg).slice(0, 300) });
    }
    const commitUrl = delData?.commit?.html_url || null;
    return jsonResponse(200, { ok: true, slug, commitUrl, source: "github" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "GitHub delete failed";
    return jsonResponse(502, { error: msg });
  }
};
