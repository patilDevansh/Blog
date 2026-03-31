import { parseManifest, type PublishManifest } from "@schema/manifest";

const manifestGlob = import.meta.glob<{ default: unknown }>(
  "../../content/publishes/*/manifest.json",
  { eager: true }
);

export function slugFromKey(key: string): string {
  const m = key.match(/publishes\/([^/]+)\/manifest\.json$/);
  return m?.[1] ?? "";
}

/** Sync load from bundled glob only (dev / when Vite inlined JSON at build). */
export function loadAllManifestsFromGlob(): Map<string, PublishManifest> {
  const map = new Map<string, PublishManifest>();
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
      map.set(m.slug, m);
    } catch (e) {
      console.error(`Invalid manifest: ${path}`, e);
    }
  }
  return map;
}

function publicManifestsUrl(): string {
  return (
    import.meta.env.VITE_PUBLIC_MANIFESTS_URL ??
    "/.netlify/functions/public-manifests"
  );
}

/**
 * Merges manifests from the public API (Postgres-backed on Netlify).
 * Same slug as repo wins from API (database overwrites bundled files).
 */
async function mergeRemoteManifests(
  map: Map<string, PublishManifest>
): Promise<void> {
  const url = publicManifestsUrl();
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("mergeRemoteManifests:", res.status, url);
      return;
    }
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
      } catch (e) {
        console.warn("mergeRemoteManifests: skip invalid manifest", e);
      }
    }
  } catch (e) {
    console.warn("mergeRemoteManifests: fetch error", e);
  }
}

async function mergeBundleFallback(
  map: Map<string, PublishManifest>
): Promise<void> {
  if (map.size > 0) return;

  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/?$/, "/");
  const url = `${base}publishes-bundle.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("loadAllManifests: bundle fetch failed", res.status, url);
      return;
    }
    const data: unknown = await res.json();
    if (!Array.isArray(data)) {
      console.warn("loadAllManifests: bundle is not an array");
      return;
    }
    for (const item of data) {
      try {
        const m = parseManifest(item);
        map.set(m.slug, m);
      } catch (e) {
        console.warn("loadAllManifests: skip invalid manifest in bundle", e);
      }
    }
  } catch (e) {
    console.warn("loadAllManifests: bundle fetch error", e);
  }
}

/**
 * Loads all publishes: local repo files, then merges API (database), then
 * static bundle fallback if still empty.
 */
export async function loadAllManifests(): Promise<
  Map<string, PublishManifest>
> {
  const map = loadAllManifestsFromGlob();
  await mergeRemoteManifests(map);
  if (map.size === 0) {
    await mergeBundleFallback(map);
  }
  return map;
}
