import { loadAllManifests } from "../lib/publishes";
import { journalIndexUrl, stillwaterHome } from "../lib/site-paths";
import {
  getLocalDrafts,
  isStudioUnlocked,
  lockCreatorSession,
} from "./storage";
import { el, clearChildren } from "./ui";
import type { ViewId } from "./types";
import { renderDashboard } from "./views/dashboard";
import { renderPosts } from "./views/posts";
import { renderCompose } from "./views/compose";
import { renderAnalytics } from "./views/analytics";
import { renderSettings } from "./views/settings";
import { renderEditor } from "./views/editor";
import { renderWritingBoard } from "./views/writing-board";
import { renderReaderLetters } from "./views/reader-letters";
import { renderSubscribers } from "./views/subscribers";
import { renderGlossary } from "./views/glossary";
import { renderReadingPaths } from "./views/reading-paths";
import { renderSources } from "./views/sources";
import { renderDeepAnalytics } from "./views/deep-analytics";
import { renderLineageMasters } from "./views/lineage-masters";
import { renderInternalNotes } from "./views/internal-notes";
import { renderComments } from "./views/comments";
import { renderMediaLibrary } from "./views/media-library";
import { renderStudioGate } from "./gate";

function safeJsonArrayLen(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const a = JSON.parse(raw) as unknown;
    return Array.isArray(a) ? a.length : 0;
  } catch {
    return 0;
  }
}

function unreadLettersCount(): number {
  try {
    const raw = localStorage.getItem("stillwater-reader-letters");
    if (!raw) return 0;
    const letters = JSON.parse(raw) as { read?: boolean; archived?: boolean }[];
    return letters.filter((l) => !l.read && !l.archived).length;
  } catch {
    return 0;
  }
}

function navBadgeFor(
  id: ViewId
): { text: string; tone: "warn" | "info" | "new" } | undefined {
  if (id === "writing-board") {
    const n = safeJsonArrayLen("stillwater-writing-board");
    if (n > 0) return { text: String(n), tone: "new" };
    return undefined;
  }
  if (id === "reader-letters") {
    const u = unreadLettersCount();
    if (u > 0) return { text: String(u), tone: "warn" };
    return undefined;
  }
  if (id === "subscribers") {
    const n = safeJsonArrayLen("stillwater-subscribers");
    return { text: n > 0 ? String(n) : "142", tone: "info" };
  }
  if (id === "comments") return { text: "3", tone: "warn" };
  return undefined;
}

function parseHash(): ViewId {
  const h = globalThis.location.hash.replace(/^#/, "");
  const valid: ViewId[] = [
    "dashboard",
    "posts",
    "compose",
    "editor",
    "analytics",
    "settings",
    "writing-board",
    "reader-letters",
    "subscribers",
    "glossary",
    "reading-paths",
    "sources",
    "deep-analytics",
    "lineage-masters",
    "internal-notes",
    "comments",
    "media-library",
  ];
  return (valid.includes(h as ViewId) ? h : "dashboard") as ViewId;
}

type NavItem = {
  id: ViewId;
  label: string;
  group?: string;
};

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", group: "Write" },
  { id: "writing-board", label: "Writing Board", group: "Write" },
  { id: "compose", label: "Post Editor", group: "Write" },
  { id: "posts", label: "Post Library", group: "Write" },
  { id: "glossary", label: "Glossary & Terms", group: "Knowledge" },
  { id: "lineage-masters", label: "Lineage Masters", group: "Knowledge" },
  { id: "sources", label: "Sources & Refs", group: "Knowledge" },
  { id: "internal-notes", label: "Internal Notes", group: "Knowledge" },
  { id: "reading-paths", label: "Reading Paths", group: "Knowledge" },
  { id: "reader-letters", label: "Reader Letters", group: "Audience" },
  { id: "subscribers", label: "Subscribers", group: "Audience" },
  { id: "comments", label: "Comments", group: "Audience" },
  { id: "deep-analytics", label: "Deep Analytics", group: "Audience" },
  { id: "media-library", label: "Media Library", group: "Site" },
  { id: "settings", label: "Site Settings", group: "Site" },
];

function viewIsActive(navId: ViewId, current: ViewId): boolean {
  if (navId === current) return true;
  if (current === "editor" && navId === "compose") return true;
  return false;
}

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

  const app = el("div", "cr-app cr-app--studio");
  const topbar = el("div", "cr-topbar");
  const brandTop = el("div", "cr-topbar-brand");
  const still = document.createElement("span");
  still.className = "cr-topbar-brand__still";
  still.textContent = "Still";
  const w = document.createElement("em");
  w.className = "cr-topbar-brand__em";
  w.textContent = "w";
  const ater = document.createElement("span");
  ater.className = "cr-topbar-brand__rest";
  ater.textContent = "ater";
  brandTop.appendChild(still);
  brandTop.appendChild(w);
  brandTop.appendChild(ater);

  const center = el("div", "cr-topbar-center", "Creator Studio");
  const right = el("div", "cr-topbar-right");
  const live = el("a", "cr-topbar-view-btn", "View live site ↗") as HTMLAnchorElement;
  live.href = journalIndexUrl(baseUrl);
  live.target = "_blank";
  live.rel = "noopener noreferrer";
  const avatar = el("div", "cr-topbar-avatar", "SW");
  avatar.title = "Creator";
  right.appendChild(live);
  right.appendChild(avatar);
  topbar.appendChild(brandTop);
  topbar.appendChild(center);
  topbar.appendChild(right);

  const studioBody = el("div", "cr-studio-body");

  const sidebar = el("aside", "cr-sidebar");
  const brand = el("div", "cr-brand");
  const brandTitle = el("span", "cr-brand-title", "Stillwater");
  const brandSub = el("span", "cr-brand-sub", "Creator");
  brand.appendChild(brandTitle);
  brand.appendChild(brandSub);

  const nav = el("nav", "cr-nav");
  nav.setAttribute("aria-label", "Creator sections");

  const navButtons: { id: ViewId; btn: HTMLButtonElement; badgeEl: HTMLElement | null }[] = [];
  let lastGroup: string | undefined;

  for (const item of NAV) {
    if (item.group && item.group !== lastGroup) {
      const groupLabel = el("p", "cr-nav-group", item.group);
      nav.appendChild(groupLabel);
      lastGroup = item.group;
    } else if (!item.group && lastGroup !== undefined) {
      lastGroup = undefined;
    }
    const btn = el("button", "cr-nav-item") as HTMLButtonElement;
    btn.type = "button";
    btn.dataset.view = item.id;
    const labelSpan = el("span", "cr-nav-item__label", item.label);
    btn.appendChild(labelSpan);
    const badge = navBadgeFor(item.id);
    let badgeEl: HTMLElement | null = null;
    if (badge) {
      badgeEl = el(
        "span",
        `cr-nav-badge cr-nav-badge--${badge.tone}`,
        badge.text
      );
      btn.appendChild(badgeEl);
    }
    btn.addEventListener("click", () => navigate(item.id));
    nav.appendChild(btn);
    navButtons.push({ id: item.id, btn, badgeEl });
  }

  const sideFoot = el("div", "cr-sidebar-foot");
  const userRow = el("div", "cr-sidebar-user");
  const av = el("div", "cr-sidebar-user-avatar", "SW");
  const userText = el("div", "cr-sidebar-user-text");
  userText.appendChild(el("div", "cr-sidebar-user-name", "Stillwater"));
  userText.appendChild(el("div", "cr-sidebar-user-role", "Owner · Admin"));
  userRow.appendChild(av);
  userRow.appendChild(userText);
  sideFoot.appendChild(userRow);

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
  const signOut = el(
    "button",
    "cr-sidebar-link cr-sidebar-signout",
    "Sign out"
  ) as HTMLButtonElement;
  signOut.type = "button";
  signOut.addEventListener("click", () => {
    lockCreatorSession();
    globalThis.location.reload();
  });

  sideFoot.appendChild(back);
  sideFoot.appendChild(home);
  sideFoot.appendChild(signOut);

  sidebar.appendChild(brand);
  sidebar.appendChild(nav);
  sidebar.appendChild(sideFoot);

  const main = el("main", "cr-main");
  const mainInner = el("div", "cr-main-inner");

  main.appendChild(mainInner);
  studioBody.appendChild(sidebar);
  studioBody.appendChild(main);
  app.appendChild(topbar);
  app.appendChild(studioBody);
  root.appendChild(app);

  function updateNavBadges(): void {
    for (const { id, badgeEl } of navButtons) {
      if (!badgeEl) continue;
      const b = navBadgeFor(id);
      if (b) badgeEl.textContent = b.text;
    }
  }

  async function render(): Promise<void> {
    const view = parseHash();
    updateNavBadges();
    for (const { id, btn } of navButtons) {
      btn.classList.toggle("is-active", viewIsActive(id, view));
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
      case "writing-board":
        renderWritingBoard(mainInner);
        break;
      case "reader-letters":
        renderReaderLetters(mainInner, { navigate });
        break;
      case "subscribers":
        renderSubscribers(mainInner);
        break;
      case "glossary":
        renderGlossary(mainInner);
        break;
      case "reading-paths":
        renderReadingPaths(mainInner, { manifests });
        break;
      case "sources":
        renderSources(mainInner);
        break;
      case "deep-analytics":
        renderDeepAnalytics(mainInner, { manifests, baseUrl });
        break;
      case "lineage-masters":
        renderLineageMasters(mainInner);
        break;
      case "internal-notes":
        renderInternalNotes(mainInner);
        break;
      case "comments":
        renderComments(mainInner);
        break;
      case "media-library":
        renderMediaLibrary(mainInner);
        break;
      default:
        renderDashboard(mainInner, {
          manifests,
          draftSlugs,
          navigate,
          baseUrl,
        });
    }

    const label =
      view === "dashboard"
        ? "Creator"
        : view === "editor"
          ? "Edit post"
          : NAV.find((n) => n.id === view)?.label ?? "Creator";
    document.title = `${label} — Stillwater`;
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
