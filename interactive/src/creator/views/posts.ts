import type { PublishManifest } from "@schema/manifest";
import { journalPostUrl } from "../../lib/site-paths";
import { estimatedWordCount, imageBlockCount } from "../../lib/manifest-stats";
import { el, clearChildren } from "../ui";
import {
  deleteLocalDraft,
  getLocalDrafts,
  getSessionPassword,
  getSessionRemovedSlugs,
  rememberRemovedSlug,
  type LocalDraft,
} from "../storage";
import type { ViewId } from "../types";
import { DELETE_PUBLISH_FN, LIST_PUBLISHES_FN } from "../remote-api";

export function renderPosts(
  container: HTMLElement,
  opts: {
    manifests: Map<string, PublishManifest>;
    baseUrl: string;
    navigate: (v: ViewId, navOpts?: { editorSlug?: string }) => void;
    setComposeImport: (json: string | null) => void;
  }
): void {
  clearChildren(container);

  const drafts = getLocalDrafts();
  const draftSlugs = new Set(Object.keys(drafts));

  const hero = el("div", "cr-dash-hero");
  hero.appendChild(el("p", "cr-eyebrow", "Your stories"));
  hero.appendChild(el("h1", "cr-dash-title", "Posts"));
  hero.appendChild(
    el(
      "p",
      "cr-dash-lede",
      "Everything live on GitHub (when connected), plus device-only drafts. Edit in the visual editor, remove from the site, or tweak raw JSON for advanced widgets."
    )
  );

  const toolbar = el("div", "cr-toolbar");
  const searchWrap = el("div", "cr-search-wrap");
  const search = el("input", "cr-search") as HTMLInputElement;
  search.type = "search";
  search.placeholder = "Search title or slug…";
  search.setAttribute("aria-label", "Filter posts");
  searchWrap.appendChild(search);

  const addBtn = el(
    "button",
    "cr-btn cr-btn--primary",
    "Write new post"
  ) as HTMLButtonElement;
  addBtn.type = "button";
  addBtn.addEventListener("click", () => {
    opts.setComposeImport(null);
    opts.navigate("compose");
  });
  toolbar.appendChild(searchWrap);
  toolbar.appendChild(addBtn);

  const listEl = el("div", "cr-post-list");
  const loadNote = el("p", "cr-muted cr-posts-loading");
  loadNote.textContent = "Loading library…";
  listEl.appendChild(loadNote);

  type Row = {
    slug: string;
    manifest: PublishManifest | null;
    local: LocalDraft | undefined;
    onGithub: boolean;
  };

  let rows: Row[] = [];
  let remoteSlugs: string[] | null = null;

  function buildRows(): void {
    const removed = getSessionRemovedSlugs();
    const slugSet = new Set<string>();

    if (remoteSlugs != null) {
      for (const s of remoteSlugs) {
        if (!removed.has(s)) slugSet.add(s);
      }
    } else {
      for (const s of opts.manifests.keys()) {
        if (!removed.has(s)) slugSet.add(s);
      }
    }

    for (const s of draftSlugs) {
      slugSet.add(s);
    }

    rows = [...slugSet].map((slug) => ({
      slug,
      manifest: opts.manifests.get(slug) ?? null,
      local: drafts[slug],
      onGithub:
        remoteSlugs != null
          ? remoteSlugs.includes(slug)
          : Boolean(opts.manifests.get(slug)),
    }));

    rows.sort((a, b) => {
      const da = a.manifest
        ? new Date(a.manifest.createdAt).getTime()
        : new Date(a.local?.updatedAt ?? 0).getTime();
      const db = b.manifest
        ? new Date(b.manifest.createdAt).getTime()
        : new Date(b.local?.updatedAt ?? 0).getTime();
      return db - da;
    });
  }

  function matches(row: Row, q: string): boolean {
    if (!q) return true;
    const low = q.toLowerCase();
    if (row.slug.toLowerCase().includes(low)) return true;
    if (row.manifest?.title.toLowerCase().includes(low)) return true;
    if (row.local?.title?.toLowerCase().includes(low)) return true;
    return false;
  }

  function paintList(): void {
    clearChildren(listEl);
    const q = search.value.trim();
    let any = false;
    for (const row of rows) {
      if (!matches(row, q)) continue;
      any = true;
      const card = el("article", "cr-post-card");
      const top = el("div", "cr-post-card-top");
      const titles = el("div", "cr-post-titles");
      const titleText =
        row.manifest?.title ?? row.local?.title ?? row.slug;
      titles.appendChild(el("h3", "cr-post-card-title", titleText));
      titles.appendChild(el("p", "cr-post-card-slug", row.slug));
      top.appendChild(titles);
      const badges = el("div", "cr-badges");
      if (row.onGithub) {
        badges.appendChild(el("span", "cr-badge cr-badge--live", "Live on site"));
      } else if (remoteSlugs != null && !row.local) {
        badges.appendChild(
          el("span", "cr-badge cr-badge--warn", "Not in GitHub list")
        );
      }
      if (row.manifest && !row.onGithub && remoteSlugs == null) {
        badges.appendChild(
          el("span", "cr-badge cr-badge--live", "In this build")
        );
      }
      if (row.local) {
        badges.appendChild(
          el("span", "cr-badge cr-badge--draft", "Draft on device")
        );
      }
      top.appendChild(badges);
      card.appendChild(top);

      const meta = el("p", "cr-post-card-meta");
      if (row.manifest) {
        const w = estimatedWordCount(row.manifest);
        const imgs = imageBlockCount(row.manifest);
        const imgPart = imgs > 0 ? ` · ${imgs} photo${imgs === 1 ? "" : "s"}` : "";
        meta.textContent = `${new Date(row.manifest.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })} · ${w} words${imgPart}`;
      } else if (row.local) {
        meta.textContent = `Draft saved ${new Date(row.local.updatedAt).toLocaleString()}`;
      } else {
        meta.textContent = "Open editor to load from GitHub.";
      }
      card.appendChild(meta);

      const actions = el("div", "cr-post-actions");

      const preview = el(
        "a",
        "cr-btn cr-btn--ghost cr-btn--sm",
        "View live"
      ) as HTMLAnchorElement;
      preview.href = journalPostUrl(opts.baseUrl, row.slug);
      preview.target = "_blank";
      preview.rel = "noopener noreferrer";
      actions.appendChild(preview);

      if (row.manifest || row.onGithub || row.local) {
        const copyLink = el(
          "button",
          "cr-btn cr-btn--ghost cr-btn--sm",
          "Copy link"
        ) as HTMLButtonElement;
        copyLink.type = "button";
        copyLink.addEventListener("click", async () => {
          const href = new URL(
            journalPostUrl(opts.baseUrl, row.slug),
            globalThis.location.origin
          ).href;
          await navigator.clipboard.writeText(href);
          copyLink.textContent = "Copied";
          setTimeout(() => {
            copyLink.textContent = "Copy link";
          }, 2000);
        });
        actions.appendChild(copyLink);
      }

      const editVisual = el(
        "button",
        "cr-btn cr-btn--primary cr-btn--sm",
        "Edit post"
      ) as HTMLButtonElement;
      editVisual.type = "button";
      editVisual.addEventListener("click", () => {
        opts.navigate("editor", { editorSlug: row.slug });
      });
      actions.appendChild(editVisual);

      const editJson = el(
        "button",
        "cr-btn cr-btn--secondary cr-btn--sm",
        "Raw JSON"
      ) as HTMLButtonElement;
      editJson.type = "button";
      editJson.addEventListener("click", () => {
        let json: string;
        if (row.local) {
          json = row.local.json;
        } else if (row.manifest) {
          json = JSON.stringify(row.manifest, null, 2);
        } else {
          opts.navigate("editor", { editorSlug: row.slug });
          return;
        }
        opts.setComposeImport(json);
        opts.navigate("compose");
      });
      actions.appendChild(editJson);

      const canDeleteLive =
        row.onGithub || (remoteSlugs == null && Boolean(row.manifest));
      if (canDeleteLive && getSessionPassword()) {
        const delLive = el(
          "button",
          "cr-btn cr-btn--ghost cr-btn--sm",
          "Remove from site"
        ) as HTMLButtonElement;
        delLive.type = "button";
        delLive.addEventListener("click", async () => {
          if (
            !confirm(
              `Remove “${row.slug}” from GitHub? The public journal will update after deploy. This cannot be undone from here.`
            )
          ) {
            return;
          }
          const pw = getSessionPassword() || "";
          delLive.disabled = true;
          try {
            const res = await fetch(DELETE_PUBLISH_FN, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password: pw, slug: row.slug }),
            });
            const data = (await res.json()) as { ok?: boolean; error?: string };
            if (!res.ok) {
              alert(data.error || `Delete failed (${res.status})`);
              return;
            }
            rememberRemovedSlug(row.slug);
            await initFromRemote();
          } catch {
            alert("Could not reach server.");
          } finally {
            delLive.disabled = false;
          }
        });
        actions.appendChild(delLive);
      }

      if (row.local) {
        const del = el(
          "button",
          "cr-btn cr-btn--ghost cr-btn--sm",
          "Drop device draft"
        ) as HTMLButtonElement;
        del.type = "button";
        del.addEventListener("click", () => {
          if (confirm(`Remove local draft for “${row.slug}”?`)) {
            deleteLocalDraft(row.slug);
            initFromRemote();
          }
        });
        actions.appendChild(del);
      }

      card.appendChild(actions);
      listEl.appendChild(card);
    }
    if (!any) {
      listEl.appendChild(
        el(
          "p",
          "cr-empty",
          q ? "No posts match your search." : "No posts yet."
        )
      );
    }
  }

  async function initFromRemote(): Promise<void> {
    const pw = getSessionPassword() || "";
    remoteSlugs = null;
    if (pw) {
      try {
        const r = await fetch(LIST_PUBLISHES_FN, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pw }),
        });
        const d = (await r.json()) as { ok?: boolean; slugs?: string[] };
        if (r.ok && Array.isArray(d.slugs)) {
          remoteSlugs = d.slugs;
        }
      } catch {
        remoteSlugs = null;
      }
    }
    buildRows();
    paintList();
  }

  search.addEventListener("input", () => {
    paintList();
  });

  container.appendChild(hero);
  container.appendChild(toolbar);
  container.appendChild(listEl);
  void initFromRemote();
}
