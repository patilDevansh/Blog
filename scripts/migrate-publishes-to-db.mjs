#!/usr/bin/env node
/**
 * Copy interactive/content/publishes/<slug>/manifest.json into Postgres.
 * Usage: DATABASE_URL='postgresql://...' node scripts/migrate-publishes-to-db.mjs
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publishesDir = join(root, "interactive", "content", "publishes");

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("Set DATABASE_URL (same as Netlify).");
  process.exit(1);
}

if (!existsSync(publishesDir)) {
  console.error("No directory:", publishesDir);
  process.exit(1);
}

const sql = neon(url);

const slugs = readdirSync(publishesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let n = 0;
for (const slug of slugs) {
  const fp = join(publishesDir, slug, "manifest.json");
  if (!existsSync(fp)) continue;
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(fp, "utf8"));
  } catch (e) {
    console.warn("Skip", slug, e);
    continue;
  }
  if (!manifest?.slug || manifest.slug !== slug) {
    console.warn("Skip", slug, "(slug mismatch)");
    continue;
  }
  const blob = JSON.stringify(manifest);
  await sql`
    INSERT INTO publishes (slug, manifest, updated_at)
    VALUES (${slug}, ${blob}::jsonb, now())
    ON CONFLICT (slug) DO UPDATE SET
      manifest = EXCLUDED.manifest,
      updated_at = now()
  `;
  n += 1;
  console.log("Upserted:", slug);
}

console.log(`Done. ${n} manifest(s).`);
