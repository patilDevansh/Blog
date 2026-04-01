import { el, clearChildren } from "../ui";

/** Lineage figures for portrait cards — reference UI from studio mockup. */
const MASTERS: {
  name: string;
  years: string;
  tradition: string;
  blurb: string;
  img: string;
  tags: string[];
  posts: string;
}[] = [
  {
    name: "Lahiri Mahāśaya",
    years: "1828–1895",
    tradition: "Kriya Yoga",
    blurb:
      "Householder yogi who received Kriya initiation from Mahavatar Babaji. Deliberately refused the public guru role. Restored the ancient Kriya tradition to lay practitioners.",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Lahiri_Mahasaya.jpg/640px-Lahiri_Mahasaya.jpg",
    tags: ["Kriya Yoga"],
    posts: "2 posts",
  },
  {
    name: "Śrī Yukteswar Giri",
    years: "1855–1936",
    tradition: "Kriya Yoga",
    blurb:
      "Disciple of Lahiri Mahasaya and guru of Paramahansa Yogananda. Author of The Holy Science. Sought a reconciliation of Eastern and Western scripture through cosmic law.",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Sri_Yukteswar_Giri.jpg/640px-Sri_Yukteswar_Giri.jpg",
    tags: ["Kriya Yoga"],
    posts: "1 post",
  },
  {
    name: "Gorakṣanātha",
    years: "c. 11th–12th c.",
    tradition: "Nath Sampradāya",
    blurb:
      "Founder of the Nath order and systematizer of hatha yoga. Disciple of Matsyendranātha. His Goraksha Paddhati and Siddha Siddhanta Paddhati define the Nath philosophy of the body as path.",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Gorakshanath.jpg/640px-Gorakshanath.jpg",
    tags: ["Nath Sampradāya", "Tantra"],
    posts: "3 posts",
  },
];

export function renderLineageMasters(container: HTMLElement): void {
  clearChildren(container);

  const head = el("div", "cr-page-header");
  const title = el("h1", "cr-dash-title cr-page-header__title", "Lineage Masters");
  const actions = el("div", "cr-page-actions");
  const add = el("button", "cr-btn cr-btn--primary cr-btn--sm", "+ Add master") as HTMLButtonElement;
  add.type = "button";
  add.disabled = true;
  add.title = "Connect a CMS or database to store master records.";
  actions.appendChild(add);
  head.appendChild(title);
  head.appendChild(actions);

  const lede = el("p", "cr-dash-lede cr-page-lede",
    "Figures you cite across posts. Sage portraits in the editor can pull from this set once wired to your data layer.");

  const grid = el("div", "cr-masters-grid");
  for (const m of MASTERS) {
    const card = el("div", "cr-panel cr-master-card");
    const inner = el("div", "cr-master-card__inner");
    const img = el("img", "cr-master-card__img") as HTMLImageElement;
    img.src = m.img;
    img.alt = "";
    img.loading = "lazy";
    const body = el("div", "cr-master-card__body");
    body.appendChild(el("div", "cr-master-card__name", m.name));
    body.appendChild(
      el("div", "cr-master-card__meta", `${m.tradition} · ${m.years}`)
    );
    body.appendChild(el("p", "cr-master-card__blurb", m.blurb));
    const foot = el("div", "cr-master-card__foot");
    for (const t of m.tags) {
      foot.appendChild(el("span", "cr-tag cr-tag--gold", t));
    }
    foot.appendChild(el("span", "cr-muted cr-master-card__posts", m.posts));
    body.appendChild(foot);
    inner.appendChild(img);
    inner.appendChild(body);
    card.appendChild(inner);
    grid.appendChild(card);
  }

  container.appendChild(head);
  container.appendChild(lede);
  container.appendChild(grid);
}
