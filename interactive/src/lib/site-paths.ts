/** Normalize Vite BASE_URL (typically "/" or "/subdir/"). */
function withTrailingSlash(baseUrl: string): string {
  const b = baseUrl || "/";
  return b.endsWith("/") ? b : `${b}/`;
}

/**
 * Marketing landing. At site root, `/` rewrites to Stillwater (`_redirects`);
 * under a subpath, use `stillwater.html` beside `index.html`.
 */
export function stillwaterHome(baseUrl: string): string {
  const b = withTrailingSlash(baseUrl);
  if (b === "/") return "/";
  return `${b}stillwater.html`;
}

/** Journal listing (search + grid). */
export function journalIndexUrl(baseUrl: string): string {
  return `${withTrailingSlash(baseUrl)}journal.html`;
}

/** Full post reader (`main.ts` on index.html). */
export function journalPostUrl(baseUrl: string, slug: string): string {
  const b = withTrailingSlash(baseUrl);
  return `${b}index.html?slug=${encodeURIComponent(slug)}`;
}
