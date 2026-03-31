import type { Block } from "@schema/blocks";
import type { PublishManifest, Tile } from "@schema/manifest";
import { safeParseManifest } from "@schema/manifest";
import { GET_MANIFEST_FN, PUBLISH_MANIFEST_FN } from "../remote-api";
import { journalPostUrl } from "../../lib/site-paths";
import { getSessionPassword } from "../storage";
import { el, clearChildren } from "../ui";
import type { ViewId } from "../types";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "section"
  );
}

function uniqueTileId(draft: PublishManifest, label: string): string {
  const base = slugify(label) || "section";
  const ids = new Set(draft.tiles.map((t) => t.id));
  let cand = base;
  let n = 0;
  while (ids.has(cand)) {
    n += 1;
    cand = `${base}-${n}`;
  }
  return cand;
}

function defaultBlock(type: Block["type"]): Block {
  switch (type) {
    case "heading":
      return { type: "heading", level: 2, text: "New heading" };
    case "paragraph":
      return { type: "paragraph", text: "" };
    case "list":
      return { type: "list", ordered: false, items: ["First item"] };
    case "quote":
      return { type: "quote", text: "" };
    case "code":
      return { type: "code", code: "", language: "" };
    case "image":
      return {
        type: "image",
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
        alt: "Describe the image",
        creditName: "Photographer name",
        creditLink: "https://unsplash.com",
      };
    case "divider":
      return { type: "divider" };
    default: {
      const _ex: never = type;
      return _ex;
    }
  }
}

function wrapField(label: string, control: HTMLElement): HTMLElement {
  const d = el("div", "creator-field");
  d.appendChild(el("label", "", label));
  d.appendChild(control);
  return d;
}

function collectFromDom(root: HTMLElement, draft: PublishManifest): void {
  draft.title =
    root.querySelector<HTMLInputElement>("#ed-title")?.value.trim() ?? "";
  draft.summary =
    root.querySelector<HTMLTextAreaElement>("#ed-summary")?.value.trim() ?? "";
  const cat =
    root.querySelector<HTMLInputElement>("#ed-category")?.value.trim() ?? "";
  if (cat) draft.category = cat;
  else delete draft.category;
  const rtRaw = root.querySelector<HTMLInputElement>("#ed-readtime")?.value ?? "";
  const rt = parseInt(rtRaw, 10);
  if (Number.isFinite(rt) && rt > 0) draft.readTimeMinutes = rt;
  else delete draft.readTimeMinutes;

  root.querySelectorAll<HTMLElement>("[data-ed-tile]").forEach((tel, ti) => {
    const tile = draft.tiles[ti];
    if (!tile) return;
    const labIn = tel.querySelector<HTMLInputElement>("[data-ed-tile-label]");
    if (labIn) tile.label = labIn.value.trim() || tile.label;

    tel.querySelectorAll<HTMLElement>("[data-ed-block]").forEach((bel, bi) => {
      const block = tile.blocks[bi];
      if (!block) return;
      if (block.type === "heading") {
        const lv = parseInt(
          bel.querySelector<HTMLSelectElement>("[data-f=level]")?.value ?? "2",
          10
        );
        block.level =
          lv === 1 || lv === 2 || lv === 3 ? lv : 2;
        block.text =
          bel.querySelector<HTMLInputElement>("[data-f=text]")?.value.trim() ||
          "Heading";
      }
      if (block.type === "paragraph") {
        block.text =
          bel.querySelector<HTMLTextAreaElement>("[data-f=text]")?.value ?? "";
      }
      if (block.type === "quote") {
        block.text =
          bel.querySelector<HTMLTextAreaElement>("[data-f=text]")?.value ?? "";
        const at =
          bel.querySelector<HTMLInputElement>("[data-f=attr]")?.value.trim();
        if (at) block.attribution = at;
        else delete block.attribution;
      }
      if (block.type === "code") {
        block.code =
          bel.querySelector<HTMLTextAreaElement>("[data-f=code]")?.value ?? "";
        const lang =
          bel.querySelector<HTMLInputElement>("[data-f=lang]")?.value.trim();
        if (lang) block.language = lang;
        else delete block.language;
      }
      if (block.type === "list") {
        block.ordered =
          bel.querySelector<HTMLInputElement>("[data-f=ordered]")?.checked ??
          false;
        const raw =
          bel.querySelector<HTMLTextAreaElement>("[data-f=items]")?.value ?? "";
        const items = raw
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        block.items = items.length > 0 ? items : ["Item"];
      }
      if (block.type === "image") {
        block.src =
          bel.querySelector<HTMLInputElement>("[data-f=src]")?.value.trim() ||
          block.src;
        block.alt =
          bel.querySelector<HTMLInputElement>("[data-f=alt]")?.value.trim() || "";
        block.creditName =
          bel.querySelector<HTMLInputElement>("[data-f=creditName]")?.value.trim() ||
          "";
        block.creditLink =
          bel.querySelector<HTMLInputElement>("[data-f=creditLink]")?.value.trim() ||
          block.creditLink;
      }
    });
  });
}

function renderBlockEditor(
  _tile: Tile,
  ti: number,
  block: Block,
  bi: number,
  manifest: PublishManifest,
  redraw: () => void
): HTMLElement {
  const box = el("div", "ed-block");
  box.dataset.edBlock = String(bi);
  box.dataset.blockType = block.type;

  const head = el("div", "ed-block-head");
  head.appendChild(el("span", "cr-badge cr-badge--draft", block.type));
  const rem = el(
    "button",
    "cr-btn cr-btn--ghost cr-btn--sm",
    "Remove"
  ) as HTMLButtonElement;
  rem.type = "button";
  rem.addEventListener("click", () => {
    const t = manifest.tiles[ti];
    if (!t) return;
    t.blocks.splice(bi, 1);
    if (t.blocks.length === 0) {
      t.blocks.push({ type: "paragraph", text: "" });
    }
    redraw();
  });
  head.appendChild(rem);
  box.appendChild(head);

  if (block.type === "heading") {
    const level = el("select") as HTMLSelectElement;
    level.dataset.f = "level";
    for (const L of [1, 2, 3]) {
      const o = el("option", "", `Heading ${L}`) as HTMLOptionElement;
      o.value = String(L);
      level.appendChild(o);
    }
    level.value = String(block.level);
    box.appendChild(wrapField("Level", level));
    const text = el("input") as HTMLInputElement;
    text.type = "text";
    text.dataset.f = "text";
    text.value = block.text;
    box.appendChild(wrapField("Text", text));
  } else if (block.type === "paragraph") {
    const text = el("textarea") as HTMLTextAreaElement;
    text.dataset.f = "text";
    text.value = block.text;
    text.rows = 5;
    box.appendChild(wrapField("Paragraph", text));
  } else if (block.type === "quote") {
    const text = el("textarea") as HTMLTextAreaElement;
    text.dataset.f = "text";
    text.value = block.text;
    text.rows = 3;
    box.appendChild(wrapField("Quote", text));
    const attr = el("input") as HTMLInputElement;
    attr.type = "text";
    attr.dataset.f = "attr";
    attr.placeholder = "Optional attribution";
    attr.value = block.attribution ?? "";
    box.appendChild(wrapField("Attribution", attr));
  } else if (block.type === "code") {
    const lang = el("input") as HTMLInputElement;
    lang.dataset.f = "lang";
    lang.placeholder = "e.g. javascript";
    lang.value = block.language ?? "";
    box.appendChild(wrapField("Language", lang));
    const code = el("textarea") as HTMLTextAreaElement;
    code.dataset.f = "code";
    code.value = block.code;
    code.rows = 6;
    box.appendChild(wrapField("Code", code));
  } else if (block.type === "list") {
    const ord = el("input") as HTMLInputElement;
    ord.type = "checkbox";
    ord.dataset.f = "ordered";
    ord.checked = block.ordered;
    const ol = el("label", "cr-check-label");
    ol.appendChild(ord);
    ol.appendChild(document.createTextNode("Numbered list"));
    box.appendChild(ol);
    const items = el("textarea") as HTMLTextAreaElement;
    items.dataset.f = "items";
    items.value = block.items.join("\n");
    items.rows = 4;
    items.placeholder = "One line per item";
    box.appendChild(wrapField("List items", items));
  } else if (block.type === "image") {
    const src = el("input") as HTMLInputElement;
    src.type = "url";
    src.dataset.f = "src";
    src.value = block.src;
    box.appendChild(wrapField("Image URL (https)", src));
    const alt = el("input") as HTMLInputElement;
    alt.type = "text";
    alt.dataset.f = "alt";
    alt.value = block.alt;
    box.appendChild(wrapField("Short description (accessibility)", alt));
    const cn = el("input") as HTMLInputElement;
    cn.type = "text";
    cn.dataset.f = "creditName";
    cn.value = block.creditName;
    box.appendChild(wrapField("Photographer / credit name", cn));
    const cl = el("input") as HTMLInputElement;
    cl.type = "url";
    cl.dataset.f = "creditLink";
    cl.value = block.creditLink;
    box.appendChild(wrapField("Credit link (e.g. Unsplash photo page)", cl));
  }

  return box;
}

export function renderEditor(
  container: HTMLElement,
  opts: {
    slug: string;
    manifests: Map<string, PublishManifest>;
    navigate: (v: ViewId, o?: { editorSlug?: string }) => void;
    baseUrl: string;
  }
): void {
  clearChildren(container);
  const pw = getSessionPassword() || "";

  const wrap = el("div", "cr-editor");
  const hero = el("div", "cr-dash-hero");
  hero.appendChild(el("p", "cr-eyebrow", "Edit story"));
  const titleRow = el("div", "cr-editor-title-row");
  const back = el(
    "button",
    "cr-btn cr-btn--ghost",
    "← All posts"
  ) as HTMLButtonElement;
  back.type = "button";
  back.addEventListener("click", () => opts.navigate("posts"));
  titleRow.appendChild(back);
  titleRow.appendChild(
    el("h1", "cr-dash-title cr-editor-h1", `“${opts.slug}”`)
  );
  hero.appendChild(titleRow);
  hero.appendChild(
    el(
      "p",
      "cr-dash-lede",
      "Edit sections, text, and images here — no code. Save & publish writes to your database (instant on the site) or to GitHub when the database is not configured."
    )
  );
  wrap.appendChild(hero);

  const status = el("p", "cr-muted");
  status.textContent = "Loading…";
  wrap.appendChild(status);

  const err = el("p", "creator-error");
  err.hidden = true;
  wrap.appendChild(err);

  const ok = el("p", "cr-validate-ok");
  ok.hidden = true;
  wrap.appendChild(ok);

  const bodyMount = el("div", "cr-editor-body");
  wrap.appendChild(bodyMount);

  const toolbar = el("div", "cr-editor-sticky-toolbar");
  const previewBtn = el(
    "a",
    "cr-btn cr-btn--ghost",
    "Preview on journal"
  ) as HTMLAnchorElement;
  previewBtn.href = journalPostUrl(opts.baseUrl, opts.slug);
  previewBtn.target = "_blank";
  previewBtn.rel = "noopener noreferrer";

  const saveBtn = el(
    "button",
    "cr-btn cr-btn--primary",
    "Save & publish changes"
  ) as HTMLButtonElement;
  saveBtn.type = "button";
  toolbar.appendChild(previewBtn);
  toolbar.appendChild(saveBtn);
  wrap.appendChild(toolbar);

  container.appendChild(wrap);

  let draft: PublishManifest | null = null;

  function redraw(): void {
    const d = draft;
    if (!d) return;
    clearChildren(bodyMount);

    const meta = el("div", "cr-panel");
    meta.appendChild(el("h2", "cr-panel-title", "Story details"));
    const titleF = el("div", "creator-field");
    titleF.appendChild(el("label", "", "Title"));
    const titleIn = el("input") as HTMLInputElement;
    titleIn.type = "text";
    titleIn.id = "ed-title";
    titleIn.value = d.title;
    titleF.appendChild(titleIn);
    meta.appendChild(titleF);

    const sumF = el("div", "creator-field");
    sumF.appendChild(el("label", "", "Summary (journal card)"));
    const sumTa = el("textarea") as HTMLTextAreaElement;
    sumTa.id = "ed-summary";
    sumTa.value = d.summary;
    sumTa.rows = 3;
    sumF.appendChild(sumTa);
    meta.appendChild(sumF);

    const catIn = el("input") as HTMLInputElement;
    catIn.type = "text";
    catIn.id = "ed-category";
    catIn.value = d.category ?? "";
    meta.appendChild(wrapField("Category (optional)", catIn));

    const rtIn = el("input") as HTMLInputElement;
    rtIn.type = "number";
    rtIn.id = "ed-readtime";
    rtIn.min = "1";
    rtIn.value =
      d.readTimeMinutes != null ? String(d.readTimeMinutes) : "";
    meta.appendChild(wrapField("Read time (minutes, optional)", rtIn));

    const slugNote = el("p", "cr-muted");
    slugNote.textContent = `URL slug (unchanged): ${d.slug}`;
    meta.appendChild(slugNote);
    bodyMount.appendChild(meta);

    const tip = el("div", "cr-callout cr-callout--compact");
    tip.innerHTML =
      "<strong>Tip:</strong> Widgets (reveal, tabs, drag-to-order, etc.) stay on each section. To change those, use <strong>All posts → Edit raw JSON</strong>.";
    bodyMount.appendChild(tip);

    d.tiles.forEach((tile, ti) => {
      const card = el("section", "cr-panel ed-tile");
      card.dataset.edTile = String(ti);
      card.appendChild(
        el("h2", "cr-panel-title", `Section ${ti + 1} — ${tile.label}`)
      );
      const labRow = el("div", "creator-field");
      labRow.appendChild(el("label", "", "Section heading readers see"));
      const labIn = el("input") as HTMLInputElement;
      labIn.type = "text";
      labIn.dataset.edTileLabel = "";
      labIn.value = tile.label;
      labRow.appendChild(labIn);
      card.appendChild(labRow);

      const idNote = el("p", "cr-muted ed-tile-id");
      idNote.textContent = `Section id: ${tile.id}`;
      card.appendChild(idNote);

      tile.blocks.forEach((block, bi) => {
        card.appendChild(
          renderBlockEditor(tile, ti, block, bi, d, redraw)
        );
      });

      const addRow = el("div", "cr-editor-add-block");
      addRow.appendChild(el("span", "cr-muted", "Add block:"));
      for (const bt of [
        "paragraph",
        "heading",
        "image",
        "list",
        "quote",
        "code",
      ] as const) {
        const lab =
          bt === "paragraph"
            ? "Paragraph"
            : bt === "heading"
              ? "Heading"
              : bt === "image"
                ? "Image"
                : bt === "list"
                  ? "List"
                  : bt === "quote"
                    ? "Quote"
                    : "Code";
        const b = el(
          "button",
          "cr-btn cr-btn--ghost cr-btn--sm",
          lab
        ) as HTMLButtonElement;
        b.type = "button";
        b.addEventListener("click", () => {
          d.tiles[ti]?.blocks.push(defaultBlock(bt));
          redraw();
        });
        addRow.appendChild(b);
      }
      card.appendChild(addRow);

      if (d.tiles.length > 1) {
        const remTile = el(
          "button",
          "cr-btn cr-btn--ghost cr-btn--sm",
          "Delete entire section"
        ) as HTMLButtonElement;
        remTile.type = "button";
        remTile.addEventListener("click", () => {
          if (!confirm("Remove this whole section from the story?")) return;
          const rid = d.tiles[ti]?.id;
          if (rid) {
            d.tiles.splice(ti, 1);
            if (d.navigation?.length) {
              d.navigation = d.navigation.filter((x) => x !== rid);
            }
          }
          redraw();
        });
        card.appendChild(remTile);
      }

      bodyMount.appendChild(card);
    });

    const addSec = el(
      "button",
      "cr-btn cr-btn--secondary",
      "+ Add new section"
    ) as HTMLButtonElement;
    addSec.type = "button";
    addSec.addEventListener("click", () => {
      const cur = draft;
      if (!cur) return;
      const label = "New section";
      const id = uniqueTileId(cur, label);
      cur.tiles.push({
        id,
        label,
        blocks: [{ type: "paragraph", text: "" }],
      });
      if (cur.navigation?.length) {
        cur.navigation.push(id);
      } else if (cur.navigation !== undefined) {
        cur.navigation = cur.tiles.map((t) => t.id);
      }
      redraw();
    });
    bodyMount.appendChild(addSec);
  }

  function deepClone<T>(x: T): T {
    return JSON.parse(JSON.stringify(x)) as T;
  }

  saveBtn.addEventListener("click", async () => {
    err.hidden = true;
    ok.hidden = true;
    const cur = draft;
    if (!cur) return;
    collectFromDom(wrap, cur);
    const parsed = safeParseManifest(cur);
    if (!parsed.success) {
      err.textContent = parsed.error.errors.map((e) => e.message).join("; ");
      err.hidden = false;
      return;
    }
    const usePw = pw || getSessionPassword() || "";
    if (!usePw) {
      err.textContent = "Sign in again (session expired).";
      err.hidden = false;
      return;
    }
    saveBtn.disabled = true;
    try {
      const res = await fetch(PUBLISH_MANIFEST_FN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: usePw,
          manifest: parsed.data,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        commitUrl?: string;
        source?: string;
      };
      if (!res.ok) {
        err.textContent = data.error || `Publish failed (${res.status})`;
        err.hidden = false;
        return;
      }
      ok.replaceChildren();
      const savedMsg =
        data.source === "database"
          ? "Saved to the database. Refresh the public post to see changes immediately. "
          : "Saved. Your public journal will update after Netlify finishes deploying. ";
      ok.appendChild(document.createTextNode(savedMsg));
      if (data.commitUrl) {
        const a = el(
          "a",
          "cr-validate-ok-link",
          "view commit"
        ) as HTMLAnchorElement;
        a.href = data.commitUrl;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        ok.appendChild(a);
      }
      ok.hidden = false;
      draft = deepClone(parsed.data as PublishManifest);
    } catch (e) {
      err.textContent =
        e instanceof Error ? e.message : "Could not reach publish service.";
      err.hidden = false;
    } finally {
      saveBtn.disabled = false;
    }
  });

  (async () => {
    let loaded: PublishManifest | null = null;
    if (pw) {
      try {
        const res = await fetch(GET_MANIFEST_FN, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pw, slug: opts.slug }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          manifest?: PublishManifest;
          error?: string;
        };
        if (res.ok && data.manifest) {
          const p = safeParseManifest(data.manifest);
          if (p.success) loaded = p.data;
        }
      } catch {
        /* use local */
      }
    }
    if (!loaded) {
      const local = opts.manifests.get(opts.slug);
      if (local) loaded = deepClone(local);
    }
    if (!loaded) {
      status.textContent = "";
      err.textContent =
        "Could not load this post. Check GitHub env vars or wait until after a deploy.";
      err.hidden = false;
      return;
    }
    draft = loaded;
    status.textContent = "";
    redraw();
    document.title = `Edit — ${loaded.title} — Stillwater`;
  })();
}
