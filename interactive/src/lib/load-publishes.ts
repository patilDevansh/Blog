import { parseManifest, type PublishManifest } from "@schema/manifest";
import { mergeFromRemoteManifestApis } from "./manifest-fetch";

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

async function mergeBundleFallback(
  map: Map<string, PublishManifest>
): Promise<void> {
  if (map.size > 0) return;
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/?$/, "/");
  const url = `${base}publishes-bundle.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return;
    for (const item of data) {
      try {
        const m = parseManifest(item);
        map.set(m.slug, m);
      } catch {
        /* skip invalid */
      }
    }
  } catch {
    /* missing or unreachable bundle */
  }
}

/**
 * Fetch from manifest APIs (Vercel `/api/public-manifests`, then Netlify function)
 * and merge into the map. Override order with `VITE_PUBLIC_MANIFESTS_URL`.
 *
 * If the map is still empty afterward, loads `publishes-bundle.json` when present.
 */
export async function mergeFromDatabase(
  map: Map<string, PublishManifest>
): Promise<void> {
  await mergeFromRemoteManifestApis(map);
  if (map.size === 0) {
    await mergeBundleFallback(map);
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
