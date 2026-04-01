import { el, clearChildren } from "../ui";

export type Source = {
  id: string;
  author: string;
  title: string;
  year: string;
  type: "primary-text" | "commentary" | "academic" | "translation" | "oral";
  tradition: string;
  notes: string;
  citedIn: string[];
};

const STORAGE_KEY = "stillwater-sources";

function uid(): string { return Math.random().toString(36).slice(2, 10); }
const TRADITIONS = ["Advaita", "Kashmir Shaivism", "Tantra", "Vajrayana", "Patanjali", "Taoism", "Navnath", "Kriya Yoga", "84 Mahasiddhas", "Osho", "General"];
const SOURCE_TYPES: { id: Source["type"]; label: string }[] = [
  { id: "primary-text", label: "Primary text" },
  { id: "commentary", label: "Commentary" },
  { id: "translation", label: "Translation" },
  { id: "academic", label: "Academic" },
  { id: "oral", label: "Oral / transmission" },
];

function loadSources(): Source[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Source[];
  } catch { /* ignore */ }
  const samples: Source[] = [
    { id: "sr1", author: "Abhinavagupta", title: "Tantrāloka", year: "c. 1000 CE", type: "primary-text", tradition: "Kashmir Shaivism", notes: "The encyclopaedic synthesis of the Trika Shaiva tradition. 37 āhnikas.", citedIn: [] },
    { id: "sr2", author: "Patañjali", title: "Yoga Sūtras", year: "c. 400 CE", type: "primary-text", tradition: "Patanjali", notes: "196 aphorisms in 4 chapters. The foundational text of the Yoga Darshana.", citedIn: [] },
    { id: "sr3", author: "Paramahansa Yogananda", title: "Autobiography of a Yogi", year: "1946", type: "translation", tradition: "Kriya Yoga", notes: "First English account of the Kriya lineage. Introduces Mahavatar Babaji, Lahiri Mahasaya, and Sri Yukteswar.", citedIn: [] },
    { id: "sr4", author: "Mark SG Dyczkowski", title: "The Doctrine of Vibration", year: "1987", type: "academic", tradition: "Kashmir Shaivism", notes: "The definitive English-language scholarly study of the Spanda tradition.", citedIn: [] },
    { id: "sr5", author: "Lochen Dharmaśrī", title: "Guhyagarbha Tantra Commentary", year: "c. 18th century", type: "commentary", tradition: "Vajrayana", notes: "Nyingma commentary on the root tantra of the Mahāyoga class.", citedIn: [] },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
  return samples;
}

function saveSources(sources: Source[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
}

export function renderSources(container: HTMLElement): void {
  clearChildren(container);

  let sources = loadSources();
  let searchQ = "";

  const hero = el("div", "cr-dash-hero");
  hero.appendChild(el("p", "cr-eyebrow", "Scholarship"));
  hero.appendChild(el("h1", "cr-dash-title", "Sources & References"));
  hero.appendChild(el("p", "cr-dash-lede",
    "A shared bibliography you maintain once, cite everywhere. Update a translation credit here and it updates in every post simultaneously."));

  const statRow = el("div", "cr-stat-grid");
  const mkStat = (label: string, val: string) => {
    const c = el("div", "cr-stat-card");
    c.appendChild(el("p", "cr-stat-label", label));
    c.appendChild(el("p", "cr-stat-value", val));
    return c;
  };
  const countByType = (type: Source["type"]) => sources.filter(s => s.type === type).length;
  statRow.appendChild(mkStat("Total sources", String(sources.length)));
  statRow.appendChild(mkStat("Primary texts", String(countByType("primary-text"))));
  statRow.appendChild(mkStat("Academic", String(countByType("academic"))));
  statRow.appendChild(mkStat("Translations", String(countByType("translation"))));

  const toolbar = el("div", "cr-toolbar");
  const searchWrap = el("div", "cr-search-wrap");
  const searchIn = el("input", "cr-search") as HTMLInputElement;
  searchIn.type = "search";
  searchIn.placeholder = "Search author, title, tradition…";
  searchIn.addEventListener("input", () => { searchQ = searchIn.value.toLowerCase(); redraw(); });
  searchWrap.appendChild(searchIn);

  const addBtn = el("button", "cr-btn cr-btn--primary", "+ Add source") as HTMLButtonElement;
  addBtn.type = "button";
  toolbar.appendChild(searchWrap);
  toolbar.appendChild(addBtn);

  const formArea = el("div", "cr-glossary-form-area");
  const sourceList = el("div", "cr-sources-list");

  function showForm(existing?: Source): void {
    clearChildren(formArea);
    const form = el("div", "cr-panel");
    form.appendChild(el("h2", "cr-panel-title", existing ? "Edit source" : "Add source"));

    const row1 = el("div", "cr-glossary-form-row");
    const authF = el("div", "creator-field");
    authF.appendChild(el("label", "", "Author / editor / compiler"));
    const authIn = el("input") as HTMLInputElement;
    authIn.value = existing?.author ?? "";
    authIn.placeholder = "Abhinavagupta";
    authF.appendChild(authIn);
    row1.appendChild(authF);

    const yearF = el("div", "creator-field");
    yearF.appendChild(el("label", "", "Year / period"));
    const yearIn = el("input") as HTMLInputElement;
    yearIn.value = existing?.year ?? "";
    yearIn.placeholder = "c. 1000 CE";
    yearF.appendChild(yearIn);
    row1.appendChild(yearF);
    form.appendChild(row1);

    const titleF = el("div", "creator-field");
    titleF.appendChild(el("label", "", "Title"));
    const titleIn = el("input") as HTMLInputElement;
    titleIn.value = existing?.title ?? "";
    titleIn.placeholder = "Tantrāloka";
    titleF.appendChild(titleIn);
    form.appendChild(titleF);

    const row2 = el("div", "cr-glossary-form-row");
    const typeF = el("div", "creator-field");
    typeF.appendChild(el("label", "", "Type"));
    const typeSel = el("select") as HTMLSelectElement;
    SOURCE_TYPES.forEach(({ id, label }) => {
      const o = el("option", "", label) as HTMLOptionElement;
      o.value = id;
      if (existing?.type === id) o.selected = true;
      typeSel.appendChild(o);
    });
    typeF.appendChild(typeSel);
    row2.appendChild(typeF);

    const tradF = el("div", "creator-field");
    tradF.appendChild(el("label", "", "Tradition"));
    const tradSel = el("select") as HTMLSelectElement;
    TRADITIONS.forEach(t => {
      const o = el("option", "", t) as HTMLOptionElement;
      o.value = t;
      if (existing?.tradition === t) o.selected = true;
      tradSel.appendChild(o);
    });
    tradF.appendChild(tradSel);
    row2.appendChild(tradF);
    form.appendChild(row2);

    const notesF = el("div", "creator-field");
    notesF.appendChild(el("label", "", "Notes / annotation"));
    const notesTa = el("textarea") as HTMLTextAreaElement;
    notesTa.rows = 2;
    notesTa.value = existing?.notes ?? "";
    notesTa.placeholder = "What makes this source significant to your work…";
    notesF.appendChild(notesTa);
    form.appendChild(notesF);

    const btnRow = el("div", "creator-actions");
    const saveBtn = el("button", "cr-btn cr-btn--primary", existing ? "Save" : "Add source") as HTMLButtonElement;
    saveBtn.type = "button";
    saveBtn.addEventListener("click", () => {
      const title = titleIn.value.trim();
      if (!title) return;
      if (existing) {
        existing.author = authIn.value.trim(); existing.title = title;
        existing.year = yearIn.value.trim(); existing.type = typeSel.value as Source["type"];
        existing.tradition = tradSel.value; existing.notes = notesTa.value.trim();
      } else {
        sources.unshift({ id: uid(), author: authIn.value.trim(), title, year: yearIn.value.trim(), type: typeSel.value as Source["type"], tradition: tradSel.value, notes: notesTa.value.trim(), citedIn: [] });
      }
      saveSources(sources);
      clearChildren(formArea);
      redraw();
    });
    const cancelBtn = el("button", "cr-btn cr-btn--ghost", "Cancel") as HTMLButtonElement;
    cancelBtn.type = "button";
    cancelBtn.addEventListener("click", () => clearChildren(formArea));
    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);
    form.appendChild(btnRow);
    formArea.appendChild(form);
  }

  addBtn.addEventListener("click", () => showForm());

  function redraw(): void {
    clearChildren(sourceList);
    const visible = searchQ
      ? sources.filter(s => s.author.toLowerCase().includes(searchQ) || s.title.toLowerCase().includes(searchQ) || s.tradition.toLowerCase().includes(searchQ))
      : sources;

    if (visible.length === 0) {
      sourceList.appendChild(el("p", "cr-empty", "No sources yet."));
      return;
    }

    visible.forEach(source => {
      const row = el("div", "cr-sources-row");
      const left = el("div", "cr-sources-left");
      const typeInfo = SOURCE_TYPES.find(t => t.id === source.type);
      left.appendChild(el("span", "cr-badge cr-badge--draft", typeInfo?.label ?? source.type));
      left.appendChild(el("p", "cr-sources-title", source.title));
      left.appendChild(el("p", "cr-sources-meta", `${source.author}${source.year ? ` · ${source.year}` : ""} · ${source.tradition}`));
      if (source.notes) left.appendChild(el("p", "cr-sources-notes", source.notes));

      const actions = el("div", "cr-sources-actions");
      const editBtn = el("button", "cr-btn cr-btn--ghost cr-btn--sm", "Edit") as HTMLButtonElement;
      editBtn.type = "button";
      editBtn.addEventListener("click", () => showForm(source));
      const delBtn = el("button", "cr-btn cr-btn--ghost cr-btn--sm", "Remove") as HTMLButtonElement;
      delBtn.type = "button";
      delBtn.addEventListener("click", () => {
        if (!confirm(`Remove "${source.title}"?`)) return;
        sources = sources.filter(s => s.id !== source.id);
        saveSources(sources);
        redraw();
      });
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      row.appendChild(left);
      row.appendChild(actions);
      sourceList.appendChild(row);
    });
  }

  redraw();

  container.appendChild(hero);
  container.appendChild(statRow);
  container.appendChild(toolbar);
  container.appendChild(formArea);
  container.appendChild(sourceList);
}
