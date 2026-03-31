import { parseManifest, type PublishManifest } from "@schema/manifest";

const manifestGlob = import.meta.glob<{ default: unknown }>(
  "../../content/publishes/*/manifest.json",
  { eager: true }
);

export function slugFromKey(key: string): string {
  const m = key.match(/publishes\/([^/]+)\/manifest\.json$/);
  return m?.[1] ?? "";
}

export function postsManifests(): [string, PublishManifest][] {
  const list: [string, PublishManifest][] = [];
  for (const [path, mod] of Object.entries(manifestGlob)) {
    const slug = slugFromKey(path);
    if (!slug) continue;
    try {
      const raw =
        mod &&
        typeof mod === "object" &&
        "default" in mod &&
        (mod as { default: unknown }).default !== undefined
          ? (mod as { default: unknown }).default
          : mod;
      const m = parseManifest(raw);
      list.push([m.slug, m]);
    } catch (e) {
      console.error(`Invalid manifest: ${path}`, e);
    }
  }
  return list;
}

/** Sync load from bundled files only — instant, used for first render. */
export function loadAllManifests(): Map<string, PublishManifest> {
  return new Map(postsManifests());
}

/**
 * Fetch from the public-manifests API (Neon DB on Netlify) and merge into
 * the provided map. DB entries overwrite same-slug bundled entries, and DB-only
 * posts (published since the last deploy) are added fresh.
 */
export async function mergeFromDatabase(
  map: Map<string, PublishManifest>
): Promise<void> {
  const url =
    (import.meta.env.VITE_PUBLIC_MANIFESTS_URL as string | undefined) ??
    "/.netlify/functions/public-manifests";
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const data: unknown = await res.json();
    const arr: unknown[] | null = Array.isArray(data)
      ? data
      : data &&
          typeof data === "object" &&
          data !== null &&
          "manifests" in data &&
          Array.isArray((data as { manifests: unknown }).manifests)
        ? (data as { manifests: unknown[] }).manifests
        : null;
    if (!arr?.length) return;
    for (const item of arr) {
      try {
        const m = parseManifest(item);
        map.set(m.slug, m);
      } catch {
        // skip invalid entries
      }
    }
  } catch {
    // network unavailable (local dev without netlify dev) — fail silently
  }
}

export function sortByCreatedDesc(
  entries: [string, PublishManifest][]
): [string, PublishManifest][] {
  return [...entries].sort(
    (a, b) =>
      new Date(b[1].createdAt).getTime() -
      new Date(a[1].createdAt).getTime()
  );
}
