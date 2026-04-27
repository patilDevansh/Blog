import "./creator.css";
import { mountCreatorApp } from "./creator/app";
import {
  lockCreatorSession,
  setStudioUnlocked,
  hasExplicitlySignedOut,
} from "./creator/storage";

/** `creator.html?logout=1` (or `?logout` / `?logout=true`) clears session once, then removes the param. */
function consumeLogoutQuery(): void {
  try {
    const url = new URL(globalThis.location.href);
    const raw = url.searchParams.get("logout");
    if (raw === null) return;
    const v = raw.trim().toLowerCase();
    if (v !== "" && v !== "1" && v !== "true" && v !== "yes") return;
    lockCreatorSession();
    url.searchParams.delete("logout");
    const q = url.searchParams.toString();
    const next = `${url.pathname}${q ? `?${q}` : ""}${url.hash}`;
    globalThis.history.replaceState({}, "", next);
  } catch {
    /* ignore */
  }
}

consumeLogoutQuery();

// In local dev (plain `vite dev` without Netlify functions), the verify-creator-access
// function is unreachable and the gate would hard-block the studio. Auto-unlock so the
// UI is accessible — but only if the user hasn't explicitly signed out this session.
// On production Netlify the gate always runs normally (DEV is false).
if (import.meta.env.DEV && !hasExplicitlySignedOut()) {
  setStudioUnlocked();
}

mountCreatorApp();
