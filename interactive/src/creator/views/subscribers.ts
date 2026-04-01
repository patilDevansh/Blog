import { el, clearChildren } from "../ui";

export type Subscriber = {
  id: string;
  name: string;
  email: string;
  traditions: string[];
  joinedAt: string;
  active: boolean;
};

const STORAGE_KEY = "stillwater-subscribers";

const TRADITIONS = [
  "Advaita", "Kashmir Shaivism", "Tantra", "Vajrayana",
  "Patanjali", "Taoism", "Navnath", "Kriya Yoga",
  "84 Mahasiddhas", "Osho",
];

function loadSubs(): Subscriber[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Subscriber[];
  } catch { /* ignore */ }
  const samples: Subscriber[] = [
    { id: "s1", name: "Arjun Mehta", email: "arjun@example.com", traditions: ["Patanjali", "Advaita"], joinedAt: new Date(Date.now() - 30 * 86400000).toISOString(), active: true },
    { id: "s2", name: "Sofia Reyes", email: "sofia@example.com", traditions: ["Kashmir Shaivism", "Tantra"], joinedAt: new Date(Date.now() - 45 * 86400000).toISOString(), active: true },
    { id: "s3", name: "David Chen", email: "david@example.com", traditions: ["Kriya Yoga", "84 Mahasiddhas"], joinedAt: new Date(Date.now() - 12 * 86400000).toISOString(), active: true },
    { id: "s4", name: "Priya Nair", email: "priya@example.com", traditions: ["Advaita", "Taoism"], joinedAt: new Date(Date.now() - 60 * 86400000).toISOString(), active: true },
    { id: "s5", name: "Marcus Webb", email: "marcus@example.com", traditions: ["Vajrayana", "84 Mahasiddhas"], joinedAt: new Date(Date.now() - 8 * 86400000).toISOString(), active: true },
    { id: "s6", name: "Leila Hosseini", email: "leila@example.com", traditions: ["Kashmir Shaivism"], joinedAt: new Date(Date.now() - 90 * 86400000).toISOString(), active: false },
    { id: "s7", name: "Tom Hirsch", email: "tom@example.com", traditions: ["Tantra", "Navnath"], joinedAt: new Date(Date.now() - 22 * 86400000).toISOString(), active: true },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
  return samples;
}


export function renderSubscribers(container: HTMLElement): void {
  clearChildren(container);

  const subs = loadSubs();
  let filterTrad = "All";

  const hero = el("div", "cr-dash-hero");
  hero.appendChild(el("p", "cr-eyebrow", "Email list"));
  hero.appendChild(el("h1", "cr-dash-title", "Subscribers & Dispatch"));
  hero.appendChild(el("p", "cr-dash-lede",
    "Your readers, segmented by tradition interest. Send a new piece only to those who've flagged that tradition — not everyone, every time."));

  const statRow = el("div", "cr-stat-grid");
  const active = subs.filter(s => s.active);
  const mkStat = (label: string, val: string, hint?: string) => {
    const c = el("div", "cr-stat-card");
    c.appendChild(el("p", "cr-stat-label", label));
    c.appendChild(el("p", "cr-stat-value", val));
    if (hint) c.appendChild(el("p", "cr-stat-hint", hint));
    return c;
  };
  statRow.appendChild(mkStat("Total subscribers", String(subs.length)));
  statRow.appendChild(mkStat("Active", String(active.length)));
  statRow.appendChild(mkStat("Avg traditions", (subs.reduce((a, s) => a + s.traditions.length, 0) / subs.length).toFixed(1)));

  const tabRow = el("div", "cr-letters-filterrow");
  const listTab = el("button", "cr-btn cr-btn--primary cr-btn--sm", "Subscribers") as HTMLButtonElement;
  listTab.type = "button";
  const dispatchTab = el("button", "cr-btn cr-btn--ghost cr-btn--sm", "Write dispatch") as HTMLButtonElement;
  dispatchTab.type = "button";
  tabRow.appendChild(listTab);
  tabRow.appendChild(dispatchTab);

  const main = el("div", "cr-subs-main");

  function renderList(): void {
    clearChildren(main);

    const filterRow = el("div", "cr-subs-filterrow");
    filterRow.appendChild(el("span", "cr-muted", "Filter by tradition:"));
    const selWrap = el("div", "cr-subs-filter-pills");
    const all = el("button", `cr-sub-pill${filterTrad === "All" ? " cr-sub-pill--active" : ""}`, "All") as HTMLButtonElement;
    all.type = "button";
    all.addEventListener("click", () => { filterTrad = "All"; renderList(); });
    selWrap.appendChild(all);
    TRADITIONS.forEach(t => {
      const count = subs.filter(s => s.traditions.includes(t)).length;
      if (count === 0) return;
      const pill = el("button", `cr-sub-pill${filterTrad === t ? " cr-sub-pill--active" : ""}`, `${t} (${count})`) as HTMLButtonElement;
      pill.type = "button";
      pill.addEventListener("click", () => { filterTrad = t; renderList(); });
      selWrap.appendChild(pill);
    });
    filterRow.appendChild(selWrap);
    main.appendChild(filterRow);

    const visible = filterTrad === "All" ? subs : subs.filter(s => s.traditions.includes(filterTrad));

    const table = el("div", "cr-table-wrap");
    const t = el("table", "cr-table");
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    ["Name", "Email", "Traditions", "Joined", "Status"].forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    t.appendChild(thead);

    const tbody = document.createElement("tbody");
    visible.forEach(s => {
      const tr = document.createElement("tr");
      const tdName = document.createElement("td");
      tdName.textContent = s.name;
      const tdEmail = document.createElement("td");
      tdEmail.textContent = s.email;
      const tdTrad = document.createElement("td");
      tdTrad.textContent = s.traditions.join(", ");
      const tdDate = document.createElement("td");
      tdDate.textContent = new Date(s.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const tdStatus = document.createElement("td");
      const badge = el("span", `cr-badge ${s.active ? "cr-badge--live" : "cr-badge--warn"}`, s.active ? "Active" : "Unsubscribed");
      tdStatus.appendChild(badge);
      tr.append(tdName, tdEmail, tdTrad, tdDate, tdStatus);
      tbody.appendChild(tr);
    });
    t.appendChild(tbody);
    table.appendChild(t);
    main.appendChild(table);
  }

  function renderDispatch(): void {
    clearChildren(main);

    const form = el("div", "cr-dispatch-form");
    form.appendChild(el("h2", "cr-panel-title", "Compose dispatch"));

    const tradLabel = el("div", "creator-field");
    tradLabel.appendChild(el("label", "", "Send to tradition (or All subscribers)"));
    const tradSel = el("select") as HTMLSelectElement;
    tradSel.className = "cr-dispatch-select";
    const allOpt = el("option", "", "All subscribers") as HTMLOptionElement;
    allOpt.value = "All";
    tradSel.appendChild(allOpt);
    TRADITIONS.forEach(t => {
      const o = el("option", "", `${t} (${subs.filter(s => s.traditions.includes(t)).length} readers)`) as HTMLOptionElement;
      o.value = t;
      tradSel.appendChild(o);
    });
    tradLabel.appendChild(tradSel);
    form.appendChild(tradLabel);

    const noteField = el("div", "creator-field");
    noteField.appendChild(el("label", "", "Personal note (before the post link)"));
    const noteIn = el("textarea") as HTMLTextAreaElement;
    noteIn.rows = 4;
    noteIn.placeholder = "A line or two in your own voice — what drew you to write this piece, or what you hope it opens up for the reader…";
    noteField.appendChild(noteIn);
    form.appendChild(noteField);

    const postField = el("div", "creator-field");
    postField.appendChild(el("label", "", "Post link"));
    const postIn = el("input") as HTMLInputElement;
    postIn.placeholder = "https://stillwater.netlify.app/?slug=your-post";
    postField.appendChild(postIn);
    form.appendChild(postField);

    const note = el("div", "cr-callout cr-callout--compact");
    note.innerHTML = "<strong>Note:</strong> Dispatch sends via your configured email provider. Connect Resend or Buttondown in Settings to enable sending. Preview is always available.";
    form.appendChild(note);

    const btnRow = el("div", "creator-actions");
    const previewBtn = el("button", "cr-btn cr-btn--secondary", "Preview dispatch") as HTMLButtonElement;
    previewBtn.type = "button";
    const sendBtn = el("button", "cr-btn cr-btn--primary", "Send dispatch") as HTMLButtonElement;
    sendBtn.type = "button";
    sendBtn.addEventListener("click", () => {
      alert("Connect an email provider in Settings to enable sending. Your dispatch is saved.");
    });
    btnRow.appendChild(previewBtn);
    btnRow.appendChild(sendBtn);
    form.appendChild(btnRow);

    main.appendChild(form);
  }

  listTab.addEventListener("click", () => {
    listTab.className = "cr-btn cr-btn--primary cr-btn--sm";
    dispatchTab.className = "cr-btn cr-btn--ghost cr-btn--sm";
    renderList();
  });
  dispatchTab.addEventListener("click", () => {
    dispatchTab.className = "cr-btn cr-btn--primary cr-btn--sm";
    listTab.className = "cr-btn cr-btn--ghost cr-btn--sm";
    renderDispatch();
  });

  renderList();

  container.appendChild(hero);
  container.appendChild(statRow);
  container.appendChild(tabRow);
  container.appendChild(main);
}
