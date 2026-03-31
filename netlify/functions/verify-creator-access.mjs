/**
 * Verifies CREATOR_PASSWORD for unlocking the creator UI (session gate).
 * Same secret as compile-blog POST password — set once in Netlify env.
 */
import crypto from "node:crypto";

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

/** Constant-time compare via SHA-256 to avoid length leaks on timingSafeEqual. */
function passwordMatches(provided, expected) {
  if (!expected || typeof provided !== "string") return false;
  const ha = crypto.createHash("sha256").update(provided, "utf8").digest();
  const hb = crypto.createHash("sha256").update(expected, "utf8").digest();
  return crypto.timingSafeEqual(ha, hb);
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
  if (!secret) {
    return jsonResponse(503, { error: "Server not configured (CREATOR_PASSWORD)." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const password = body?.password;
  if (!passwordMatches(typeof password === "string" ? password : "", secret)) {
    return jsonResponse(401, { error: "Invalid access" });
  }

  return jsonResponse(200, { ok: true });
};
