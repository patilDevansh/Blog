import "./creator.css";
import { mountCreatorApp } from "./creator/app";
import { setStudioUnlocked } from "./creator/storage";

// In local dev (plain `vite dev` without Netlify functions), the verify-creator-access
// function is unreachable and the gate would hard-block the studio. Auto-unlock so the
// UI is accessible. On production Netlify the gate always runs normally.
if (import.meta.env.DEV) {
  setStudioUnlocked();
}

mountCreatorApp();
