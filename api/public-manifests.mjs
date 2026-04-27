import {
  dbEnabled,
  dbListAllManifests,
  getSql,
} from "../netlify/lib/db-publishes.mjs";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);
  res.setHeader(
    "Cache-Control",
    "public, max-age=0, must-revalidate"
  );

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!dbEnabled()) {
    res.status(200).json({ manifests: [], source: "none" });
    return;
  }

  const sql = getSql();
  if (!sql) {
    res.status(200).json({ manifests: [], source: "none" });
    return;
  }

  try {
    const manifests = await dbListAllManifests(sql);
    res.status(200).json({ manifests, source: "database" });
  } catch (e) {
    console.error("api/public-manifests:", e);
    const msg =
      e instanceof Error
        ? e.message
        : "Database error (did you run netlify/db/schema.sql?)";
    res.status(500).json({
      error: msg.slice(0, 300),
      manifests: [],
    });
  }
}
