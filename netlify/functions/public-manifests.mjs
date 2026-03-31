import {
  dbEnabled,
  dbListAllManifests,
  getSql,
} from "../lib/db-publishes.mjs";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(statusCode, obj, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=0, must-revalidate",
      ...corsHeaders(),
      ...extraHeaders,
    },
    body: JSON.stringify(obj),
  };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  if (!dbEnabled()) {
    return jsonResponse(200, { manifests: [], source: "none" });
  }

  const sql = getSql();
  if (!sql) {
    return jsonResponse(200, { manifests: [], source: "none" });
  }

  try {
    const manifests = await dbListAllManifests(sql);
    return jsonResponse(200, { manifests, source: "database" });
  } catch (e) {
    console.error("public-manifests:", e);
    const msg =
      e instanceof Error
        ? e.message
        : "Database error (did you run netlify/db/schema.sql?)";
    return jsonResponse(500, { error: msg.slice(0, 300), manifests: [] });
  }
};
