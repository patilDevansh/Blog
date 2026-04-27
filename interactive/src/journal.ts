import "./style.css";
import type { PublishManifest } from "@schema/manifest";
import { applyTheme, readPrefersReducedMotion } from "@runtime/apply-theme";
import { buildShell } from "./shell";
import {
  loadAllManifests,
  mergeFromDatabase,
  sortByCreatedDesc,
} from "./lib/load-publishes";
import { firstImageFromManifest } from "./lib/cover-image";
import { journalPostUrl } from "./lib/site-paths";
import { buildConnectSection, wireConnectForms } from "./connect-forms";

const baseUrl = import.meta.env.BASE_URL ?? "/";

function formatJournalDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function postMatches(m: PublishManifest, q: string): boolean {
  const hay = `${m.title} ${m.summary} ${m.category ?? ""}`.toLowerCase();
  return hay.includes(q);
}

function appendFeaturedCard(
  wrap: HTMLElement,
  slug: string,
  m: PublishManifest
): void {
  const card = document.createElement("article");
  card.className = "sw-journal-featured-card";

  const link = document.createElement("a");
  link.className = "sw-journal-featured-link";
  link.href = journalPostUrl(baseUrl, slug);

  const body = document.createElement("div");
  body.className = "sw-journal-featured-body";

  const eyebrow = document.createElement("p");
  eyebrow.className = "sw-journal-featured-eyebrow";
  eyebrow.textContent = "Most recent entry";

  const h2 = document.createElement("h2");
  h2.className = "sw-journal-featured-title";
  h2.textContent = m.title;

  const meta = document.createElement("p");
  meta.className = "sw-journal-featured-meta";
  meta.append("Stillwater · ", formatJournalDate(m.createdAt), " · ");
  const catSpan = document.createElement("span");
  catSpan.textContent = m.category ?? "Journal";
  meta.appendChild(catSpan);

  const excerpt = document.createElement("p");
  excerpt.className = "sw-journal-featured-excerpt";
  excerpt.textContent = m.summary;

  const cta = document.createElement("span");
  cta.className = "sw-journal-featured-cta";
  cta.textContent = "Read full piece →";

  body.append(eyebrow, h2, meta, excerpt, cta);

  const media = document.createElement("div");
  media.className = "sw-journal-featured-media";
  const cover = firstImageFromManifest(m);
  if (cover) {
    const img = document.createElement("img");
    img.src = cover.src;
    img.alt = cover.alt;
    img.width = 640;
    img.height = 480;
    img.loading = "eager";
    media.appendChild(img);
  } else {
    const ph = document.createElement("div");
    ph.className = "sw-journal-cover-ph";
    ph.setAttribute("aria-hidden", "true");
    media.appendChild(ph);
  }

  link.append(body, media);
  card.appendChild(link);
  wrap.appendChild(card);
}

function appendGridTile(
  list: HTMLUListElement,
  slug: string,
  m: PublishManifest
): void {
  const li = document.createElement("li");
  li.className = "sw-journal-tile";

  const a = document.createElement("a");
  a.className = "sw-journal-tile-link";
  a.href = journalPostUrl(baseUrl, slug);

  const media = document.createElement("div");
  media.className = "sw-journal-tile-media";
  const cover = firstImageFromManifest(m);
  if (cover) {
    const img = document.createElement("img");
    img.src = cover.src;
    img.alt = cover.alt;
    img.width = 640;
    img.height = 480;
    img.loading = "lazy";
    media.appendChild(img);
  } else {
    const ph = document.createElement("div");
    ph.className = "sw-journal-cover-ph";
    ph.setAttribute("aria-hidden", "true");
    media.appendChild(ph);
  }

  const tileBody = document.createElement("div");
  tileBody.className = "sw-journal-tile-body";

  const cat = document.createElement("p");
  cat.className = "sw-journal-tile-cat";
  cat.textContent = (m.category ?? "Journal").toUpperCase();

  const title = document.createElement("h2");
  title.className = "sw-journal-tile-title";
  title.textContent = m.title;

  const date = document.createElement("p");
  date.className = "sw-journal-tile-date";
  date.textContent = formatJournalDate(m.createdAt);

  tileBody.append(cat, title, date);
  a.append(media, tileBody);
  li.appendChild(a);
  list.appendChild(li);
}

function mountJournalArchive(
  root: HTMLElement,
  manifests: Map<string, PublishManifest>
): void {
  applyTheme(root, undefined, readPrefersReducedMotion());
  root.innerHTML = "";
  root.className = "app-root";

  const { shell, mainEl } = buildShell("journal");

  const page = document.createElement("div");
  page.className = "sw-journal-archive";

  const stage = document.createElement("div");
  stage.className = "sw-journal-stage";
  stage.setAttribute("aria-hidden", "true");
  for (const c of ["sw-journal-orb sw-journal-orb-1", "sw-journal-orb sw-journal-orb-2", "sw-journal-orb sw-journal-orb-3"]) {
    const orb = document.createElement("div");
    orb.className = c;
    stage.appendChild(orb);
  }
  page.appendChild(stage);

  const entries = sortByCreatedDesc([...manifests.entries()]);
  const featuredWrap = document.createElement("div");
  featuredWrap.className = "sw-journal-featured-wrap";
  featuredWrap.id = "sw-journal-featured";

  const searchSection = document.createElement("section");
  searchSection.className = "sw-journal-search-section";
  searchSection.setAttribute("aria-label", "Search archive");

  const lede = document.createElement("p");
  lede.className = "sw-journal-lede";
  lede.textContent =
    "Search the archive by title, theme, or summary. Below are the rest of the entries—the newest piece always lives in the card above when you are not searching.";

  const searchWrap = document.createElement("div");
  searchWrap.className = "sw-journal-search-wrap";
  const qLabel = document.createElement("label");
  qLabel.htmlFor = "sw-journal-q";
  qLabel.textContent = "Search posts";
  const searchIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  searchIcon.setAttribute("class", "sw-journal-search-icon");
  searchIcon.setAttribute("viewBox", "0 0 24 24");
  searchIcon.setAttribute("fill", "none");
  searchIcon.setAttribute("stroke", "currentColor");
  searchIcon.setAttribute("stroke-width", "1.75");
  searchIcon.setAttribute("aria-hidden", "true");
  const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c.setAttribute("cx", "10.5");
  c.setAttribute("cy", "10.5");
  c.setAttribute("r", "6.5");
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", "M15 15 L21 21");
  p.setAttribute("stroke-linecap", "round");
  searchIcon.append(c, p);

  const input = document.createElement("input");
  input.type = "search";
  input.id = "sw-journal-q";
  input.className = "sw-journal-search-input";
  input.placeholder = "Presence, winter, silence, path…";
  input.autocomplete = "off";

  searchWrap.append(qLabel, searchIcon, input);
  searchSection.append(lede, searchWrap);

  const fleuron = document.createElement("span");
  fleuron.className = "sw-journal-fleuron";
  fleuron.setAttribute("aria-hidden", "true");
  fleuron.textContent = "⁘";

  const resultBar = document.createElement("div");
  resultBar.className = "sw-journal-result-bar";
  const resultMeta = document.createElement("p");
  resultMeta.className = "sw-journal-result-meta";
  const strong = document.createElement("strong");
  strong.id = "sw-journal-count";
  strong.textContent = "0";
  resultMeta.append(strong, " ", "pieces in view");
  const hint = document.createElement("p");
  hint.className = "sw-journal-hint";
  hint.textContent =
    "Searching shows every match, including the latest if it fits.";
  resultBar.append(resultMeta, hint);

  const gridWrap = document.createElement("div");
  gridWrap.className = "sw-journal-grid-wrap";
  const gridTitle = document.createElement("h2");
  gridTitle.className = "sw-journal-grid-title";
  gridTitle.id = "sw-journal-grid-heading";
  gridTitle.textContent = "From the journal";
  const list = document.createElement("ul");
  list.className = "sw-journal-grid";
  list.id = "sw-journal-grid";
  list.setAttribute("role", "list");
  gridWrap.append(gridTitle, list);

  const empty = document.createElement("p");
  empty.className = "sw-journal-empty";
  empty.id = "sw-journal-empty";
  empty.hidden = true;
  empty.textContent = "The well is quiet—nothing matches. Try another word.";

  page.append(
    featuredWrap,
    searchSection,
    fleuron,
    resultBar,
    gridWrap,
    empty
  );
  mainEl.appendChild(page);

  const connectSection = buildConnectSection();
  mainEl.appendChild(connectSection);
  wireConnectForms(connectSection);

  root.appendChild(shell);
  document.title = "Stillwater — Journal";

  function render(): void {
    const q = input.value.trim().toLowerCase();

    if (entries.length === 0) {
      featuredWrap.hidden = true;
      gridTitle.textContent = "From the journal";
      list.innerHTML = "";
      strong.textContent = "0";
      empty.hidden = false;
      return;
    }

    const head = entries[0];
    if (!head) return;
    const [featSlug, featured] = head;
    const rest = entries.slice(1);

    if (q) {
      featuredWrap.hidden = true;
      gridTitle.textContent = "Results";
      const filtered = sortByCreatedDesc(
        [...manifests.entries()].filter(([, m]) => postMatches(m, q))
      );
      list.innerHTML = "";
      for (const [s, m] of filtered) {
        appendGridTile(list, s, m);
      }
      strong.textContent = String(filtered.length);
      empty.hidden = filtered.length > 0;
    } else {
      featuredWrap.hidden = false;
      featuredWrap.innerHTML = "";
      appendFeaturedCard(featuredWrap, featSlug, featured);
      gridTitle.textContent = "From the journal";
      list.innerHTML = "";
      for (const [s, m] of rest) {
        appendGridTile(list, s, m);
      }
      strong.textContent = String(rest.length);
      empty.hidden = true;
    }
  }

  input.addEventListener("input", render);
  render();
}

async function main(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) return;

  // Render immediately from bundled manifests (zero network wait)
  const manifests = loadAllManifests();
  if (manifests.size > 0) {
    mountJournalArchive(app, manifests);
  }

  // Merge DB posts in the background and re-render with full set.
  await mergeFromDatabase(manifests);
  if (manifests.size > 0) {
    mountJournalArchive(app, manifests);
  } else {
    app.innerHTML = "<p class=\"sw-error\">No posts found.</p>";
  }
}

void main();
