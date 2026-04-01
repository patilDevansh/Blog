import { el, clearChildren } from "../ui";
import type { PublishManifest } from "@schema/manifest";

export type ReadingPath = {
  id: string;
  title: string;
  description: string;
  audience: string;
  slugs: string[];
  tradition: string;
  featured: boolean;
};

const STORAGE_KEY = "stillwater-reading-paths";

function loadPaths(): ReadingPath[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ReadingPath[];
  } catch { /* ignore */ }
  const samples: ReadingPath[] = [
    {
      id: "rp1",
      title: "New to non-dual teachings",
      description: "A gentle entry for readers arriving from mindfulness or general spirituality who haven't encountered Advaita or Kashmir Shaivism before.",
      audience: "Complete beginners",
      slugs: [],
      tradition: "Advaita",
      featured: true,
    },
    {
      id: "rp2",
      title: "Kashmir Shaivism deep dive",
      description: "For readers who already have some grounding. Goes from spanda to pratyabhijñā to Abhinavagupta's synthesis in the Tantraloka.",
      audience: "Practitioners with some background",
      slugs: [],
      tradition: "Kashmir Shaivism",
      featured: false,
    },
    {
      id: "rp3",
      title: "Kriya Yoga lineage",
      description: "Mahavatar Babaji to Lahiri Mahasaya to Sri Yukteswar — the transmission line, the practices, and what makes Kriya distinct.",
      audience: "Interested in lineage and initiation",
      slugs: [],
      tradition: "Kriya Yoga",
      featured: false,
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
  return samples;
}

function savePaths(paths: ReadingPath[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(paths));
}

function uid(): string { return Math.random().toString(36).slice(2, 10); }

const TRADITIONS = ["Advaita", "Kashmir Shaivism", "Tantra", "Vajrayana", "Patanjali", "Taoism", "Navnath", "Kriya Yoga", "84 Mahasiddhas", "Osho", "General"];

export function renderReadingPaths(
  container: HTMLElement,
  opts: { manifests: Map<string, PublishManifest> }
): void {
  clearChildren(container);

  let paths = loadPaths();

  const hero = el("div", "cr-dash-hero");
  hero.appendChild(el("p", "cr-eyebrow", "Reader guidance"));
  hero.appendChild(el("h1", "cr-dash-title", "Reading Paths"));
  hero.appendChild(el("p", "cr-dash-lede",
    "Curated sequences that guide new readers through your archive in the right order. Solves the blank-page problem for someone arriving via search with no context."));

  const addBtn = el("button", "cr-btn cr-btn--primary", "+ New path") as HTMLButtonElement;
  addBtn.type = "button";

  const formArea = el("div", "cr-glossary-form-area");
  const pathGrid = el("div", "cr-paths-grid");

  function showForm(existing?: ReadingPath): void {
    clearChildren(formArea);
    const form = el("div", "cr-panel");
    form.appendChild(el("h2", "cr-panel-title", existing ? "Edit path" : "New reading path"));

    const titleF = el("div", "creator-field");
    titleF.appendChild(el("label", "", "Path title"));
    const titleIn = el("input") as HTMLInputElement;
    titleIn.value = existing?.title ?? "";
    titleIn.placeholder = "New to non-dual teachings";
    titleF.appendChild(titleIn);
    form.appendChild(titleF);

    const descF = el("div", "creator-field");
    descF.appendChild(el("label", "", "Description"));
    const descTa = el("textarea") as HTMLTextAreaElement;
    descTa.rows = 2;
    descTa.value = existing?.description ?? "";
    descTa.placeholder = "One or two sentences — what does this path offer, and for whom?";
    descF.appendChild(descTa);
    form.appendChild(descF);

    const row = el("div", "cr-glossary-form-row");
    const audF = el("div", "creator-field");
    audF.appendChild(el("label", "", "Intended audience"));
    const audIn = el("input") as HTMLInputElement;
    audIn.value = existing?.audience ?? "";
    audIn.placeholder = "Complete beginners";
    audF.appendChild(audIn);
    row.appendChild(audF);

    const tradF = el("div", "creator-field");
    tradF.appendChild(el("label", "", "Primary tradition"));
    const tradSel = el("select") as HTMLSelectElement;
    TRADITIONS.forEach(t => {
      const o = el("option", "", t) as HTMLOptionElement;
      o.value = t;
      if (existing?.tradition === t) o.selected = true;
      tradSel.appendChild(o);
    });
    tradF.appendChild(tradSel);
    row.appendChild(tradF);
    form.appendChild(row);

    const postsF = el("div", "creator-field");
    postsF.appendChild(el("label", "", "Posts in this path (select in reading order)"));
    const postList = el("div", "cr-paths-post-select");
    const allSlugs = [...opts.manifests.entries()].sort((a, b) =>
      new Date(b[1].createdAt).getTime() - new Date(a[1].createdAt).getTime());
    const selected = new Set(existing?.slugs ?? []);
    const order: string[] = [...(existing?.slugs ?? [])];

    allSlugs.forEach(([slug, m]) => {
      const row2 = el("label", "cr-paths-post-row");
      const cb = el("input") as HTMLInputElement;
      cb.type = "checkbox";
      cb.checked = selected.has(slug);
      cb.addEventListener("change", () => {
        if (cb.checked) order.push(slug);
        else { const i = order.indexOf(slug); if (i >= 0) order.splice(i, 1); }
      });
      row2.appendChild(cb);
      row2.appendChild(document.createTextNode(m.title));
      postList.appendChild(row2);
    });

    if (allSlugs.length === 0) {
      postList.appendChild(el("p", "cr-muted", "No published posts yet."));
    }
    postsF.appendChild(postList);
    form.appendChild(postsF);

    const featRow = el("label", "cr-check-label");
    const featCb = el("input") as HTMLInputElement;
    featCb.type = "checkbox";
    featCb.checked = existing?.featured ?? false;
    featRow.appendChild(featCb);
    featRow.appendChild(document.createTextNode("Feature this path on the journal home for new readers"));
    form.appendChild(featRow);

    const btnRow = el("div", "creator-actions");
    const saveBtn = el("button", "cr-btn cr-btn--primary", existing ? "Save changes" : "Create path") as HTMLButtonElement;
    saveBtn.type = "button";
    saveBtn.addEventListener("click", () => {
      const title = titleIn.value.trim();
      if (!title) return;
      if (existing) {
        existing.title = title; existing.description = descTa.value.trim();
        existing.audience = audIn.value.trim(); existing.tradition = tradSel.value;
        existing.slugs = order; existing.featured = featCb.checked;
      } else {
        paths.push({ id: uid(), title, description: descTa.value.trim(), audience: audIn.value.trim(), tradition: tradSel.value, slugs: order, featured: featCb.checked });
      }
      savePaths(paths);
      clearChildren(formArea);
      redraw();
    });
    const cancelBtn = el("button", "cr-btn cr-btn--ghost", "Cancel") as HTMLButtonElement;
    cancelBtn.type = "button";
    cancelBtn.addEventListener("click", () => { clearChildren(formArea); });
    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);
    form.appendChild(btnRow);
    formArea.appendChild(form);
    formArea.scrollIntoView({ behavior: "smooth" });
  }

  addBtn.addEventListener("click", () => showForm());

  function redraw(): void {
    clearChildren(pathGrid);
    if (paths.length === 0) {
      pathGrid.appendChild(el("p", "cr-empty", "No reading paths yet. Create your first to guide new readers."));
      return;
    }
    paths.forEach(path => {
      const card = el("div", "cr-paths-card");
      if (path.featured) card.appendChild(el("span", "cr-badge cr-badge--live cr-paths-featured-badge", "Featured on journal"));
      card.appendChild(el("p", "cr-eyebrow", path.tradition));
      card.appendChild(el("h3", "cr-paths-card-title", path.title));
      card.appendChild(el("p", "cr-paths-card-desc", path.description));
      const meta = el("p", "cr-muted", `${path.audience} · ${path.slugs.length} post${path.slugs.length !== 1 ? "s" : ""}`);
      card.appendChild(meta);

      if (path.slugs.length > 0) {
        const ol = document.createElement("ol");
        ol.className = "cr-paths-card-posts";
        path.slugs.forEach(slug => {
          const m = opts.manifests.get(slug);
          const li = document.createElement("li");
          li.textContent = m ? m.title : slug;
          ol.appendChild(li);
        });
        card.appendChild(ol);
      }

      const actions = el("div", "cr-post-actions");
      const editBtn = el("button", "cr-btn cr-btn--primary cr-btn--sm", "Edit") as HTMLButtonElement;
      editBtn.type = "button";
      editBtn.addEventListener("click", () => { showForm(path); });
      const delBtn = el("button", "cr-btn cr-btn--ghost cr-btn--sm", "Delete") as HTMLButtonElement;
      delBtn.type = "button";
      delBtn.addEventListener("click", () => {
        if (!confirm(`Delete path "${path.title}"?`)) return;
        paths = paths.filter(p => p.id !== path.id);
        savePaths(paths);
        redraw();
      });
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      card.appendChild(actions);
      pathGrid.appendChild(card);
    });
  }

  redraw();

  container.appendChild(hero);
  container.appendChild(addBtn);
  container.appendChild(formArea);
  container.appendChild(pathGrid);
}
