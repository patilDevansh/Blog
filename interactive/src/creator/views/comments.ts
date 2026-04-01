import { el, clearChildren } from "../ui";

const PENDING: { from: string; post: string; when: string; body: string }[] = [
  {
    from: "Rohan M.",
    post: "Three Bodies and the Witness",
    when: "3 hours ago",
    body:
      "This is the clearest explanation of the kāraṇa śarīra I've encountered. The distinction you draw between Vedantic hierarchy and the Trika's radical immanence finally resolves a confusion I've had for years.",
  },
  {
    from: "Priya K.",
    post: "Mahasiddhas",
    when: "1 day ago",
    body:
      "Would love to see you engage with David Gordon White's scholarship on the Siddhas — particularly his Alchemical Body. His historical reading of the 84 Siddhas differs from traditional hagiography.",
  },
];

export function renderComments(container: HTMLElement): void {
  clearChildren(container);

  const head = el("div", "cr-page-header");
  head.appendChild(el("h1", "cr-dash-title cr-page-header__title", "Comments"));
  container.appendChild(head);
  container.appendChild(
    el(
      "p",
      "cr-dash-lede cr-page-lede",
      "Public comments awaiting moderation. Approve, reply, or pin highlights to the top of a post."
    )
  );

  const filters = el("div", "cr-filter-bar");
  const pills = ["Awaiting review (3)", "Approved (44)", "Pinned (5)", "All (47)"];
  pills.forEach((label, i) => {
    const b = el("button", "cr-filter-pill" + (i === 0 ? " is-active" : ""), label) as HTMLButtonElement;
    b.type = "button";
    b.addEventListener("click", () => {
      filters.querySelectorAll(".cr-filter-pill").forEach((p) => p.classList.remove("is-active"));
      b.classList.add("is-active");
    });
    filters.appendChild(b);
  });
  container.appendChild(filters);

  for (const c of PENDING) {
    const card = el("div", "cr-panel cr-comment-card");
    const top = el("div", "cr-comment-card__head");
    const left = el("div");
    left.appendChild(el("div", "cr-comment-card__from", c.from));
    left.appendChild(
      el("div", "cr-comment-card__meta", `On "${c.post}" · ${c.when}`)
    );
    top.appendChild(left);
    top.appendChild(el("span", "cr-pill cr-pill--draft", "Awaiting review"));
    card.appendChild(top);
    card.appendChild(el("p", "cr-comment-card__body", c.body));
    const act = el("div", "cr-comment-card__actions");
    ["Approve", "Reply", "Pin to top", "Dismiss"].forEach((label, j) => {
      const a = el("button", "cr-link-btn" + (j === 0 || j === 2 ? " cr-link-btn--accent" : ""), label) as HTMLButtonElement;
      a.type = "button";
      act.appendChild(a);
    });
    card.appendChild(act);
    container.appendChild(card);
  }
}
