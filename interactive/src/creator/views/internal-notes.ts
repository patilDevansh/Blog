import { el, clearChildren } from "../ui";

const NOTES: { title: string; body: string; linked: string }[] = [
  {
    title: "Kashmir Shaivism — framework overview",
    body:
      "Key: the three schools — Trika, Krama, Spanda. Abhinavagupta's synthesis in Tantrāloka. Pratyabhijñā as epistemological foundation. The 36 tattvas. The problem of the 5 kañcukas (sheaths of limitation). Central question: how does infinite consciousness appear to be finite? The Trika answer: through its own free will (svātantrya-śakti).",
    linked: "Linked: Spanda draft · Vimarśa post · 3 glossary terms",
  },
  {
    title: "Nath tradition — research notes",
    body:
      "Distinguish: Matsyendranatha (Kaula, left-hand tantra) vs Gorakshanatha (conservative synthesis, hatha yoga). The Navanathas as later elaboration. Siddha Siddhanta Paddhati as primary philosophical text.",
    linked: "Linked: Goraksha Nath post · Navnath idea card",
  },
  {
    title: "Patanjali — textual notes on nirodha",
    body:
      "YS 1.2 — yogaś-citta-vṛtti-nirodhaḥ. Nirodha as \"suppression\" is a Cartesian misreading. In context, nirodha is closer to natural subsidence or return to undisturbed knowing.",
    linked: "Linked: Nirodha draft · Glossary: nirodha",
  },
  {
    title: "Vajrayana — Mahamudra and Dzogchen distinction",
    body:
      "Mahamudra is primarily Kagyu; Dzogchen (Atiyoga) is Nyingma/Bon. Both point to non-dual recognition but from different frameworks.",
    linked: "Linked: Mahamudra idea card · Glossary: Dzogchen",
  },
];

export function renderInternalNotes(container: HTMLElement): void {
  clearChildren(container);

  const head = el("div", "cr-page-header");
  head.appendChild(el("h1", "cr-dash-title cr-page-header__title", "Internal Notes"));
  const actions = el("div", "cr-page-actions");
  const add = el("button", "cr-btn cr-btn--primary cr-btn--sm", "+ New note") as HTMLButtonElement;
  add.type = "button";
  add.addEventListener("click", () => {
    globalThis.alert("Local notes storage can be added in a follow-up; this is the studio layout.");
  });
  actions.appendChild(add);
  head.appendChild(actions);

  container.appendChild(head);
  container.appendChild(
    el(
      "p",
      "cr-dash-lede cr-page-lede",
      "Private research notes that link to drafts, glossary entries, and writing-board cards. Not shown on the public site."
    )
  );

  const grid = el("div", "cr-notes-grid");
  for (const n of NOTES) {
    const card = el("article", "cr-panel cr-note-card");
    card.appendChild(el("h2", "cr-note-card__title", n.title));
    card.appendChild(el("p", "cr-note-card__body", n.body));
    card.appendChild(el("p", "cr-note-card__linked", n.linked));
    grid.appendChild(card);
  }
  container.appendChild(grid);
}
