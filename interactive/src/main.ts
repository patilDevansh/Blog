import "./style.css";
import {
  parseManifest,
  orderedTiles,
  type PublishManifest,
  type Tile,
} from "@schema/manifest";
import { applyTheme, readPrefersReducedMotion } from "@runtime/apply-theme";
import { renderBlocks } from "@runtime/render-blocks";
import { pickVariant, svgForVariant, type CardVariant } from "@runtime/grid-svgs";
import { mountInteraction } from "@widgets/index";

const manifestGlob = import.meta.glob<{ default: unknown }>(
  "../content/publishes/*/manifest.json",
  { eager: true }
);

const baseUrl = import.meta.env.BASE_URL ?? "/";

function slugFromKey(key: string): string {
  const m = key.match(/publishes\/([^/]+)\/manifest\.json$/);
  return m?.[1] ?? "";
}

function loadAllManifests(): Map<string, PublishManifest> {
  const map = new Map<string, PublishManifest>();
  for (const [path, mod] of Object.entries(manifestGlob)) {
    const slug = slugFromKey(path);
    if (!slug) continue;
    try {
      const raw =
        mod &&
        typeof mod === "object" &&
        "default" in mod &&
        (mod as { default: unknown }).default !== undefined
          ? (mod as { default: unknown }).default
          : mod;
      const m = parseManifest(raw);
      map.set(m.slug, m);
    } catch (e) {
      console.error(`Invalid manifest: ${path}`, e);
    }
  }
  return map;
}

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
  reducedMotion: boolean
): void {
  const section = document.createElement("section");
  section.className = "sw-entry-section";
  section.id = tile.id;
  const h = document.createElement("h2");
  h.className = "sw-entry-section-title";
  h.textContent = tile.label;
  section.appendChild(h);

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
}

function buildShell(): {
  shell: HTMLElement;
  topNav: HTMLElement;
  mainEl: HTMLElement;
  footer: HTMLElement;
} {
  const shell = document.createElement("div");
  shell.className = "sw-shell";

  const topNav = document.createElement("nav");
  topNav.className = "sw-top-nav";
  const logo = document.createElement("a");
  logo.className = "sw-logo";
  logo.href = `${baseUrl}stillwater.html`;
  logo.textContent = "Stillwater";
  const ul = document.createElement("ul");
  ul.className = "sw-nav-links";
  const links: [string, string][] = [
    ["Home", `${baseUrl}stillwater.html`],
    ["Journal", `${baseUrl}`],
    ["About", "#"],
    ["Contact", "#"],
  ];
  for (const [label, href] of links) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    li.appendChild(a);
    ul.appendChild(li);
  }
  topNav.appendChild(logo);
  topNav.appendChild(ul);

  const mainEl = document.createElement("main");
  mainEl.className = "sw-main sw-main--fluid";

  const footer = document.createElement("footer");
  footer.className = "sw-footer";
  const footLogo = document.createElement("div");
  footLogo.className = "footer-logo";
  footLogo.textContent = "Stillwater";
  const footerLinks = document.createElement("ul");
  footerLinks.className = "footer-links";
  const links: [string, string][] = [
    ["Journal", `${baseUrl}`],
    ["About", "#"],
    ["Contact", "#"],
  ];
  for (const [label, href] of links) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    li.appendChild(a);
    footerLinks.appendChild(li);
  }
  const footCopy = document.createElement("div");
  footCopy.className = "footer-copy";
  footCopy.textContent =
    "© " + new Date().getFullYear() + " Stillwater. Made with intention.";
  footer.appendChild(footLogo);
  footer.appendChild(footerLinks);
  footer.appendChild(footCopy);

  shell.appendChild(topNav);
  shell.appendChild(mainEl);
  shell.appendChild(footer);

  return { shell, topNav, mainEl, footer };
}

function mountJournalGrid(
  root: HTMLElement,
  manifests: Map<string, PublishManifest>
): void {
  applyTheme(root, undefined, readPrefersReducedMotion());
  root.innerHTML = "";
  root.className = "app-root";

  const { shell, mainEl } = buildShell();

  const hero = document.createElement("section");
  hero.className = "journal-hero";
  const heroBg = document.createElement("div");
  heroBg.className = "journal-hero-bg";
  const orb1 = document.createElement("div");
  orb1.className = "hero-orb hero-orb-1";
  const orb2 = document.createElement("div");
  orb2.className = "hero-orb hero-orb-2";
  const orb3 = document.createElement("div");
  orb3.className = "hero-orb hero-orb-3";
  const heroInner = document.createElement("div");
  heroInner.className = "journal-hero-inner";
  const eyebrow = document.createElement("p");
  eyebrow.className = "hero-eyebrow";
  eyebrow.textContent = "A space for the soul";
  const h1 = document.createElement("h1");
  h1.innerHTML = "Words to still<br>the <em>wandering</em> mind";
  const sub = document.createElement("p");
  sub.className = "journal-hero-sub";
  sub.textContent =
    "Reflections on presence, healing, and the quiet wisdom that lives within you.";
  const cta = document.createElement("a");
  cta.className = "hero-cta";
  cta.href = "#posts";
  cta.textContent = "Read the journal";
  heroInner.appendChild(eyebrow);
  heroInner.appendChild(h1);
  heroInner.appendChild(sub);
  heroInner.appendChild(cta);
  hero.appendChild(heroBg);
  hero.appendChild(orb1);
  hero.appendChild(orb2);
  hero.appendChild(orb3);
  hero.appendChild(heroInner);

  const sectionHead = document.createElement("div");
  sectionHead.className = "section-header";
  sectionHead.id = "posts";
  const shEyebrow = document.createElement("p");
  shEyebrow.className = "eyebrow";
  shEyebrow.textContent = "Latest posts";
  const shH2 = document.createElement("h2");
  shH2.textContent = "From the journal";
  sectionHead.appendChild(shEyebrow);
  sectionHead.appendChild(shH2);

  const grid = document.createElement("div");
  grid.className = "blog-grid";

  const list = [...manifests.entries()].sort(
    (a, b) =>
      new Date(b[1].createdAt).getTime() -
      new Date(a[1].createdAt).getTime()
  );

  list.forEach(([slug, m], index) => {
    const variant = pickVariant(m.cardVariant as CardVariant | undefined, index);
    const a = document.createElement("a");
    a.className = "blog-tile";
    a.href = `${baseUrl}?slug=${encodeURIComponent(slug)}`;

    const head = document.createElement("div");
    head.className = `tile-header ${variant}`;
    head.innerHTML = svgForVariant(variant);

    const body = document.createElement("div");
    body.className = "tile-body";
    const cat = document.createElement("div");
    cat.className = "tile-cat";
    cat.textContent = m.category ?? "Journal";
    const title = document.createElement("div");
    title.className = "tile-title";
    title.textContent = m.title;
    const excerpt = document.createElement("div");
    excerpt.className = "tile-excerpt";
    excerpt.textContent = m.summary;
    const meta = document.createElement("div");
    meta.className = "tile-meta";
    meta.textContent = formatMetaLine(m);

    body.appendChild(cat);
    body.appendChild(title);
    body.appendChild(excerpt);
    body.appendChild(meta);
    a.appendChild(head);
    a.appendChild(body);
    grid.appendChild(a);
  });

  mainEl.appendChild(hero);
  mainEl.appendChild(sectionHead);
  mainEl.appendChild(grid);

  // Quote band (same spirit as `index 2.html`)
  const quoteBand = document.createElement("div");
  quoteBand.className = "quote-band";
  const quote = document.createElement("blockquote");
  quote.textContent = "The quieter you become, the more you are able to hear.";
  const cite = document.createElement("cite");
  cite.textContent = "— Rumi";
  quoteBand.appendChild(quote);
  quoteBand.appendChild(cite);
  mainEl.appendChild(quoteBand);

  // Newsletter (static UI; no backend yet)
  const newsletter = document.createElement("div");
  newsletter.className = "newsletter";
  const nwEyebrow = document.createElement("p");
  nwEyebrow.className = "eyebrow";
  nwEyebrow.textContent = "Stay connected";
  const nwH3 = document.createElement("h3");
  nwH3.textContent = "Wisdom in your inbox";
  const nwP = document.createElement("p");
  nwP.textContent =
    "New reflections delivered gently, twice a month. No noise. Just soul.";
  const form = document.createElement("div");
  form.className = "newsletter-form";
  const input = document.createElement("input");
  input.type = "email";
  input.placeholder = "your@email.com";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Subscribe";
  form.appendChild(input);
  form.appendChild(btn);
  newsletter.appendChild(nwEyebrow);
  newsletter.appendChild(nwH3);
  newsletter.appendChild(nwP);
  newsletter.appendChild(form);
  mainEl.appendChild(newsletter);

  root.appendChild(shell);
  document.title = "Stillwater — A Spiritual Journal";
}

function mountPostView(root: HTMLElement, manifest: PublishManifest): void {
  applyTheme(root, manifest.theme, readPrefersReducedMotion());

  const prefersMq = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  prefersMq?.addEventListener?.("change", () => {
    applyTheme(root, manifest.theme, readPrefersReducedMotion());
  });

  root.innerHTML = "";
  root.className = "app-root";

  const { shell, mainEl } = buildShell();

  const back = document.createElement("a");
  back.className = "sw-back";
  back.href = `${baseUrl}`;
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

  for (const tile of tiles) {
    renderTileSection(body, tile, rm);
  }

  article.appendChild(back);
  article.appendChild(header);
  article.appendChild(body);
  mainEl.appendChild(article);
  root.appendChild(shell);
}

function main(): void {
  const manifests = loadAllManifests();
  if (manifests.size === 0) {
    document.body.innerHTML =
      "<p>No posts found. Add content/publishes/&lt;slug&gt;/manifest.json</p>";
    return;
  }

  const params = new URLSearchParams(globalThis.location.search);
  const slugParam = params.get("slug");

  const app = document.getElementById("app");
  if (!app) return;

  if (!slugParam) {
    mountJournalGrid(app, manifests);
    return;
  }

  const manifest = manifests.get(slugParam);
  if (!manifest) {
    app.innerHTML = `<p class="sw-error">No post “${slugParam}”. <a href="${baseUrl}">Back to journal</a></p>`;
    document.title = "Not found — Stillwater";
    return;
  }

  document.title = `${manifest.title} — Stillwater`;
  mountPostView(app, manifest);
}

main();
