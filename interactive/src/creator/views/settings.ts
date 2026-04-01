import { el, clearChildren } from "../ui";
import {
  DRAFTS_STORAGE_KEY,
  clearAllLocalDrafts,
  clearSessionPassword,
  getLocalDrafts,
  getSessionPassword,
  lockCreatorSession,
} from "../storage";

export function renderSettings(container: HTMLElement): void {
  clearChildren(container);

  const hero = el("div", "cr-dash-hero");
  hero.appendChild(el("p", "cr-eyebrow", "Studio"));
  hero.appendChild(el("h1", "cr-dash-title", "Site Settings"));
  hero.appendChild(
    el(
      "p",
      "cr-dash-lede",
      "Studio unlock, session password, and browser-only drafts. The compile API runs only after you enter the same creator password."
    )
  );

  const session = el("div", "cr-panel");
  session.appendChild(el("h2", "cr-panel-title", "Session password"));
  const pwOk = getSessionPassword() !== null;
  session.appendChild(
    el(
      "p",
      "cr-muted",
      pwOk
        ? "Your creator password is stored in this tab’s session storage (set when you unlocked the studio or after a successful generate with “Remember”)."
        : "No password in session storage. Unlock the studio again or generate with “Remember for this session”."
    )
  );
  const rowSess = el("div", "cr-btn-row");
  const clearPw = el(
    "button",
    "cr-btn cr-btn--ghost",
    "Clear session password only"
  ) as HTMLButtonElement;
  clearPw.type = "button";
  clearPw.addEventListener("click", () => {
    clearSessionPassword();
    renderSettings(container);
  });
  const lockAll = el(
    "button",
    "cr-btn cr-btn--secondary",
    "Lock studio (sign out)"
  ) as HTMLButtonElement;
  lockAll.type = "button";
  lockAll.addEventListener("click", () => {
    lockCreatorSession();
    globalThis.location.reload();
  });
  rowSess.appendChild(clearPw);
  rowSess.appendChild(lockAll);
  session.appendChild(rowSess);

  const drafts = el("div", "cr-panel");
  drafts.appendChild(el("h2", "cr-panel-title", "Local drafts"));
  const count = Object.keys(getLocalDrafts()).length;
  drafts.appendChild(
    el(
      "p",
      "cr-muted",
      `${count} draft(s) in localStorage for this browser. Export a backup before clearing.`
    )
  );

  const row = el("div", "cr-btn-row");
  const exportBtn = el(
    "button",
    "cr-btn cr-btn--secondary",
    "Export drafts JSON"
  ) as HTMLButtonElement;
  exportBtn.type = "button";
  exportBtn.addEventListener("click", () => {
    const blob = JSON.stringify(getLocalDrafts(), null, 2);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([blob], { type: "application/json" })
    );
    a.download = `stillwater-creator-drafts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const importLabel = el("label", "cr-file-label cr-btn cr-btn--secondary");
  importLabel.textContent = "Import drafts JSON";
  const fileIn = el("input", "cr-file-input") as HTMLInputElement;
  fileIn.type = "file";
  fileIn.accept = "application/json,.json";
  fileIn.addEventListener("change", () => {
    const f = fileIn.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const text = String(r.result ?? "");
        const data = JSON.parse(text) as unknown;
        if (!data || typeof data !== "object" || Array.isArray(data)) {
          throw new Error("Invalid file");
        }
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(data));
        fileIn.value = "";
        renderSettings(container);
      } catch {
        fileIn.value = "";
        alert("Could not import drafts. Expected an object keyed by slug.");
      }
    };
    r.readAsText(f);
  });
  importLabel.appendChild(fileIn);

  const clearDrafts = el(
    "button",
    "cr-btn cr-btn--danger",
    "Delete all local drafts"
  ) as HTMLButtonElement;
  clearDrafts.type = "button";
  clearDrafts.addEventListener("click", () => {
    if (
      confirm(
        "Remove all saved drafts from this browser? This cannot be undone."
      )
    ) {
      clearAllLocalDrafts();
      renderSettings(container);
    }
  });

  row.appendChild(exportBtn);
  row.appendChild(importLabel);
  row.appendChild(clearDrafts);
  drafts.appendChild(row);

  const publish = el("div", "cr-panel");
  publish.appendChild(el("h2", "cr-panel-title", "Publish without coding"));
  publish.appendChild(
    el(
      "p",
      "cr-muted",
      "Netlify → Environment variables. Prefer a database for many posts; the journal fetches them at runtime."
    )
  );
  const pubUl = el("ul", "cr-settings-list");
  for (const line of [
    "DATABASE_URL — Postgres connection string (Neon, Supabase, etc.). Run netlify/db/schema.sql once on that database.",
    "Or legacy GitHub-only: GITHUB_REPO (owner/name), GITHUB_TOKEN with Contents Read/Write; optional GITHUB_BRANCH, GITHUB_CONTENT_PREFIX.",
  ]) {
    const li = el("li", "", line);
    pubUl.appendChild(li);
  }
  publish.appendChild(pubUl);

  const deploy = el("div", "cr-panel");
  deploy.appendChild(el("h2", "cr-panel-title", "All Netlify functions"));
  deploy.appendChild(
    el(
      "p",
      "cr-muted",
      "Functions: verify-creator-access, compile-blog, publish-manifest, list-publishes, get-manifest, delete-publish, public-manifests (read-only for the live site). Local: repo root, npx netlify dev."
    )
  );

  container.appendChild(hero);
  container.appendChild(session);
  container.appendChild(drafts);
  container.appendChild(publish);
  container.appendChild(deploy);
}
