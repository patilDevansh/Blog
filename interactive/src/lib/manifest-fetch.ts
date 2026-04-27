import { parseManifest, type PublishManifest } from "@schema/manifest";

/** Explicit override, or Vercel then Netlify defaults. */
export function manifestFetchUrls(): string[] {
  const explicit = (
    import.meta.env.VITE_PUBLIC_MANIFESTS_URL as string | undefined
  )?.trim();
  if (explicit) return [explicit];
  return ["/api/public-manifests", "/.netlify/functions/public-manifests"];
}

function manifestsArrayFromResponse(data: unknown): unknown[] | null {
  if (Array.isArray(data)) return data;
  if (
    data &&
    typeof data === "object" &&
    data !== null &&
    "manifests" in data
  ) {
    const m = (data as { manifests: unknown }).manifests;
    return Array.isArray(m) ? m : null;
  }
  return null;
}

/**
 * Tries each manifest API URL until one returns JSON with a `manifests` array
 * (or a top-level array). Merges into `map`. Returns whether any URL succeeded.
 */
export async function mergeFromRemoteManifestApis(
  map: Map<string, PublishManifest>
): Promise<boolean> {
  for (const url of manifestFetchUrls()) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data: unknown = await res.json();
      const arr = manifestsArrayFromResponse(data);
      if (arr === null) continue;
      for (const item of arr) {
        try {
          const m = parseManifest(item);
          map.set(m.slug, m);
        } catch {
          /* skip invalid */
        }
      }
      return true;
    } catch {
      continue;
    }
  }
  return false;
}
