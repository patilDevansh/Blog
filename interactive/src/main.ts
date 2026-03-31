import "./style.css";
import {
  orderedTiles,
  type PublishManifest,
  type Tile,
} from "@schema/manifest";
import { applyTheme, readPrefersReducedMotion } from "@runtime/apply-theme";
import { renderBlocks } from "@runtime/render-blocks";
import { mountInteraction } from "@widgets/index";
import { loadAllManifests, mergeFromDatabase } from "./lib/load-publishes";
import { buildShell } from "./shell";

const baseUrl = import.meta.env.BASE_URL ?? "/";

function formatJournalDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMetaLine(manifest: PublishManifest): string {
  const date = formatJournalDate(manifest.createdAt);
  if (manifest.readTimeMinutes != null) {
    return `${date} · ${manifest.readTimeMinutes} min read`;
  }
  return date;
}

function renderTileSection(
  container: HTMLElement,
  tile: Tile,
  reducedMotion: boolean,
  showTitle = true
): HTMLElement {
  const section = document.createElement("section");
  section.className = "sw-entry-section";
  section.id = tile.id;
  section.dataset.sectionId = tile.id;

  if (showTitle) {
    const h = document.createElement("h2");
    h.className = "sw-entry-section-title";
    h.textContent = tile.label;
    section.appendChild(h);
  }

  const blocksWrap = document.createElement("div");
  blocksWrap.className = "tile-blocks";
  blocksWrap.appendChild(renderBlocks(tile.blocks));
  section.appendChild(blocksWrap);

  if (tile.interaction) {
    const interMount = document.createElement("div");
    interMount.className = "tile-interaction";
    mountInteraction(interMount, tile.interaction, { reducedMotion });
    section.appendChild(interMount);
  }

  container.appendChild(section);
  return section;
}

function buildPostJumpNav(
  tiles: Tile[],
  options: { reducedMotion: boolean }
): { nav: HTMLElement; links: HTMLAnchorElement[] } {
  const nav = document.createElement("nav");
  nav.className = "sw-post-jump";
  nav.setAttribute("aria-label", "Sections in this article");

  const inner = document.createElement("div");
  inner.className = "sw-post-jump-inner";

  const links: HTMLAnchorElement[] = [];
  tiles.forEach((tile, i) => {
    if (i > 0) {
      const sep = document.createElement("span");
      sep.className = "sw-post-jump-sep";
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = "·";
      inner.appendChild(sep);
    }
    const a = document.createElement("a");
    a.className = "sw-post-jump-link";
    a.href = `#${tile.id}`;
    a.textContent = tile.label;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.getElementById(tile.id);
      if (!target) return;
      target.scrollIntoView({
        behavior: options.reducedMotion ? "auto" : "smooth",
        block: "start",
      });
      const { pathname, search } = globalThis.location;
      globalThis.history.replaceState(
        null,
        "",
        `${pathname}${search}#${tile.id}`
      );
    });
    inner.appendChild(a);
    links.push(a);
  });

  nav.appendChild(inner);
  return { nav, links };
}

function updateReadingProgress(bar: HTMLElement): void {
  const scrollTop =
    globalThis.scrollY ?? document.documentElement.scrollTop ?? 0;
  const scrollable =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  const p =
    scrollable <= 0 ? 1 : Math.min(1, Math.max(0, scrollTop / scrollable));
  bar.style.transform = `scaleX(${p})`;
}

function attachScrollReveal(
  body: HTMLElement,
  reducedMotion: boolean
): () => void {
  if (reducedMotion) return () => {};

  const selector =
    ".block-paragraph, .block-quote, .block-divider";
  const els = Array.from(body.querySelectorAll<HTMLElement>(selector));
  if (!els.length) return () => {};

  const viewportH = globalThis.innerHeight ?? 800;

  // Mark only below-fold elements as pending so above-fold ones show immediately
  const pending: HTMLElement[] = [];
  for (const el of els) {
    const rect = el.getBoundingClientRect();
    if (rect.top < viewportH * 0.92) {
      // Already in view — show immediately, no animation
      el.classList.add("sw-revealed");
    } else {
      el.classList.add("sw-pending");
      pending.push(el);
    }
  }

  if (!pending.length) return () => {};

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.classList.add("sw-revealed");
          io.unobserve(target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );

  for (const el of pending) io.observe(el);

  return () => io.disconnect();
}

let postViewTeardown: (() => void) | null = null;

function teardownPostView(): void {
  postViewTeardown?.();
  postViewTeardown = null;
}

function attachPostReadingChrome(options: {
  topNav: HTMLElement;
  progressBar: HTMLElement;
  sectionEls: HTMLElement[];
  jumpLinks: HTMLAnchorElement[];
  reducedMotion: boolean;
  onTeardown?: () => void;
}): void {
  const ac = new AbortController();
  const { signal } = ac;

  const onScrollOrResize = (): void => {
    updateReadingProgress(options.progressBar);
  };
  onScrollOrResize();
  globalThis.addEventListener("scroll", onScrollOrResize, {
    passive: true,
    signal,
  });
  globalThis.addEventListener("resize", onScrollOrResize, {
    passive: true,
    signal,
  });

  const onHashChange = (): void => {
    const id = globalThis.location.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({
        behavior: options.reducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  };
  globalThis.addEventListener("hashchange", onHashChange, { signal });

  const setActiveLink = (id: string | null): void => {
    for (const a of options.jumpLinks) {
      const match = a.getAttribute("href") === `#${id}`;
      if (match) {
        a.classList.add("is-active");
        a.setAttribute("aria-current", "location");
      } else {
        a.classList.remove("is-active");
        a.removeAttribute("aria-current");
      }
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target instanceof HTMLElement) {
        const id = visible.target.dataset.sectionId ?? visible.target.id;
        setActiveLink(id || null);
      }
    },
    {
      root: null,
      rootMargin: "-12% 0px -60% 0px",
      threshold: [0, 0.15, 0.35, 0.55],
    }
  );

  for (const el of options.sectionEls) {
    io.observe(el);
  }

  postViewTeardown = () => {
    ac.abort();
    io.disconnect();
    options.topNav.classList.remove("sw-top-nav--with-progress");
    const track = options.topNav.querySelector(".sw-read-progress-track");
    track?.remove();
    options.onTeardown?.();
  };
}

function mountPostView(root: HTMLElement, manifest: PublishManifest): void {
  teardownPostView();
  applyTheme(root, manifest.theme, readPrefersReducedMotion());

  const prefersMq = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  prefersMq?.addEventListener?.("change", () => {
    applyTheme(root, manifest.theme, readPrefersReducedMotion());
  });

  root.innerHTML = "";
  root.className = "app-root";

  const { shell, topNav, mainEl } = buildShell();

  topNav.classList.add("sw-top-nav--with-progress");
  const progressTrack = document.createElement("div");
  progressTrack.className = "sw-read-progress-track";
  progressTrack.setAttribute("aria-hidden", "true");
  const progressBar = document.createElement("div");
  progressBar.className = "sw-read-progress-bar";
  progressTrack.appendChild(progressBar);
  topNav.appendChild(progressTrack);

  const back = document.createElement("a");
  back.className = "sw-back";
  back.href = `${baseUrl}journal.html`;
  back.textContent = "← Back to journal";

  const article = document.createElement("article");
  article.className = "sw-post-article";

  const header = document.createElement("header");
  header.className = "sw-post-head";
  const hEyebrow = document.createElement("p");
  hEyebrow.className = "sw-hero-eyebrow";
  hEyebrow.textContent = manifest.category ?? "Journal";
  const h1 = document.createElement("h1");
  h1.className = "sw-post-title";
  h1.textContent = manifest.title;
  const summary = document.createElement("p");
  summary.className = "sw-post-summary";
  summary.textContent = manifest.summary;
  const meta = document.createElement("p");
  meta.className = "sw-post-meta";
  meta.textContent = formatMetaLine(manifest);
  header.appendChild(hEyebrow);
  header.appendChild(h1);
  header.appendChild(summary);
  header.appendChild(meta);

  const body = document.createElement("div");
  body.className = "sw-post-body";

  const tiles = orderedTiles(manifest);
  const rm =
    readPrefersReducedMotion() || manifest.theme?.motion === "none";

  const { nav: jumpNav, links: jumpLinks } = buildPostJumpNav(tiles, {
    reducedMotion: rm,
  });
  const showJumpNav = tiles.length > 1;

  const sectionEls: HTMLElement[] = [];
  const showSectionTitles = tiles.length > 1;
  for (const tile of tiles) {
    sectionEls.push(renderTileSection(body, tile, rm, showSectionTitles));
  }

  article.appendChild(back);
  article.appendChild(header);
  if (showJumpNav) article.appendChild(jumpNav);
  article.appendChild(body);
  mainEl.appendChild(article);
  root.appendChild(shell);

  const teardownReveal = attachScrollReveal(body, rm);

  attachPostReadingChrome({
    topNav,
    progressBar,
    sectionEls,
    jumpLinks: showJumpNav ? jumpLinks : [],
    reducedMotion: rm,
    onTeardown: teardownReveal,
  });

  const initialHash = globalThis.location.hash.slice(1);
  if (initialHash) {
    const target = document.getElementById(initialHash);
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({
          behavior: rm ? "auto" : "smooth",
          block: "start",
        });
      });
    }
  }
}

async function main(): Promise<void> {
  const params = new URLSearchParams(globalThis.location.search);
  const slugParam = params.get("slug");

  const app = document.getElementById("app");
  if (!app) return;

  if (!slugParam) {
    globalThis.location.replace(`${baseUrl}journal.html`);
    return;
  }

  // Try bundled manifests first (instant, no network)
  const manifests = loadAllManifests();
  let manifest = manifests.get(slugParam);

  // If not in the bundle, this post was published via the creator after
  // the last deploy — fetch it live from the database
  if (!manifest) {
    await mergeFromDatabase(manifests);
    manifest = manifests.get(slugParam);
  }

  if (!manifest) {
    teardownPostView();
    app.innerHTML = `<p class="sw-error">No post "${slugParam}". <a href="${baseUrl}journal.html">Back to journal</a></p>`;
    document.title = "Not found — Stillwater";
    return;
  }

  document.title = `${manifest.title} — Stillwater`;
  mountPostView(app, manifest);
}

void main();
