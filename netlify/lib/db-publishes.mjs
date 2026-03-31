import { neon } from "@neondatabase/serverless";

let _sql;

/** @returns {import('@neondatabase/serverless').NeonQueryFunction | null} */
export function getSql() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!_sql) _sql = neon(url);
  return _sql;
}

export function dbEnabled() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** @param {import('@neondatabase/serverless').NeonQueryFunction} sql */
export async function dbListSlugs(sql) {
  const rows = await sql`SELECT slug FROM publishes ORDER BY updated_at DESC`;
  return rows.map((r) => r.slug);
}

/** @param {import('@neondatabase/serverless').NeonQueryFunction} sql */
export async function dbGetManifest(sql, slug) {
  const rows = await sql`SELECT manifest FROM publishes WHERE slug = ${slug}`;
  const m = rows[0]?.manifest;
  if (m == null) return null;
  return typeof m === "string" ? JSON.parse(m) : m;
}

/** @param {import('@neondatabase/serverless').NeonQueryFunction} sql */
export async function dbUpsertManifest(sql, manifest) {
  const slug = manifest.slug;
  const blob = JSON.stringify(manifest);
  await sql`
    INSERT INTO publishes (slug, manifest, updated_at)
    VALUES (${slug}, ${blob}::jsonb, now())
    ON CONFLICT (slug) DO UPDATE SET
      manifest = EXCLUDED.manifest,
      updated_at = now()
  `;
}

/** @param {import('@neondatabase/serverless').NeonQueryFunction} sql */
export async function dbDeleteSlug(sql, slug) {
  await sql`DELETE FROM publishes WHERE slug = ${slug}`;
}

/** @param {import('@neondatabase/serverless').NeonQueryFunction} sql */
export async function dbListAllManifests(sql) {
  const rows =
    await sql`SELECT manifest FROM publishes ORDER BY updated_at DESC`;
  return rows.map((r) => {
    const m = r.manifest;
    return typeof m === "string" ? JSON.parse(m) : m;
  });
}
