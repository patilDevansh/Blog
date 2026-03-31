import crypto from "node:crypto";
import {
  dbEnabled,
  dbListSlugs,
  getSql,
} from "../lib/db-publishes.mjs";

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

function safeSlugDir(name) {
  return (
    typeof name === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) &&
    name.length <= 120
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

  if (dbEnabled()) {
    const sql = getSql();
    if (!sql) {
      return jsonResponse(503, { error: "DATABASE_URL is invalid." });
    }
    try {
      const slugs = await dbListSlugs(sql);
      return jsonResponse(200, { ok: true, slugs });
    } catch (e) {
      console.error("list-publishes db:", e);
      const msg =
        e instanceof Error ? e.message : "Database read failed";
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

  const pathEncoded = prefix.split("/").map(encodeURIComponent).join("/");
  const headers = {
    Authorization: `Bearer ${token.trim()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const url = new URL(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/contents/${pathEncoded}`
  );
  url.searchParams.set("ref", branch);

  try {
    const res = await fetch(url.toString(), { headers });
    if (res.status === 404) {
      return jsonResponse(200, { ok: true, slugs: [] });
    }
    if (!res.ok) {
      const t = await res.text();
      return jsonResponse(502, {
        error: `GitHub list failed (${res.status}): ${t.slice(0, 200)}`,
      });
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      return jsonResponse(502, { error: "Unexpected GitHub response (not a folder)." });
    }
    const slugs = [];
    for (const item of data) {
      if (item.type === "dir" && safeSlugDir(item.name)) {
        slugs.push(item.name);
      }
    }
    slugs.sort();
    return jsonResponse(200, { ok: true, slugs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "GitHub request failed";
    return jsonResponse(502, { error: msg });
  }
};
