import type { PublishManifest } from "@schema/manifest";
import { journalPostUrl } from "../../lib/site-paths";
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

  const head = el("div", "cr-view-head");
  head.appendChild(el("p", "cr-eyebrow", "Your archive"));
  const headRow = el("div", "cr-view-head__row");
  headRow.appendChild(el("h1", "cr-view-title", "Post Library"));
  const headAct = el("div", "cr-view-head__actions");
  const addBtn = el(
    "button",
    "cr-btn cr-btn--primary cr-btn--sm",
    "+ New post"
  ) as HTMLButtonElement;
  addBtn.type = "button";
  addBtn.addEventListener("click", () => {
    opts.setComposeImport(null);
    opts.navigate("compose");
  });
  headAct.appendChild(addBtn);
  headRow.appendChild(headAct);
  head.appendChild(headRow);
  head.appendChild(
    el(
      "p",
      "cr-view-lede",
      "Search and filter the full archive. Device-only drafts appear alongside live posts. Edit visually, open the public view, or jump to raw JSON when you need it."
    )
  );

  const searchBar = el("div", "cr-lib-searchbar");
  const search = el("input", "cr-lib-search") as HTMLInputElement;
  search.type = "search";
  search.placeholder = "Search title, slug, or summary…";
  search.setAttribute("aria-label", "Filter posts");
  searchBar.appendChild(search);

  const pillStrip = el("div", "cr-pill-strip cr-pill-strip--wrap");
  let statusFilter: "all" | "published" | "drafts" = "all";
  let catFilter = "all";

  const tableShell = el("div", "cr-lib-table-shell");
  const listEl = el("div", "cr-lib-table-inner");
  const loadNote = el("p", "cr-muted cr-posts-loading");
  loadNote.textContent = "Loading library…";
  listEl.appendChild(loadNote);
  tableShell.appendChild(listEl);

  type Row = {
    slug: string;
    manifest: PublishManifest | null;
    local: LocalDraft | undefined;
    onGithub: boolean;
  };

  let rows: Row[] = [];
  let remoteSlugs: string[] | null = null;

  function seedFromSlug(slug: string): number {
    return slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  }

  function illusReads(slug: string): string {
    return String(80 + (seedFromSlug(slug) % 920));
  }

  function rowCategory(row: Row): string {
    return row.manifest?.category?.trim() || "—";
  }

  function rowStatus(row: Row): { label: string; variant: string } {
    if (row.local && row.manifest) {
      return { label: "Draft overlay", variant: "cr-lib-pill--draft" };
    }
    if (row.local) return { label: "Draft", variant: "cr-lib-pill--draft" };
    if (row.manifest) return { label: "Published", variant: "cr-lib-pill--pub" };
    return { label: "Pending load", variant: "cr-lib-pill--sched" };
  }

  function rebuildPills(): void {
    clearChildren(pillStrip);
    const n = rows.length;
    const pub = rows.filter((r) => r.manifest).length;
    const dr = rows.filter((r) => r.local).length;
    const defs: { id: "all" | "published" | "drafts"; label: string }[] = [
      { id: "all", label: `All (${n})` },
      { id: "published", label: `Published (${pub})` },
      { id: "drafts", label: `Drafts (${dr})` },
    ];
    for (const d of defs) {
      const b = el("button", "cr-pill-btn", d.label) as HTMLButtonElement;
      b.type = "button";
      b.dataset.filter = d.id;
      b.classList.toggle("is-active", statusFilter === d.id);
      b.addEventListener("click", () => {
        statusFilter = d.id;
        pillStrip.querySelectorAll(".cr-pill-btn[data-filter]").forEach((p) => {
          p.classList.toggle(
            "is-active",
            (p as HTMLButtonElement).dataset.filter === d.id
          );
        });
        paintList();
      });
      pillStrip.appendChild(b);
    }
    const cats = new Set<string>();
    for (const r of rows) {
      const c = rowCategory(r);
      if (c && c !== "—") cats.add(c);
    }
    const sorted = [...cats].sort();
    for (const c of sorted.slice(0, 8)) {
      const b = el("button", "cr-pill-btn", c) as HTMLButtonElement;
      b.type = "button";
      b.dataset.cat = c;
      b.classList.toggle("is-active", catFilter === c);
      b.addEventListener("click", () => {
        catFilter = catFilter === c ? "all" : c;
        pillStrip.querySelectorAll(".cr-pill-btn[data-cat]").forEach((p) => {
          p.classList.toggle(
            "is-active",
            (p as HTMLButtonElement).dataset.cat === catFilter
          );
        });
        paintList();
      });
      pillStrip.appendChild(b);
    }
  }

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

    const table = el("table", "cr-lib-table");
    const thead = el("thead");
    const thr = el("tr");
    ["Title", "Tradition", "Status", "Reads", "Updated", "Actions"].forEach(
      (h) => {
        thr.appendChild(el("th", "", h));
      }
    );
    thead.appendChild(thr);
    table.appendChild(thead);
    const tbody = el("tbody");

    for (const row of rows) {
      if (!matches(row, q)) continue;
      if (statusFilter === "drafts" && !row.local) continue;
      if (statusFilter === "published" && !row.manifest) continue;
      if (catFilter !== "all") {
        const c = row.manifest?.category?.trim();
        if (c !== catFilter) continue;
      }
      any = true;

      const titleText =
        row.manifest?.title ?? row.local?.title ?? row.slug;
      const sub = row.manifest?.summary?.trim().slice(0, 96) ?? row.slug;

      const tr = el("tr", "cr-lib-tr");
      tr.addEventListener("mouseenter", () => {
        tr.classList.add("is-hover");
      });
      tr.addEventListener("mouseleave", () => {
        tr.classList.remove("is-hover");
      });

      const tdTitle = el("td", "cr-lib-td cr-lib-td--title");
      const titleWrap = el("div");
      titleWrap.appendChild(el("div", "cr-lib-title", titleText));
      titleWrap.appendChild(el("div", "cr-lib-sub", sub));
      tdTitle.appendChild(titleWrap);
      tr.appendChild(tdTitle);

      tr.appendChild(
        el("td", "cr-lib-td cr-lib-td--muted", rowCategory(row))
      );

      const st = rowStatus(row);
      const tdSt = el("td", "cr-lib-td");
      tdSt.appendChild(el("span", `cr-lib-pill ${st.variant}`, st.label));
      tr.appendChild(tdSt);

      tr.appendChild(
        el(
          "td",
          "cr-lib-td cr-lib-td--muted",
          row.manifest ? illusReads(row.slug) : "—"
        )
      );

      const updated =
        row.manifest != null
          ? new Date(row.manifest.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          : row.local != null
            ? new Date(row.local.updatedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            : "—";
      tr.appendChild(el("td", "cr-lib-td cr-lib-td--muted", updated));

      const tdAct = el("td", "cr-lib-td cr-lib-td--actions");
      const editL = el(
        "button",
        "cr-lib-link cr-lib-link--accent",
        "Edit"
      ) as HTMLButtonElement;
      editL.type = "button";
      editL.addEventListener("click", () => {
        opts.navigate("editor", { editorSlug: row.slug });
      });
      const viewL = el("a", "cr-lib-link", "View") as HTMLAnchorElement;
      viewL.href = journalPostUrl(opts.baseUrl, row.slug);
      viewL.target = "_blank";
      viewL.rel = "noopener noreferrer";
      const jsonL = el(
        "button",
        "cr-lib-link",
        "JSON"
      ) as HTMLButtonElement;
      jsonL.type = "button";
      jsonL.addEventListener("click", () => {
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
      tdAct.appendChild(editL);
      tdAct.appendChild(document.createTextNode(" · "));
      tdAct.appendChild(viewL);
      tdAct.appendChild(document.createTextNode(" · "));
      tdAct.appendChild(jsonL);

      const canDeleteLive =
        row.onGithub || (remoteSlugs == null && Boolean(row.manifest));
      if (canDeleteLive && getSessionPassword()) {
        tdAct.appendChild(document.createTextNode(" · "));
        const delLive = el(
          "button",
          "cr-lib-link cr-lib-link--danger",
          "Remove"
        ) as HTMLButtonElement;
        delLive.type = "button";
        delLive.addEventListener("click", async () => {
          if (
            !confirm(
              `Remove “${row.slug}” from the live archive? The site updates after deploy.`
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
        tdAct.appendChild(delLive);
      }

      if (row.local) {
        tdAct.appendChild(document.createTextNode(" · "));
        const del = el(
          "button",
          "cr-lib-link",
          "Drop draft"
        ) as HTMLButtonElement;
        del.type = "button";
        del.addEventListener("click", () => {
          if (confirm(`Remove local draft for “${row.slug}”?`)) {
            deleteLocalDraft(row.slug);
            void initFromRemote();
          }
        });
        tdAct.appendChild(del);
      }

      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    }

    if (any) {
      table.appendChild(tbody);
      listEl.appendChild(table);
    } else {
      listEl.appendChild(
        el(
          "p",
          "cr-empty",
          q ? "No posts match your filters." : "No posts yet."
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
    rebuildPills();
    paintList();
  }

  search.addEventListener("input", () => {
    paintList();
  });

  container.appendChild(head);
  container.appendChild(searchBar);
  container.appendChild(pillStrip);
  container.appendChild(tableShell);
  void initFromRemote();
}
