import type { PublishManifest } from "@schema/manifest";
import { journalPostUrl } from "../../lib/site-paths";
import {
  estimatedWordCount,
  sectionCount,
} from "../../lib/manifest-stats";
import { el, clearChildren } from "../ui";

export function renderAnalytics(
  container: HTMLElement,
  opts: { manifests: Map<string, PublishManifest>; baseUrl: string }
): void {
  clearChildren(container);

  const hero = el("div", "cr-dash-hero");
  hero.appendChild(el("p", "cr-eyebrow", "Insights"));
  hero.appendChild(el("h1", "cr-dash-title", "Content analytics"));
  hero.appendChild(
    el(
      "p",
      "cr-dash-lede",
      "Estimates from bundled manifests. Wire real traffic (Plausible, etc.) when you add a backend."
    )
  );

  const note = el("div", "cr-callout");
  note.appendChild(
    el(
      "p",
      "",
      "View counts and referrers are not available in static mode. Use this table to audit length, structure, and freshness before you publish."
    )
  );

  const tableWrap = el("div", "cr-table-wrap");
  const table = el("table", "cr-table");
  const thead = el("thead");
  const hr = el("tr");
  for (const h of [
    "Post",
    "Date",
    "Sections",
    "Words (est.)",
    "Read time",
    "",
  ]) {
    const th = el("th", "", h);
    hr.appendChild(th);
  }
  thead.appendChild(hr);
  table.appendChild(thead);

  const tb = el("tbody");
  const rows = [...opts.manifests.entries()].sort(
    (a, b) =>
      new Date(b[1].createdAt).getTime() - new Date(a[1].createdAt).getTime()
  );

  for (const [slug, m] of rows) {
    const tr = el("tr");
    const tdTitle = el("td");
    const link = el("a", "", m.title);
    link.href = journalPostUrl(opts.baseUrl, slug);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const slugSpan = el("div", "cr-table-sub", slug);
    tdTitle.appendChild(link);
    tdTitle.appendChild(slugSpan);
    tr.appendChild(tdTitle);
    tr.appendChild(
      el(
        "td",
        "",
        new Date(m.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      )
    );
    tr.appendChild(el("td", "", String(sectionCount(m))));
    tr.appendChild(el("td", "", String(estimatedWordCount(m))));
    tr.appendChild(
      el(
        "td",
        "",
        m.readTimeMinutes != null ? `${m.readTimeMinutes} min` : "—"
      )
    );
    const tdGo = el("td");
    const open = el("a", "cr-link-quiet", "Preview") as HTMLAnchorElement;
    open.href = journalPostUrl(opts.baseUrl, slug);
    open.target = "_blank";
    open.rel = "noopener noreferrer";
    tdGo.appendChild(open);
    tr.appendChild(tdGo);
    tb.appendChild(tr);
  }

  table.appendChild(tb);
  tableWrap.appendChild(table);

  if (rows.length === 0) {
    const empty = el("p", "cr-empty", "No posts to analyze.");
    container.appendChild(hero);
    container.appendChild(empty);
    return;
  }

  container.appendChild(hero);
  container.appendChild(note);
  container.appendChild(tableWrap);
}
