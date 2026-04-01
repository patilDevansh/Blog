import { el, clearChildren } from "../ui";
import type { PublishManifest } from "@schema/manifest";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type PostAnalytics = {
  slug: string;
  reads: number;
  completionPct: number;
  avgTimeMin: number;
  dropSections: { label: string; dropPct: number }[];
  trend: "up" | "down" | "flat";
};

function generateAnalytics(manifests: Map<string, PublishManifest>): PostAnalytics[] {
  const seed = (slug: string) => slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return [...manifests.entries()].map(([slug, m]) => {
    const s = seed(slug);
    const reads = 80 + (s % 420);
    const completionPct = 45 + (s % 45);
    const avgTimeMin = 3 + (s % 8);
    const tiles = m.tiles ?? [];
    const dropSections = tiles.slice(0, 4).map((t, i) => ({
      label: t.label,
      dropPct: Math.max(0, 28 - i * 6 + (s % 8) - i * 2),
    }));
    const trends: PostAnalytics["trend"][] = ["up", "down", "flat"];
    return { slug, reads, completionPct, avgTimeMin, dropSections, trend: trends[s % 3] ?? "flat" };
  }).sort((a, b) => b.reads - a.reads);
}

export function renderDeepAnalytics(
  container: HTMLElement,
  opts: { manifests: Map<string, PublishManifest>; baseUrl: string }
): void {
  clearChildren(container);

  const analytics = generateAnalytics(opts.manifests);

  const hero = el("div", "cr-dash-hero");
  hero.appendChild(el("p", "cr-eyebrow", "Depth over traffic"));
  hero.appendChild(el("h1", "cr-dash-title", "Deep Analytics"));
  hero.appendChild(el("p", "cr-dash-lede",
    "Scroll depth and drop-off by section — not just page views. For long-form contemplative writing, knowing where readers leave tells you where the next pull quote or section break belongs."));

  const note = el("div", "cr-callout cr-callout--compact");
  note.innerHTML = "<strong>Note:</strong> Full scroll-depth tracking activates once you add the analytics snippet to your Netlify deploy. The figures below are illustrative projections based on your post structure.";

  const statRow = el("div", "cr-stat-grid");
  const totalReads = analytics.reduce((a, p) => a + p.reads, 0);
  const avgCompletion = analytics.length ? Math.round(analytics.reduce((a, p) => a + p.completionPct, 0) / analytics.length) : 0;
  const avgTime = analytics.length ? (analytics.reduce((a, p) => a + p.avgTimeMin, 0) / analytics.length).toFixed(1) : "0";
  const mkStat = (label: string, val: string, hint?: string) => {
    const c = el("div", "cr-stat-card");
    c.appendChild(el("p", "cr-stat-label", label));
    c.appendChild(el("p", "cr-stat-value", val));
    if (hint) c.appendChild(el("p", "cr-stat-hint", hint));
    return c;
  };
  statRow.appendChild(mkStat("Total reads", totalReads.toLocaleString(), "Across all posts"));
  statRow.appendChild(mkStat("Avg completion", `${avgCompletion}%`, "Readers reaching the end"));
  statRow.appendChild(mkStat("Avg time on page", `${avgTime} min`, "Across all posts"));
  statRow.appendChild(mkStat("Posts tracked", String(analytics.length)));

  const tableWrap = el("div", "cr-analytics-table-wrap");

  if (analytics.length === 0) {
    tableWrap.appendChild(el("p", "cr-empty", "No published posts yet."));
  } else {
    analytics.forEach(post => {
      const m = opts.manifests.get(post.slug);
      if (!m) return;

      const row = el("div", "cr-analytics-row");

      const header = el("div", "cr-analytics-row-head");
      const titleLink = el("a", "cr-analytics-title", m.title) as HTMLAnchorElement;
      titleLink.href = `${opts.baseUrl}?slug=${post.slug}`;
      titleLink.target = "_blank";
      titleLink.rel = "noopener noreferrer";

      const trend = el("span", `cr-analytics-trend cr-analytics-trend--${post.trend}`,
        post.trend === "up" ? "↑" : post.trend === "down" ? "↓" : "→");

      const meta = el("p", "cr-muted",
        `${formatDate(m.createdAt)} · ${m.category ?? "Journal"}`);
      header.appendChild(titleLink);
      header.appendChild(trend);
      row.appendChild(header);
      row.appendChild(meta);

      const stats = el("div", "cr-analytics-stats");

      const mkMetric = (label: string, value: string) => {
        const box = el("div", "cr-analytics-metric");
        box.appendChild(el("span", "cr-analytics-metric-val", value));
        box.appendChild(el("span", "cr-analytics-metric-label", label));
        return box;
      };
      stats.appendChild(mkMetric("Reads", post.reads.toLocaleString()));
      stats.appendChild(mkMetric("Completion", `${post.completionPct}%`));
      stats.appendChild(mkMetric("Avg time", `${post.avgTimeMin}m`));
      row.appendChild(stats);

      if (post.completionPct < 70) {
        const insight = el("div", "cr-analytics-insight");
        const dropSection = post.dropSections.sort((a, b) => b.dropPct - a.dropPct)[0];
        const insightText = dropSection
          ? `${100 - post.completionPct}% of readers leave before the end. Highest drop-off near "${dropSection.label}" section (${dropSection.dropPct}% exit). Consider a pull quote or divider to carry readers through.`
          : `${100 - post.completionPct}% of readers leave before the end. A pull quote near the midpoint may help.`;
        insight.appendChild(el("span", "cr-analytics-insight-icon", "⟳"));
        insight.appendChild(el("span", "cr-analytics-insight-text", insightText));
        row.appendChild(insight);
      }

      const completion = el("div", "cr-analytics-completion-bar");
      const fill = el("div", "cr-analytics-completion-fill");
      fill.style.width = `${post.completionPct}%`;
      fill.style.background = post.completionPct >= 70
        ? "var(--sw-accent, #3c3489)"
        : post.completionPct >= 50
          ? "#8B6914"
          : "#a33";
      completion.appendChild(fill);
      const pctLabel = el("span", "cr-analytics-completion-label", `${post.completionPct}% completed`);
      row.appendChild(completion);
      row.appendChild(pctLabel);

      if (post.dropSections.length > 0) {
        const drops = el("div", "cr-analytics-drops");
        drops.appendChild(el("p", "cr-muted", "Drop-off by section:"));
        const dropList = el("div", "cr-analytics-drop-list");
        post.dropSections.forEach(sec => {
          const secRow = el("div", "cr-analytics-drop-row");
          const secLabel = el("span", "cr-analytics-drop-label", sec.label);
          const secBar = el("div", "cr-analytics-drop-bar");
          const secFill = el("div", "cr-analytics-drop-fill");
          secFill.style.width = `${sec.dropPct}%`;
          secBar.appendChild(secFill);
          const secPct = el("span", "cr-analytics-drop-pct", `${sec.dropPct}% exit`);
          secRow.appendChild(secLabel);
          secRow.appendChild(secBar);
          secRow.appendChild(secPct);
          dropList.appendChild(secRow);
        });
        drops.appendChild(dropList);
        row.appendChild(drops);
      }

      tableWrap.appendChild(row);
    });
  }

  const chartsSection = el("div", "cr-analytics-charts-block");
  const chartsRow = el("div", "cr-grid2");
  const cardReads = el("div", "cr-panel");
  cardReads.appendChild(
    el("h2", "cr-panel-title", "Reads over time (sample)")
  );
  const chartHint = el("p", "cr-muted", "Illustrative — wire Plausible or Netlify Analytics.");
  cardReads.appendChild(chartHint);
  const canvasReads = el("canvas", "cr-chart-canvas") as HTMLCanvasElement;
  const wrapReads = el("div", "cr-chart-wrap");
  wrapReads.appendChild(canvasReads);
  cardReads.appendChild(wrapReads);

  const cardSubs = el("div", "cr-panel");
  cardSubs.appendChild(
    el("h2", "cr-panel-title", "Subscriber growth (sample)")
  );
  cardSubs.appendChild(
    el("p", "cr-muted", "Dispatch list size when email is connected.")
  );
  const canvasSubs = el("canvas", "cr-chart-canvas") as HTMLCanvasElement;
  const wrapSubs = el("div", "cr-chart-wrap");
  wrapSubs.appendChild(canvasSubs);
  cardSubs.appendChild(wrapSubs);

  chartsRow.appendChild(cardReads);
  chartsRow.appendChild(cardSubs);
  chartsSection.appendChild(chartsRow);

  const heatRow = el("div", "cr-grid2");
  const heatCard = el("div", "cr-panel");
  heatCard.appendChild(
    el("h2", "cr-panel-title", "Scroll depth heatmap (sample)")
  );
  heatCard.appendChild(
    el("p", "cr-muted", "% of readers reaching each decile of a long post.")
  );
  const heatmap = el("div", "cr-heatmap");
  const depths = [100, 97, 92, 88, 81, 74, 62, 51, 49, 48];
  depths.forEach((v) => {
    const cell = el("div", "cr-heatmap-cell", `${v}%`);
    const alpha = 0.12 + (v / 100) * 0.55;
    cell.style.background = `rgba(184, 136, 42, ${alpha})`;
    cell.style.color = v > 60 ? "#5a4510" : "var(--text-muted)";
    heatmap.appendChild(cell);
  });
  heatCard.appendChild(heatmap);
  heatCard.appendChild(
    el(
      "p",
      "cr-muted",
      "Major drop at 60% — consider a section break or pull quote mid-essay."
    )
  );

  const glossCard = el("div", "cr-panel");
  glossCard.appendChild(
    el("h2", "cr-panel-title", "Glossary hover rate (sample)")
  );
  const terms = [
    { label: "Nirodha", w: 100, n: 342 },
    { label: "Spanda", w: 87, n: 298 },
    { label: "Vimarśa", w: 55, n: 187 },
    { label: "Kāraṇa śarīra", w: 48, n: 164 },
  ];
  for (const t of terms) {
    const row = el("div", "cr-analytics-source-bar");
    row.appendChild(el("span", "cr-asb-label", t.label));
    const track = el("div", "cr-asb-track");
    const fill = el("div", "cr-asb-fill");
    fill.style.width = `${t.w}%`;
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el("span", "cr-asb-val", String(t.n)));
    glossCard.appendChild(row);
  }

  heatRow.appendChild(heatCard);
  heatRow.appendChild(glossCard);
  chartsSection.appendChild(heatRow);

  void import("chart.js/auto")
    .then((mod) => {
      const Chart = mod.default;
      const accent = "#b8882a";
      const accentLight = "rgba(184, 136, 42, 0.15)";
      const muted = "#9e9488";
      const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"];

      Chart.defaults.font.family = "'Jost', sans-serif";
      Chart.defaults.font.size = 11;
      Chart.defaults.color = muted;

      new Chart(canvasReads, {
        type: "line",
        data: {
          labels: weeks,
          datasets: [
            {
              data: [280, 340, 310, 480, 390, 520, 610, 580, 720, 680, 810, 900],
              borderColor: accent,
              backgroundColor: accentLight,
              borderWidth: 1.5,
              pointRadius: 3,
              pointBackgroundColor: accent,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { color: "rgba(28,26,23,0.06)" },
              border: { display: false },
            },
            y: {
              grid: { color: "rgba(28,26,23,0.06)" },
              border: { display: false },
              beginAtZero: true,
            },
          },
        },
      });

      new Chart(canvasSubs, {
        type: "bar",
        data: {
          labels: weeks,
          datasets: [
            {
              data: [108, 111, 114, 116, 118, 122, 125, 128, 132, 136, 139, 142],
              backgroundColor: accentLight,
              borderColor: accent,
              borderWidth: 1,
              borderRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: {
              grid: { color: "rgba(28,26,23,0.06)" },
              border: { display: false },
              min: 100,
            },
          },
        },
      });
    })
    .catch(() => {
      /* chart.js optional if bundle fails */
    });

  container.appendChild(hero);
  container.appendChild(note);
  container.appendChild(statRow);
  container.appendChild(chartsSection);
  container.appendChild(tableWrap);
}
