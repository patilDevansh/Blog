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
  const ok = await mergeFromRemoteManifestApis(map);
  if (!ok) {
    console.warn("loadAllManifests: no manifest API responded");
  }
  if (map.size === 0) {
    await mergeBundleFallback(map);
  }
  return map;
}
