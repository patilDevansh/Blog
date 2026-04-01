import { el, clearChildren } from "../ui";

export type BoardColumn =
  | "seed"
  | "research"
  | "drafting"
  | "editing"
  | "ready"
  | "published"
  | "vault";

export type BoardCard = {
  id: string;
  title: string;
  tradition: string;
  column: BoardColumn;
  wordTarget: number;
  wordCount: number;
  notes: string;
  createdAt: string;
  sparkedBy?: string;
};

const STORAGE_KEY = "stillwater-writing-board";

const COLUMNS: { id: BoardColumn; label: string }[] = [
  { id: "seed", label: "Seed idea" },
  { id: "research", label: "Research" },
  { id: "drafting", label: "Drafting" },
  { id: "editing", label: "Editing" },
  { id: "ready", label: "Ready" },
  { id: "published", label: "Published" },
  { id: "vault", label: "Seed vault" },
];

const FLOW: BoardColumn[] = [
  "seed",
  "research",
  "drafting",
  "editing",
  "ready",
];

const TRADITIONS = [
  "All traditions",
  "Advaita",
  "Kashmir Shaivism",
  "Tantra",
  "Vajrayana",
  "Patanjali",
  "Taoism",
  "Navnath",
  "Kriya Yoga",
  "84 Mahasiddhas",
  "General",
];

function migrateColumn(raw: string): BoardColumn {
  const legacy: Record<string, BoardColumn> = {
    idea: "seed",
    drafting: "drafting",
    reviewing: "editing",
    ready: "ready",
  };
  if (legacy[raw]) return legacy[raw]!;
  const ok = COLUMNS.some((c) => c.id === raw);
  return ok ? (raw as BoardColumn) : "seed";
}

/** For dashboard snapshot widgets. */
export function getWritingBoardCards(): BoardCard[] {
  return loadCards();
}

function loadCards(): BoardCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BoardCard[];
    return parsed.map((c) => ({
      ...c,
      column: migrateColumn(c.column as string),
    }));
  } catch {
    return [];
  }
}

function saveCards(cards: BoardCard[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function pct(card: BoardCard): number {
  if (!card.wordTarget) return 0;
  return Math.min(100, Math.round((card.wordCount / card.wordTarget) * 100));
}

export function renderWritingBoard(container: HTMLElement): void {
  clearChildren(container);

  let cards = loadCards();
  let filterTrad = "All traditions";

  const head = el("div", "cr-view-head");
  head.appendChild(el("p", "cr-eyebrow", "Creative pipeline"));
  const row = el("div", "cr-view-head__row");
  row.appendChild(el("h1", "cr-view-title", "Writing Board"));
  const headActions = el("div", "cr-view-head__actions");
  const newIdea = el(
    "button",
    "cr-btn cr-btn--primary cr-btn--sm",
    "+ New idea"
  ) as HTMLButtonElement;
  newIdea.type = "button";
  headActions.appendChild(newIdea);
  row.appendChild(headActions);
  head.appendChild(row);
  head.appendChild(
    el(
      "p",
      "cr-view-lede",
      "From seed to published. Move cards along the pipeline; word-count bars show which drafts are almost ready."
    )
  );

  container.appendChild(head);

  const pills = el("div", "cr-pill-strip");
  TRADITIONS.forEach((t) => {
    const b = el("button", "cr-pill-btn", t) as HTMLButtonElement;
    b.type = "button";
    b.dataset.tradition = t;
    b.classList.toggle("is-active", t === filterTrad);
    b.addEventListener("click", () => {
      filterTrad = t;
      pills.querySelectorAll(".cr-pill-btn").forEach((p) => {
        p.classList.toggle(
          "is-active",
          (p as HTMLButtonElement).dataset.tradition === t
        );
      });
      paint();
    });
    pills.appendChild(b);
  });
  const toolRow = el("div", "cr-board-toolrow");
  toolRow.appendChild(pills);
  container.appendChild(toolRow);

  const boardWrap = el("div", "cr-kanban-wrap");
  const board = el("div", "cr-kanban");
  boardWrap.appendChild(board);
  container.appendChild(boardWrap);

  let adding = false;

  function openNewIdeaForm(): void {
    if (adding) return;
    adding = true;
    const form = el("div", "cr-board-newcard cr-panel");

    const titleIn = el("input", "cr-input") as HTMLInputElement;
    titleIn.placeholder = "Working title or phrase…";

    const tradSel = el("select", "cr-input") as HTMLSelectElement;
    TRADITIONS.filter((x) => x !== "All traditions").forEach((t) => {
      tradSel.appendChild(el("option", "", t) as HTMLOptionElement);
    });

    const spark = el("input", "cr-input") as HTMLInputElement;
    spark.placeholder = "Sparked by: e.g. reader letter, text study";
    const targetIn = el("input", "cr-input") as HTMLInputElement;
    targetIn.type = "number";
    targetIn.min = "200";
    targetIn.step = "200";
    targetIn.value = "3000";

    const notesIn = el("textarea", "cr-input cr-textarea") as HTMLTextAreaElement;
    notesIn.placeholder = "Central tension, key questions…";
    notesIn.rows = 2;

    const btns = el("div", "cr-btn-row-tight");
    const saveBtn = el("button", "cr-btn cr-btn--primary cr-btn--sm", "Add card") as HTMLButtonElement;
    const cancelBtn = el("button", "cr-btn cr-btn--ghost cr-btn--sm", "Cancel") as HTMLButtonElement;
    saveBtn.type = "button";
    cancelBtn.type = "button";

    function close(): void {
      adding = false;
      form.remove();
    }

    saveBtn.addEventListener("click", () => {
      const title = titleIn.value.trim();
      if (!title) return;
      const card: BoardCard = {
        id: uid(),
        title,
        tradition: tradSel.value,
        column: "seed",
        wordTarget: Number(targetIn.value) || 3000,
        wordCount: 0,
        notes: notesIn.value.trim(),
        sparkedBy: spark.value.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      cards = [card, ...cards];
      saveCards(cards);
      close();
      paint();
    });
    cancelBtn.addEventListener("click", close);

    form.appendChild(el("p", "cr-mini-label", "New card"));
    form.appendChild(titleIn);
    form.appendChild(tradSel);
    form.appendChild(spark);
    form.appendChild(targetIn);
    form.appendChild(notesIn);
    btns.appendChild(saveBtn);
    btns.appendChild(cancelBtn);
    form.appendChild(btns);
    container.insertBefore(form, boardWrap);
    titleIn.focus();
  }

  newIdea.addEventListener("click", openNewIdeaForm);

  function filtered(list: BoardCard[]): BoardCard[] {
    if (filterTrad === "All traditions") return list;
    return list.filter((c) => c.tradition === filterTrad);
  }

  function paint(): void {
    clearChildren(board);
    const list = filtered(cards);

    for (const col of COLUMNS) {
      const colCards = list.filter((c) => c.column === col.id);
      const colEl = el("div", "cr-kcol");
      if (col.id === "vault") colEl.classList.add("cr-kcol--muted");

      const headCol = el("div", "cr-kcol-head");
      headCol.appendChild(el("span", "cr-kcol-label", col.label));
      headCol.appendChild(el("span", "cr-kcol-count", String(colCards.length)));
      colEl.appendChild(headCol);

      const body = el("div", "cr-kcol-body");

      if (colCards.length === 0) {
        body.appendChild(el("p", "cr-kcol-empty", "—"));
      }

      for (const card of colCards) {
        const cardEl = el("article", "cr-kcard");
        cardEl.appendChild(
          el("div", "cr-kcard-trad", card.tradition.toUpperCase())
        );
        cardEl.appendChild(el("h3", "cr-kcard-title", card.title));
        if (card.sparkedBy) {
          cardEl.appendChild(
            el("p", "cr-kcard-spark", `Sparked by: ${card.sparkedBy}`)
          );
        }
        if (card.notes && col.id === "seed") {
          cardEl.appendChild(el("p", "cr-kcard-notes", card.notes));
        }

        const trackProgress = ["research", "drafting", "editing", "ready"].includes(
          col.id
        );
        if (card.wordTarget > 0 && trackProgress) {
          const prog = el("div", "cr-kcard-prog");
          const bar = el("div", "cr-kcard-bar");
          bar.style.width = `${pct(card)}%`;
          prog.appendChild(bar);
          cardEl.appendChild(prog);
          cardEl.appendChild(
            el(
              "p",
              "cr-kcard-meta",
              `${card.wordCount.toLocaleString()} / ${card.wordTarget.toLocaleString()} words`
            )
          );
        } else if (col.id === "published") {
          cardEl.appendChild(
            el("p", "cr-kcard-meta", card.notes || "Shipped from studio")
          );
        }

        if (trackProgress) {
          const wcRow = el("div", "cr-kcard-wc");
          const wcLabel = el("span", "cr-mini-muted", "Words written");
          const wcIn = el("input", "cr-input cr-input--inline") as HTMLInputElement;
          wcIn.type = "number";
          wcIn.min = "0";
          wcIn.value = String(card.wordCount);
          wcIn.addEventListener("change", () => {
            card.wordCount = Math.max(0, Number(wcIn.value) || 0);
            saveCards(cards);
            paint();
          });
          wcRow.appendChild(wcLabel);
          wcRow.appendChild(wcIn);
          cardEl.appendChild(wcRow);
        }

        const actions = el("div", "cr-kcard-actions");
        const idx = FLOW.indexOf(col.id);
        if (idx > 0) {
          const prev = el("button", "cr-mini-btn", "←") as HTMLButtonElement;
          prev.type = "button";
          prev.title = "Move back";
          prev.addEventListener("click", () => {
            card.column = FLOW[idx - 1]!;
            saveCards(cards);
            paint();
          });
          actions.appendChild(prev);
        }
        if (idx >= 0 && idx < FLOW.length - 1) {
          const next = el("button", "cr-mini-btn cr-mini-btn--primary", "→") as HTMLButtonElement;
          next.type = "button";
          next.title = "Advance";
          next.addEventListener("click", () => {
            card.column = FLOW[idx + 1]!;
            saveCards(cards);
            paint();
          });
          actions.appendChild(next);
        }
        if (col.id === "ready") {
          const pub = el("button", "cr-mini-btn", "Mark published") as HTMLButtonElement;
          pub.type = "button";
          pub.addEventListener("click", () => {
            card.column = "published";
            saveCards(cards);
            paint();
          });
          actions.appendChild(pub);
        }
        if (col.id !== "vault") {
          const arch = el("button", "cr-mini-btn", "Vault") as HTMLButtonElement;
          arch.type = "button";
          arch.title = "Archive to seed vault";
          arch.addEventListener("click", () => {
            card.column = "vault";
            saveCards(cards);
            paint();
          });
          actions.appendChild(arch);
        }
        const del = el("button", "cr-mini-btn cr-mini-btn--danger", "✕") as HTMLButtonElement;
        del.type = "button";
        del.addEventListener("click", () => {
          if (!confirm(`Remove “${card.title}”?`)) return;
          cards = cards.filter((c) => c.id !== card.id);
          saveCards(cards);
          paint();
        });
        actions.appendChild(del);

        cardEl.appendChild(actions);
        body.appendChild(cardEl);
      }

      colEl.appendChild(body);
      board.appendChild(colEl);
    }
  }

  paint();
}
