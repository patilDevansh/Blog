import "./style.css";
import {
  parseManifest,
  type PublishManifest,
  type Tile,
} from "@schema/manifest";
import { applyTheme, readPrefersReducedMotion } from "@runtime/apply-theme";
import { renderBlocks } from "@runtime/render-blocks";
import { clearSliderTimers, mountInteraction } from "@widgets/index";

const manifestGlob = import.meta.glob<{ default: unknown }>(
  "../content/publishes/*/manifest.json",
  { eager: true }
);

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

function getInitialSlug(
  manifests: Map<string, PublishManifest>,
  requested: string | null
): string {
  if (requested && manifests.has(requested)) return requested;
  const first = [...manifests.keys()][0];
  if (!first) throw new Error("No valid manifests in content/publishes/");
  return first;
}

function disposeTileMount(el: HTMLElement): void {
  clearSliderTimers(el);
  el.replaceChildren();
}

function renderTile(
  mount: HTMLElement,
  tile: Tile,
  reducedMotion: boolean
): void {
  disposeTileMount(mount);
  const article = document.createElement("article");
  article.className = "tile-article";
  article.setAttribute("aria-label", tile.label);

  const blocksWrap = document.createElement("div");
  blocksWrap.className = "tile-blocks";
  blocksWrap.appendChild(renderBlocks(tile.blocks));
  article.appendChild(blocksWrap);

  if (tile.interaction) {
    const interMount = document.createElement("div");
    interMount.className = "tile-interaction";
    mountInteraction(interMount, tile.interaction, { reducedMotion });
    article.appendChild(interMount);
  }

  mount.appendChild(article);
}

function mountApp(root: HTMLElement, manifest: PublishManifest): void {
  let tileIndex = 0;

  applyTheme(root, manifest.theme, readPrefersReducedMotion());

  const prefersMq = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  prefersMq?.addEventListener?.("change", () => {
    applyTheme(root, manifest.theme, readPrefersReducedMotion());
  });

  root.innerHTML = "";
  root.className = "app-root";

  const header = document.createElement("header");
  header.className = "app-header";
  const title = document.createElement("h1");
  title.className = "app-title";
  title.textContent = manifest.title;
  const summary = document.createElement("p");
  summary.className = "app-summary";
  summary.textContent = manifest.summary;
  const meta = document.createElement("time");
  meta.className = "app-meta";
  meta.dateTime = manifest.createdAt;
  meta.textContent = new Date(manifest.createdAt).toLocaleDateString(undefined, {
    dateStyle: "long",
  });
  header.appendChild(title);
  header.appendChild(summary);
  header.appendChild(meta);

  const nav = document.createElement("nav");
  nav.className = "tile-nav";
  nav.setAttribute("aria-label", "Sections");

  const tileMount = document.createElement("div");
  tileMount.className = "tile-mount";

  const tilesOrdered = manifest.navigation
    .map((id) => manifest.tiles.find((t) => t.id === id))
    .filter((t): t is Tile => Boolean(t));

  const buttons: HTMLButtonElement[] = [];

  function updateNav(): void {
    buttons.forEach((btn, i) => {
      const active = i === tileIndex;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  function showTile(i: number): void {
    if (i < 0 || i >= tilesOrdered.length) return;
    tileIndex = i;
    const tile = tilesOrdered[tileIndex]!;
    const rm =
      readPrefersReducedMotion() || manifest.theme?.motion === "none";
    renderTile(tileMount, tile, rm);
    updateNav();
    tileMount.focus?.();
  }

  tilesOrdered.forEach((tile, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile-button";
    btn.textContent = tile.label;
    btn.addEventListener("click", () => showTile(i));
    nav.appendChild(btn);
    buttons.push(btn);
  });

  root.appendChild(header);
  root.appendChild(nav);
  root.appendChild(tileMount);
  tileMount.tabIndex = -1;

  showTile(0);

  globalThis.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      showTile(Math.min(tileIndex + 1, tilesOrdered.length - 1));
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      showTile(Math.max(tileIndex - 1, 0));
    }
    if (e.key === "Home") {
      e.preventDefault();
      showTile(0);
    }
    if (e.key === "End") {
      e.preventDefault();
      showTile(tilesOrdered.length - 1);
    }
  });
}

function main(): void {
  const manifests = loadAllManifests();
  const params = new URLSearchParams(globalThis.location.search);
  const slug = getInitialSlug(manifests, params.get("slug"));
  const manifest = manifests.get(slug);
  if (!manifest) {
    document.body.innerHTML =
      "<p>No manifest found. Add content/publishes/&lt;slug&gt;/manifest.json</p>";
    return;
  }

  if (params.get("slug") !== slug) {
    params.set("slug", slug);
    globalThis.history.replaceState(
      null,
      "",
      `${globalThis.location.pathname}?${params}`
    );
  }

  const app = document.getElementById("app");
  if (!app) return;
  mountApp(app, manifest);
}

main();
