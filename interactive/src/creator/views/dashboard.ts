import type { PublishManifest } from "@schema/manifest";
import { estimatedWordCount } from "../../lib/manifest-stats";
import { el, clearChildren } from "../ui";
import type { ViewId } from "../types";
import { getWritingBoardCards, type BoardCard } from "./writing-board";

function pct(card: BoardCard): number {
  if (!card.wordTarget) return 0;
  return Math.min(100, Math.round((card.wordCount / card.wordTarget) * 100));
}

export function renderDashboard(
  container: HTMLElement,
  opts: {
    manifests: Map<string, PublishManifest>;
    draftSlugs: Set<string>;
    navigate: (v: ViewId, o?: { editorSlug?: string }) => void;
    baseUrl: string;
  }
): void {
  clearChildren(container);

  const list = [...opts.manifests.entries()].sort(
    (a, b) =>
      new Date(b[1].createdAt).getTime() - new Date(a[1].createdAt).getTime()
  );

  let totalWords = 0;
  for (const [, m] of opts.manifests) {
    totalWords += estimatedWordCount(m);
  }

  const boardCards = getWritingBoardCards();
  const inPipeline = boardCards.filter((c) =>
    ["seed", "research", "drafting", "editing", "ready"].includes(c.column)
  ).length;

  const head = el("div", "cr-view-head");
  head.appendChild(el("p", "cr-eyebrow", "Creator Studio"));
  const headRow = el("div", "cr-view-head__row");
  headRow.appendChild(el("h1", "cr-view-title", "Overview"));
  const actions = el("div", "cr-view-head__actions");
  const b1 = el("button", "cr-btn cr-btn--ghost cr-btn--sm", "Writing board") as HTMLButtonElement;
  b1.type = "button";
  b1.addEventListener("click", () => opts.navigate("writing-board"));
  const b2 = el("button", "cr-btn cr-btn--primary cr-btn--sm", "+ New post") as HTMLButtonElement;
  b2.type = "button";
  b2.addEventListener("click", () => opts.navigate("compose"));
  actions.appendChild(b1);
  actions.appendChild(b2);
  headRow.appendChild(actions);
  head.appendChild(headRow);
  head.appendChild(
    el(
      "p",
      "cr-view-lede",
      "Your writing pipeline at a glance. Stats mix live bundle data with illustrative placeholders until analytics are connected."
    )
  );
  container.appendChild(head);

  const stats = el("div", "cr-dash-stats");
  const mkStat = (label: string, value: string, hint: string) => {
    const card = el("div", "cr-dash-stat");
    card.appendChild(el("div", "cr-dash-stat-label", label));
    card.appendChild(el("div", "cr-dash-stat-value", value));
    card.appendChild(el("div", "cr-dash-stat-hint", hint));
    return card;
  };
  stats.appendChild(
    mkStat(
      "Posts live",
      String(opts.manifests.size),
      `${inPipeline} in pipeline on board`
    )
  );
  stats.appendChild(
    mkStat(
      "Local drafts",
      String(opts.draftSlugs.size),
      "This browser only"
    )
  );
  stats.appendChild(
    mkStat("Words (est.)", totalWords.toLocaleString(), "Across all manifests")
  );
  stats.appendChild(
    mkStat(
      "Board cards",
      String(boardCards.length),
      "Ideas & drafts in kanban"
    )
  );
  container.appendChild(stats);

  const grid = el("div", "cr-dash-layout");
  const left = el("div", "cr-dash-col cr-dash-col--main");
  const right = el("div", "cr-dash-col cr-dash-col--side");

  const snap = el("div", "cr-dash-card");
  snap.appendChild(el("div", "cr-dash-card-title", "Writing board snapshot"));
  const active = boardCards.filter((c) =>
    ["drafting", "editing", "research", "ready"].includes(c.column)
  );
  const show = active.slice(0, 3);
  if (show.length === 0) {
    snap.appendChild(
      el(
        "p",
        "cr-dash-muted",
        "No cards in motion yet. Open the writing board to add seeds and drafts."
      )
    );
  }
  for (const c of show) {
    const row = el("div", "cr-dash-snap-row");
    const leftBit = el("div");
    leftBit.appendChild(
      el(
        "div",
        "cr-dash-snap-trad",
        `${c.tradition} · ${c.column}`
      )
    );
    leftBit.appendChild(el("div", "cr-dash-snap-title", c.title));
    const rightBit = el("div", "cr-dash-snap-metric");
    if (c.wordTarget > 0) {
      rightBit.appendChild(
        el(
          "div",
          "cr-dash-snap-wc",
          `${c.wordCount.toLocaleString()} / ${c.wordTarget.toLocaleString()}`
        )
      );
      const track = el("div", "cr-dash-snap-bar");
      const fill = el("div", "cr-dash-snap-fill");
      fill.style.width = `${pct(c)}%`;
      track.appendChild(fill);
      rightBit.appendChild(track);
    } else {
      rightBit.appendChild(el("div", "cr-dash-snap-wc", "—"));
    }
    row.appendChild(leftBit);
    row.appendChild(rightBit);
    snap.appendChild(row);
  }
  const openBoard = el(
    "button",
    "cr-btn cr-btn--ghost cr-btn--sm cr-dash-card-btn",
    "Open full board →"
  ) as HTMLButtonElement;
  openBoard.type = "button";
  openBoard.addEventListener("click", () => opts.navigate("writing-board"));
  snap.appendChild(openBoard);
  left.appendChild(snap);

  const chartCard = el("div", "cr-dash-card");
  chartCard.appendChild(
    el("div", "cr-dash-card-title", "Reads by tradition (sample)")
  );
  const canvas = el("canvas", "cr-dash-chart") as HTMLCanvasElement;
  chartCard.appendChild(canvas);
  left.appendChild(chartCard);

  const tasks = el("div", "cr-dash-card");
  tasks.appendChild(el("div", "cr-dash-card-title", "Pending tasks"));
  const taskItems: [string, string][] = [
    ["Review drafts in Post Library", "Ship or trim before next dispatch"],
    ["Reply to reader letters", "Public footnotes build trust"],
    ["Tune glossary terms", "High-hover terms need richer defs"],
  ];
  for (const [t, m] of taskItems) {
    const ti = el("div", "cr-dash-task");
    ti.appendChild(el("span", "cr-dash-task-dot"));
    const tx = el("div");
    tx.appendChild(el("div", "cr-dash-task-text", t));
    tx.appendChild(el("div", "cr-dash-task-meta", m));
    ti.appendChild(tx);
    tasks.appendChild(ti);
  }
  const lettersBtn = el(
    "button",
    "cr-btn cr-btn--ghost cr-btn--sm",
    "Open letters →"
  ) as HTMLButtonElement;
  lettersBtn.type = "button";
  lettersBtn.addEventListener("click", () => opts.navigate("reader-letters"));
  tasks.appendChild(lettersBtn);
  right.appendChild(tasks);

  const recent = el("div", "cr-dash-card");
  recent.appendChild(el("div", "cr-dash-card-title", "Recent posts"));
  for (const [slug, m] of list.slice(0, 4)) {
    const r = el("div", "cr-dash-recent-row");
    const pill = el(
      "span",
      "cr-lib-pill " +
        (opts.draftSlugs.has(slug) ? "cr-lib-pill--draft" : "cr-lib-pill--pub"),
      opts.draftSlugs.has(slug) ? "Draft" : "Live"
    );
    const t = el("span", "cr-dash-recent-title", m.title);
    t.style.cursor = "pointer";
    t.addEventListener("click", () =>
      opts.navigate("editor", { editorSlug: slug })
    );
    const meta = el(
      "span",
      "cr-dash-recent-meta",
      `${estimatedWordCount(m)} w`
    );
    r.appendChild(pill);
    r.appendChild(t);
    r.appendChild(meta);
    recent.appendChild(r);
  }
  if (list.length === 0) {
    recent.appendChild(el("p", "cr-dash-muted", "No manifests in this build yet."));
  }
  right.appendChild(recent);

  grid.appendChild(left);
  grid.appendChild(right);
  container.appendChild(grid);

  void import("chart.js/auto")
    .then(({ default: Chart }) => {
      const gold = "#b8882a";
      const goldLight = "rgba(184, 136, 42, 0.15)";
      const labels = [
        "Kashmir Shaivism",
        "Yoga Sutras",
        "Tantra",
        "Vajrayana",
        "Kriya",
      ];
      const data = [42, 28, 22, 18, 14];
      new Chart(canvas, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: goldLight,
              borderColor: gold,
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.06)" } },
          },
        },
      });
    })
    .catch(() => {
      canvas.replaceWith(
        el("p", "cr-dash-muted", "Chart unavailable offline.")
      );
    });
}
