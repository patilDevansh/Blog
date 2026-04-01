import "./creator.css";
import { mountCreatorApp } from "./creator/app";
import { setStudioUnlocked, hasExplicitlySignedOut } from "./creator/storage";

// In local dev (plain `vite dev` without Netlify functions), the verify-creator-access
// function is unreachable and the gate would hard-block the studio. Auto-unlock so the
// UI is accessible — but only if the user hasn't explicitly signed out this session.
// On production Netlify the gate always runs normally (DEV is false).
if (import.meta.env.DEV && !hasExplicitlySignedOut()) {
  setStudioUnlocked();
}

mountCreatorApp();
