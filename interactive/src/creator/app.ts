import { loadAllManifests } from "../lib/publishes";
import { journalIndexUrl, stillwaterHome } from "../lib/site-paths";
import {
  getLocalDrafts,
  isStudioUnlocked,
} from "./storage";
import { el, clearChildren } from "./ui";
import type { ViewId } from "./types";
import { renderDashboard } from "./views/dashboard";
import { renderPosts } from "./views/posts";
import { renderCompose } from "./views/compose";
import { renderAnalytics } from "./views/analytics";
import { renderSettings } from "./views/settings";
import { renderEditor } from "./views/editor";
import { renderStudioGate } from "./gate";

function parseHash(): ViewId {
  const h = globalThis.location.hash.replace(/^#/, "");
  if (
    h === "posts" ||
    h === "compose" ||
    h === "editor" ||
    h === "analytics" ||
    h === "settings"
  ) {
    return h;
  }
  return "dashboard";
}

const NAV: { id: ViewId; label: string }[] = [
  { id: "dashboard", label: "Overview" },
  { id: "posts", label: "Posts" },
  { id: "compose", label: "Compose" },
  { id: "analytics", label: "Insights" },
  { id: "settings", label: "Settings" },
];

function mountUnlockedCreatorApp(root: HTMLElement): void {
  let composeImportJson: string | null = null;
  const baseUrl = import.meta.env.BASE_URL ?? "/";

  function setComposeImport(json: string | null): void {
    composeImportJson = json;
  }

  function consumeImportJson(): string | null {
    const j = composeImportJson;
    composeImportJson = null;
    return j;
  }

  function navigate(v: ViewId, navOpts?: { editorSlug?: string }): void {
    if (v === "editor" && navOpts?.editorSlug) {
      sessionStorage.setItem("stillwater-editor-slug", navOpts.editorSlug);
    }
    globalThis.location.hash = v;
  }

  root.replaceChildren();

  const app = el("div", "cr-app");
  const sidebar = el("aside", "cr-sidebar");
  const brand = el("div", "cr-brand");
  const brandTitle = el("span", "cr-brand-title", "Stillwater");
  const brandSub = el("span", "cr-brand-sub", "Creator");
  brand.appendChild(brandTitle);
  brand.appendChild(brandSub);

  const nav = el("nav", "cr-nav");
  nav.setAttribute("aria-label", "Creator sections");

  const navButtons: { id: ViewId; btn: HTMLButtonElement }[] = [];

  for (const item of NAV) {
    const btn = el(
      "button",
      "cr-nav-item",
      item.label
    ) as HTMLButtonElement;
    btn.type = "button";
    btn.dataset.view = item.id;
    btn.addEventListener("click", () => navigate(item.id));
    nav.appendChild(btn);
    navButtons.push({ id: item.id, btn });
  }

  const sideFoot = el("div", "cr-sidebar-foot");
  const back = el(
    "a",
    "cr-sidebar-link",
    "← Public journal"
  ) as HTMLAnchorElement;
  back.href = journalIndexUrl(baseUrl);
  const home = el(
    "a",
    "cr-sidebar-link",
    "Landing page"
  ) as HTMLAnchorElement;
  home.href = stillwaterHome(baseUrl);
  sideFoot.appendChild(back);
  sideFoot.appendChild(home);

  sidebar.appendChild(brand);
  sidebar.appendChild(nav);
  sidebar.appendChild(sideFoot);

  const main = el("main", "cr-main");
  const mainInner = el("div", "cr-main-inner");

  main.appendChild(mainInner);
  app.appendChild(sidebar);
  app.appendChild(main);
  root.appendChild(app);

  async function render(): Promise<void> {
    const view = parseHash();
    for (const { id, btn } of navButtons) {
      if (id === view || (view === "editor" && id === "posts")) {
        btn.classList.add("is-active");
      } else {
        btn.classList.remove("is-active");
      }
    }

    clearChildren(mainInner);
    const manifests = await loadAllManifests();
    const drafts = getLocalDrafts();
    const draftSlugs = new Set(Object.keys(drafts));

    switch (view) {
      case "dashboard":
        renderDashboard(mainInner, {
          manifests,
          draftSlugs,
          navigate,
          baseUrl,
        });
        break;
      case "posts":
        renderPosts(mainInner, {
          manifests,
          baseUrl,
          navigate,
          setComposeImport,
        });
        break;
      case "compose":
        renderCompose(mainInner, { consumeImportJson });
        break;
      case "editor": {
        const slug = sessionStorage.getItem("stillwater-editor-slug");
        if (!slug) {
          globalThis.location.hash = "posts";
          return;
        }
        renderEditor(mainInner, {
          slug,
          manifests,
          navigate,
          baseUrl,
        });
        break;
      }
      case "analytics":
        renderAnalytics(mainInner, { manifests, baseUrl });
        break;
      case "settings":
        renderSettings(mainInner);
        break;
      default:
        renderDashboard(mainInner, {
          manifests,
          draftSlugs,
          navigate,
          baseUrl,
        });
    }

    document.title =
      view === "dashboard"
        ? "Creator — Stillwater"
        : view === "editor"
          ? "Edit post — Stillwater"
          : `${NAV.find((n) => n.id === view)?.label ?? "Creator"} — Stillwater`;
  }

  globalThis.addEventListener("hashchange", () => {
    void render();
  });
  void render();
}

export function mountCreatorApp(): void {
  const root = document.getElementById("creator-app");
  if (!root) return;

  if (!isStudioUnlocked()) {
    renderStudioGate(root, () => {
      mountUnlockedCreatorApp(root);
    });
    return;
  }

  mountUnlockedCreatorApp(root);
}
