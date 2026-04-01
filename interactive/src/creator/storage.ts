export const DRAFTS_STORAGE_KEY = "stillwater-creator-drafts";
const SESSION_PW_KEY = "stillwater-creator-session-pw";
const STUDIO_UNLOCK_KEY = "stillwater-studio-unlocked";

export function isStudioUnlocked(): boolean {
  try {
    return sessionStorage.getItem(STUDIO_UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function setStudioUnlocked(): void {
  try {
    sessionStorage.setItem(STUDIO_UNLOCK_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearStudioUnlock(): void {
  try {
    sessionStorage.removeItem(STUDIO_UNLOCK_KEY);
  } catch {
    /* ignore */
  }
}

const SIGNED_OUT_KEY = "stillwater-signed-out";

export function lockCreatorSession(): void {
  clearStudioUnlock();
  clearSessionPassword();
  // Mark as explicitly signed out so dev auto-unlock doesn't re-fire
  try { sessionStorage.setItem(SIGNED_OUT_KEY, "1"); } catch { /* ignore */ }
}

export function hasExplicitlySignedOut(): boolean {
  try { return sessionStorage.getItem(SIGNED_OUT_KEY) === "1"; } catch { return false; }
}

export function clearSignedOutFlag(): void {
  try { sessionStorage.removeItem(SIGNED_OUT_KEY); } catch { /* ignore */ }
}

export type LocalDraft = {
  json: string;
  updatedAt: string;
  title?: string;
};

export function getSessionPassword(): string | null {
  try {
    return sessionStorage.getItem(SESSION_PW_KEY);
  } catch {
    return null;
  }
}

export function setSessionPassword(password: string): void {
  try {
    sessionStorage.setItem(SESSION_PW_KEY, password);
  } catch {
    /* ignore */
  }
}

export function clearSessionPassword(): void {
  try {
    sessionStorage.removeItem(SESSION_PW_KEY);
  } catch {
    /* ignore */
  }
}

export function getLocalDrafts(): Record<string, LocalDraft> {
  try {
    const s = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!s) return {};
    const p = JSON.parse(s) as unknown;
    return p && typeof p === "object" && !Array.isArray(p)
      ? (p as Record<string, LocalDraft>)
      : {};
  } catch {
    return {};
  }
}

export function saveLocalDraft(slug: string, draft: LocalDraft): void {
  const all = getLocalDrafts();
  all[slug] = draft;
  localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(all));
}

export function deleteLocalDraft(slug: string): void {
  const all = getLocalDrafts();
  delete all[slug];
  localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(all));
}

export function clearAllLocalDrafts(): void {
  localStorage.removeItem(DRAFTS_STORAGE_KEY);
}

const DELETED_SLUGS_KEY = "stillwater-deleted-slugs-session";

/** Slugs removed this session (until refresh after deploy). */
export function getSessionRemovedSlugs(): Set<string> {
  try {
    const s = sessionStorage.getItem(DELETED_SLUGS_KEY);
    if (!s) return new Set();
    const p = JSON.parse(s) as unknown;
    return new Set(Array.isArray(p) ? p.filter((x) => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

export function rememberRemovedSlug(slug: string): void {
  const s = getSessionRemovedSlugs();
  s.add(slug);
  sessionStorage.setItem(DELETED_SLUGS_KEY, JSON.stringify([...s]));
}
