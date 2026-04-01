import { el, clearChildren } from "../ui";

export type GlossaryTerm = {
  id: string;
  term: string;
  transliteration: string;
  script: "Sanskrit" | "Tibetan" | "Chinese" | "Other";
  tradition: string;
  definition: string;
  lookups: number;
};

const STORAGE_KEY = "stillwater-glossary";

function loadTerms(): GlossaryTerm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as GlossaryTerm[];
  } catch { /* ignore */ }
  const samples: GlossaryTerm[] = [
    { id: "g1", term: "निरोध", transliteration: "nirodha", script: "Sanskrit", tradition: "Patanjali", definition: "Cessation or restraint of the modifications of the mind (citta-vṛtti). The goal of yoga in Patanjali's formulation — not suppression, but the settling of mental activity into its ground.", lookups: 47 },
    { id: "g2", term: "प्रत्यभिज्ञा", transliteration: "pratyabhijñā", script: "Sanskrit", tradition: "Kashmir Shaivism", definition: "Recognition — the sudden or gradual recognition that one's own awareness is identical with the universal consciousness (Śiva). The central soteriological concept of the Pratyabhijñā school.", lookups: 38 },
    { id: "g3", term: "རིག་པ", transliteration: "rigpa", script: "Tibetan", tradition: "Vajrayana", definition: "Awareness in its primordial, unmodified state. In Dzogchen, the recognition of rigpa is the fundamental insight — not a state to be achieved, but what has always been present.", lookups: 62 },
    { id: "g4", term: "स्पन्द", transliteration: "spanda", script: "Sanskrit", tradition: "Kashmir Shaivism", definition: "The divine vibration or throb that is the dynamic aspect of pure consciousness. Spanda is not movement in space but the self-luminous pulsation that underlies all experience.", lookups: 29 },
    { id: "g5", term: "क्रिया", transliteration: "kriyā", script: "Sanskrit", tradition: "Kriya Yoga", definition: "Action, ritual action, or the specific yogic practices transmitted in the Kriya lineage through Mahavatar Babaji. Distinct from karma (action and its fruits).", lookups: 41 },
    { id: "g6", term: "無為", transliteration: "wúwéi", script: "Chinese", tradition: "Taoism", definition: "Non-action or effortless action — acting in accordance with the natural flow of the Tao without forcing or contriving. Central to Daoist ethics and practice.", lookups: 33 },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
  return samples;
}

function saveTerms(terms: GlossaryTerm[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
}

function uid(): string { return Math.random().toString(36).slice(2, 10); }

const TRADITIONS = ["Advaita", "Kashmir Shaivism", "Tantra", "Vajrayana", "Patanjali", "Taoism", "Navnath", "Kriya Yoga", "84 Mahasiddhas", "Osho", "General"];
const SCRIPTS = ["Sanskrit", "Tibetan", "Chinese", "Other"] as const;

export function renderGlossary(container: HTMLElement): void {
  clearChildren(container);

  let terms = loadTerms();
  let searchQ = "";

  const hero = el("div", "cr-dash-hero");
  hero.appendChild(el("p", "cr-eyebrow", "Living reference"));
  hero.appendChild(el("h1", "cr-dash-title", "Glossary & Terminology"));
  hero.appendChild(el("p", "cr-dash-lede",
    "Sanskrit, Tibetan, and other terms your readers encounter across posts. Inline hover definitions mean they never leave mid-sentence to look something up."));

  const toolbar = el("div", "cr-toolbar");
  const searchWrap = el("div", "cr-search-wrap");
  const searchIn = el("input", "cr-search") as HTMLInputElement;
  searchIn.type = "search";
  searchIn.placeholder = "Search terms…";
  searchIn.addEventListener("input", () => { searchQ = searchIn.value.toLowerCase(); redraw(); });
  searchWrap.appendChild(searchIn);

  const addBtn = el("button", "cr-btn cr-btn--primary", "+ Add term") as HTMLButtonElement;
  addBtn.type = "button";
  toolbar.appendChild(searchWrap);
  toolbar.appendChild(addBtn);

  const formArea = el("div", "cr-glossary-form-area");
  const termList = el("div", "cr-glossary-list");

  function showForm(existing?: GlossaryTerm): void {
    clearChildren(formArea);
    const form = el("div", "cr-panel");
    form.appendChild(el("h2", "cr-panel-title", existing ? "Edit term" : "Add new term"));

    const row1 = el("div", "cr-glossary-form-row");

    const termF = el("div", "creator-field");
    termF.appendChild(el("label", "", "Term (in original script)"));
    const termIn = el("input") as HTMLInputElement;
    termIn.value = existing?.term ?? "";
    termIn.placeholder = "निरोध";
    termF.appendChild(termIn);
    row1.appendChild(termF);

    const litF = el("div", "creator-field");
    litF.appendChild(el("label", "", "Transliteration / romanisation"));
    const litIn = el("input") as HTMLInputElement;
    litIn.value = existing?.transliteration ?? "";
    litIn.placeholder = "nirodha";
    litF.appendChild(litIn);
    row1.appendChild(litF);

    form.appendChild(row1);

    const row2 = el("div", "cr-glossary-form-row");
    const scriptF = el("div", "creator-field");
    scriptF.appendChild(el("label", "", "Script"));
    const scriptSel = el("select") as HTMLSelectElement;
    SCRIPTS.forEach(s => {
      const o = el("option", "", s) as HTMLOptionElement;
      o.value = s;
      if (existing?.script === s) o.selected = true;
      scriptSel.appendChild(o);
    });
    scriptF.appendChild(scriptSel);
    row2.appendChild(scriptF);

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

    const defF = el("div", "creator-field");
    defF.appendChild(el("label", "", "Definition"));
    const defTa = el("textarea") as HTMLTextAreaElement;
    defTa.rows = 3;
    defTa.value = existing?.definition ?? "";
    defTa.placeholder = "A clear, precise definition. Assume a reader with genuine practice but no academic training.";
    defF.appendChild(defTa);
    form.appendChild(defF);

    const btnRow = el("div", "creator-actions");
    const saveBtn = el("button", "cr-btn cr-btn--primary", existing ? "Save changes" : "Add to glossary") as HTMLButtonElement;
    saveBtn.type = "button";
    saveBtn.addEventListener("click", () => {
      const t = termIn.value.trim();
      const l = litIn.value.trim();
      const d = defTa.value.trim();
      if (!t || !l || !d) return;
      if (existing) {
        existing.term = t; existing.transliteration = l;
        existing.script = scriptSel.value as GlossaryTerm["script"];
        existing.tradition = tradSel.value; existing.definition = d;
      } else {
        terms.unshift({ id: uid(), term: t, transliteration: l, script: scriptSel.value as GlossaryTerm["script"], tradition: tradSel.value, definition: d, lookups: 0 });
      }
      saveTerms(terms);
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
  }

  addBtn.addEventListener("click", () => showForm());

  function redraw(): void {
    clearChildren(termList);
    const visible = searchQ
      ? terms.filter(t => t.transliteration.includes(searchQ) || t.term.includes(searchQ) || t.definition.toLowerCase().includes(searchQ))
      : [...terms].sort((a, b) => b.lookups - a.lookups);

    if (visible.length === 0) {
      termList.appendChild(el("p", "cr-empty", "No terms yet. Add your first."));
      return;
    }

    visible.forEach(term => {
      const row = el("div", "cr-glossary-row");
      const left = el("div", "cr-glossary-left");
      const termSpan = el("span", "cr-glossary-term", term.term);
      const litSpan = el("span", "cr-glossary-lit", term.transliteration);
      const scriptBadge = el("span", "cr-badge cr-badge--draft", `${term.script} · ${term.tradition}`);
      left.appendChild(termSpan);
      left.appendChild(litSpan);
      left.appendChild(scriptBadge);

      const def = el("p", "cr-glossary-def", term.definition);

      const meta = el("div", "cr-glossary-meta");
      meta.appendChild(el("span", "cr-muted", `${term.lookups} reader lookups`));
      const editBtn = el("button", "cr-btn cr-btn--ghost cr-btn--sm", "Edit") as HTMLButtonElement;
      editBtn.type = "button";
      editBtn.addEventListener("click", () => { showForm(term); });
      const delBtn = el("button", "cr-btn cr-btn--ghost cr-btn--sm", "Remove") as HTMLButtonElement;
      delBtn.type = "button";
      delBtn.addEventListener("click", () => {
        if (!confirm(`Remove "${term.transliteration}"?`)) return;
        terms = terms.filter(t => t.id !== term.id);
        saveTerms(terms);
        redraw();
      });
      meta.appendChild(editBtn);
      meta.appendChild(delBtn);

      row.appendChild(left);
      row.appendChild(def);
      row.appendChild(meta);
      termList.appendChild(row);
    });
  }

  redraw();

  container.appendChild(hero);
  container.appendChild(toolbar);
  container.appendChild(formArea);
  container.appendChild(termList);
}
