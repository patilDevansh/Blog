import { el, clearChildren } from "../ui";
import type { ViewId } from "../types";

export type Letter = {
  id: string;
  from: string;
  email: string;
  subject: string;
  body: string;
  receivedAt: string;
  read: boolean;
  archived: boolean;
  linkedPost?: string;
  publicReply?: string;
};

const STORAGE_KEY = "stillwater-reader-letters";

function loadLetters(): Letter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Letter[];
  } catch { /* ignore */ }
  // Seed with sample letters so the view isn't empty on first open
  const samples: Letter[] = [
    {
      id: "l1",
      from: "Arjun Mehta",
      email: "arjun@example.com",
      subject: "On nirodha in Patanjali — a practitioner's question",
      body: "Your piece on the witness touched something I've been circling for years. In my practice, nirodha keeps appearing as a kind of dissolving rather than a stopping. Is that consistent with how Patanjali uses the term, or is my reading coloured by Advaita? Would love to know your take.",
      receivedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      read: false,
      archived: false,
    },
    {
      id: "l2",
      from: "Sofia Reyes",
      email: "sofia@example.com",
      subject: "Tantraloka and the question of transmission",
      body: "I keep returning to Abhinavagupta's insistence that recognition (pratyabhijna) cannot be transmitted, only pointed at. Your writing has that quality. Do you plan to write specifically on the 84 Mahasiddhas' relationship to direct transmission?",
      receivedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      read: true,
      archived: false,
      publicReply: "Yes — the Mahasiddhas piece is in the writing board. What you're pointing at, the distinction between teaching about transmission and the act of transmission itself, is exactly the tension I want to sit with in that piece.",
    },
    {
      id: "l3",
      from: "David Chen",
      email: "david@example.com",
      subject: "Thank you for the Lahiri Mahasaya essay",
      body: "I've read everything available on Kriya Yoga in English and your framing of Lahiri's householder path as the real radical act was something I hadn't encountered anywhere. It shifted something. Thank you.",
      receivedAt: new Date(Date.now() - 11 * 86400000).toISOString(),
      read: true,
      archived: false,
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
  return samples;
}

function saveLetters(letters: Letter[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function renderReaderLetters(
  container: HTMLElement,
  opts: { navigate: (v: ViewId, o?: { editorSlug?: string }) => void }
): void {
  clearChildren(container);

  let letters = loadLetters();
  let activeId: string | null = null;
  let filter: "inbox" | "archived" = "inbox";

  const hero = el("div", "cr-dash-hero");
  hero.appendChild(el("p", "cr-eyebrow", "Community"));
  hero.appendChild(el("h1", "cr-dash-title", "Reader Letters"));
  hero.appendChild(el("p", "cr-dash-lede",
    "Messages from practitioners and seekers. Reply publicly as a footnote on the relevant post, or let a letter inspire a new piece."));

  const filterRow = el("div", "cr-letters-filterrow");
  const inboxBtn = el("button", "cr-btn cr-btn--primary cr-btn--sm", "Inbox") as HTMLButtonElement;
  inboxBtn.type = "button";
  const archBtn = el("button", "cr-btn cr-btn--ghost cr-btn--sm", "Archived") as HTMLButtonElement;
  archBtn.type = "button";

  filterRow.appendChild(inboxBtn);
  filterRow.appendChild(archBtn);

  const layout = el("div", "cr-letters-layout");
  const listPane = el("div", "cr-letters-list");
  const detailPane = el("div", "cr-letters-detail");

  function redrawList(): void {
    clearChildren(listPane);
    const visible = letters.filter(l => filter === "inbox" ? !l.archived : l.archived);
    if (visible.length === 0) {
      listPane.appendChild(el("p", "cr-empty", filter === "inbox" ? "No letters in inbox." : "No archived letters."));
      return;
    }
    visible.forEach(letter => {
      const item = el("div", `cr-letters-item${!letter.read ? " cr-letters-item--unread" : ""}${activeId === letter.id ? " cr-letters-item--active" : ""}`);
      const from = el("span", "cr-letters-from", letter.from);
      const date = el("span", "cr-letters-date", formatDate(letter.receivedAt));
      const subj = el("p", "cr-letters-subj", letter.subject);
      const preview = el("p", "cr-letters-preview", letter.body.slice(0, 80) + "…");
      const top = el("div", "cr-letters-item-top");
      top.appendChild(from);
      top.appendChild(date);
      item.appendChild(top);
      item.appendChild(subj);
      item.appendChild(preview);
      if (letter.publicReply) {
        item.appendChild(el("span", "cr-letters-replied-badge", "Replied publicly"));
      }
      item.addEventListener("click", () => {
        activeId = letter.id;
        if (!letter.read) { letter.read = true; saveLetters(letters); }
        redrawList();
        redrawDetail();
      });
      listPane.appendChild(item);
    });
  }

  function redrawDetail(): void {
    clearChildren(detailPane);
    if (!activeId) {
      detailPane.appendChild(el("p", "cr-empty", "Select a letter to read it."));
      return;
    }
    const letter = letters.find(l => l.id === activeId);
    if (!letter) return;

    detailPane.appendChild(el("h2", "cr-letters-detail-from", letter.from));
    detailPane.appendChild(el("p", "cr-letters-detail-meta", `${letter.email} · ${formatDate(letter.receivedAt)}`));
    detailPane.appendChild(el("h3", "cr-letters-detail-subj", letter.subject));

    const body = el("p", "cr-letters-detail-body", letter.body);
    detailPane.appendChild(body);

    if (letter.publicReply) {
      const replyBox = el("div", "cr-letters-public-reply");
      replyBox.appendChild(el("p", "cr-letters-reply-label", "Your public reply (appears as footnote on linked post)"));
      replyBox.appendChild(el("p", "cr-letters-reply-text", letter.publicReply));
      detailPane.appendChild(replyBox);
    }

    const actions = el("div", "cr-letters-detail-actions");

    if (!letter.publicReply) {
      const replyBtn = el("button", "cr-btn cr-btn--primary", "Reply publicly as footnote") as HTMLButtonElement;
      replyBtn.type = "button";
      replyBtn.addEventListener("click", () => {
        const replyArea = el("div", "cr-letters-reply-form");
        const ta = el("textarea") as HTMLTextAreaElement;
        ta.rows = 4;
        ta.placeholder = "Your response — will appear as a footnote on the linked post…";
        ta.className = "cr-letters-reply-ta";
        const linkNote = el("p", "cr-muted", "Tip: open the post editor and paste this as a quote block to publish it as a living footnote.");
        const saveReplyBtn = el("button", "cr-btn cr-btn--primary cr-btn--sm", "Save reply") as HTMLButtonElement;
        saveReplyBtn.type = "button";
        saveReplyBtn.addEventListener("click", () => {
          if (!ta.value.trim()) return;
          letter.publicReply = ta.value.trim();
          saveLetters(letters);
          redrawDetail();
        });
        const cancelReplyBtn = el("button", "cr-btn cr-btn--ghost cr-btn--sm", "Cancel") as HTMLButtonElement;
        cancelReplyBtn.type = "button";
        cancelReplyBtn.addEventListener("click", () => replyArea.remove());
        const btnRow = el("div", "cr-board-newcard-btns");
        btnRow.appendChild(saveReplyBtn);
        btnRow.appendChild(cancelReplyBtn);
        replyArea.appendChild(ta);
        replyArea.appendChild(linkNote);
        replyArea.appendChild(btnRow);
        detailPane.appendChild(replyArea);
        ta.focus();
      });
      actions.appendChild(replyBtn);
    }

    const inspireBtn = el("button", "cr-btn cr-btn--secondary", "Inspire new post") as HTMLButtonElement;
    inspireBtn.type = "button";
    inspireBtn.title = "Add this letter as a writing board card";
    inspireBtn.addEventListener("click", () => {
      const boards = JSON.parse(localStorage.getItem("stillwater-writing-board") || "[]") as object[];
      boards.unshift({
        id: Math.random().toString(36).slice(2),
        title: `From "${letter.from}": ${letter.subject}`,
        tradition: "General",
        column: "seed",
        wordTarget: 1500,
        wordCount: 0,
        notes: letter.body.slice(0, 200),
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("stillwater-writing-board", JSON.stringify(boards));
      opts.navigate("writing-board");
    });
    actions.appendChild(inspireBtn);

    const archBtn2 = el("button", "cr-btn cr-btn--ghost", letter.archived ? "Unarchive" : "Archive") as HTMLButtonElement;
    archBtn2.type = "button";
    archBtn2.addEventListener("click", () => {
      letter.archived = !letter.archived;
      saveLetters(letters);
      activeId = null;
      redrawList();
      redrawDetail();
    });
    actions.appendChild(archBtn2);

    detailPane.appendChild(actions);
  }

  inboxBtn.addEventListener("click", () => {
    filter = "inbox";
    inboxBtn.className = "cr-btn cr-btn--primary cr-btn--sm";
    archBtn.className = "cr-btn cr-btn--ghost cr-btn--sm";
    activeId = null;
    redrawList();
    redrawDetail();
  });

  archBtn.addEventListener("click", () => {
    filter = "archived";
    archBtn.className = "cr-btn cr-btn--primary cr-btn--sm";
    inboxBtn.className = "cr-btn cr-btn--ghost cr-btn--sm";
    activeId = null;
    redrawList();
    redrawDetail();
  });

  redrawList();
  redrawDetail();

  layout.appendChild(listPane);
  layout.appendChild(detailPane);

  container.appendChild(hero);
  container.appendChild(filterRow);
  container.appendChild(layout);
}
