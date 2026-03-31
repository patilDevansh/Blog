import type { PublishManifest } from "@schema/manifest";
import { journalPostUrl } from "../../lib/site-paths";
import { estimatedWordCount, sectionCount } from "../../lib/manifest-stats";
import { el, clearChildren } from "../ui";
import type { ViewId } from "../types";

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

  const hero = el("div", "cr-dash-hero");
  const eyebrow = el("p", "cr-eyebrow", "Creator studio");
  const h1 = el("h1", "cr-dash-title", "Overview");
  const lede = el(
    "p",
    "cr-dash-lede",
    "Write in plain language; posts live in your database or GitHub. Open any post below (Edit) to change text, headings, and images in the browser — no JSON required for everyday edits."
  );
  hero.appendChild(eyebrow);
  hero.appendChild(h1);
  hero.appendChild(lede);

  const stats = el("div", "cr-stat-grid");
  const mkStat = (label: string, value: string, hint?: string) => {
    const card = el("div", "cr-stat-card");
    card.appendChild(el("p", "cr-stat-label", label));
    card.appendChild(el("p", "cr-stat-value", value));
    if (hint) card.appendChild(el("p", "cr-stat-hint", hint));
    return card;
  };
  stats.appendChild(
    mkStat("Published in bundle", String(opts.manifests.size), "Shipped with this deploy")
  );
  stats.appendChild(
    mkStat(
      "Local drafts",
      String(opts.draftSlugs.size),
      "Saved in this browser only"
    )
  );
  stats.appendChild(
    mkStat("Total words (est.)", String(totalWords), "Title, summary, and tiles")
  );

  const quick = el("div", "cr-panel");
  quick.appendChild(el("h2", "cr-panel-title", "Quick actions"));
  const qaRow = el("div", "cr-quick-actions");
  const mkBtn = (label: string, v: ViewId) => {
    const b = el("button", "cr-btn cr-btn--primary", label) as HTMLButtonElement;
    b.type = "button";
    b.addEventListener("click", () => opts.navigate(v));
    return b;
  };
  qaRow.appendChild(mkBtn("Write new post", "compose"));
  qaRow.appendChild(mkBtn("All posts", "posts"));
  qaRow.appendChild(mkBtn("Content insights", "analytics"));
  quick.appendChild(qaRow);

  const recent = el("div", "cr-panel");
  recent.appendChild(el("h2", "cr-panel-title", "Recent posts"));
  const ul = el("ul", "cr-recent-list");
  for (const [slug, m] of list.slice(0, 5)) {
    const li = el("li", "cr-recent-item");
    const left = el("div", "cr-recent-main");
    const title = el("a", "cr-recent-title", m.title);
    title.href = journalPostUrl(opts.baseUrl, slug);
    title.target = "_blank";
    title.rel = "noopener noreferrer";
    const meta = el(
      "p",
      "cr-recent-meta",
      `${new Date(m.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })} · ${estimatedWordCount(m)} words · ${sectionCount(m)} sections`
    );
    left.appendChild(title);
    left.appendChild(meta);
    li.appendChild(left);

    const right = el("div", "cr-recent-actions");
    const editPost = el(
      "button",
      "cr-btn cr-btn--primary cr-btn--sm",
      "Edit"
    ) as HTMLButtonElement;
    editPost.type = "button";
    editPost.addEventListener("click", () =>
      opts.navigate("editor", { editorSlug: slug })
    );
    right.appendChild(editPost);
    if (opts.draftSlugs.has(slug)) {
      right.appendChild(el("span", "cr-badge cr-badge--draft", "Local draft"));
    }
    li.appendChild(right);

    ul.appendChild(li);
  }
  if (list.length === 0) {
    ul.appendChild(el("li", "cr-empty", "No manifests in content/publishes yet."));
  }
  recent.appendChild(ul);

  container.appendChild(hero);
  container.appendChild(stats);
  container.appendChild(quick);
  container.appendChild(recent);
}
