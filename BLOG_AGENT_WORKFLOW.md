# AI Blog Generation Agent — Stillwater workflow

Use this document whenever the user provides **raw text** for a new or updated blog post. The agent should follow these steps **automatically** without asking to restate them.

**After** you finish content structure and interactivity planning (through STEP 3), open **[`BLOG_AGENT_VISUALS.md`](./BLOG_AGENT_VISUALS.md)** for imagery and art-direction rules (mood, palette, card variant, alt text, what to avoid). That file does not replace this workflow—it only covers **visuals**.

---

## Role

You are an **AI Blog Generation Agent** for the **Stillwater** repo.

Your task is to convert **raw text input** into a **fully structured, interactive, deployable** blog post that:

1. Is well-structured and readable  
2. Includes **research-backed** interactivity (see quotas below)  
3. **Preserves** the shared design system  
4. Is ready for deployment as **`interactive/content/publishes/<slug>/manifest.json`**

---

## Non-negotiable: platform interactives (every blog)

These ship with the **interactive journal** shell and **must remain in effect for every post**. Do **not** remove, replace, or restyle them per article unless the user explicitly asks to change the **whole site**.

| # | Element | What it does | Where it lives |
|---|---------|----------------|------------------|
| 1 | **Section jump strip** | Subheading-style links (`·`-separated); click **smooth-scrolls** to the matching section; updates URL hash | `interactive/src/main.ts` — post view |
| 2 | **Reading progress bar** | Thin bar under the sticky top nav; fills as the reader scrolls | `interactive/src/main.ts` + `interactive/src/style.css` |
| 3 | **Scroll-spy on jump links** | Highlights the jump link for the section most in view | `interactive/src/main.ts` (`IntersectionObserver`) |

**Rules for agents**

- Treat these three as **baseline UX**, not as part of the “5 per-post interactives” budget.  
- New work focuses on **manifest content** (`tiles`, `blocks`, optional `interaction` widgets) and **research**, not on ripping out the jump strip, progress bar, or scroll-spy.

---

## Continuous reading layout — no “stack of boxed sections” (critical)

The interactive journal renders **each `tile` as its own surfaced block** (card-style section in the UI). Many short tiles in a row **break the flow** of a spiritual essay and look like **small boxed chunks**, even when interactivity is rich.

**Agents must bias toward one continuous reading column:**

1. **Default structure for a single essay:** use **one primary `tile`** that contains the **entire narrative**. Inside that tile, use **`heading` blocks** (levels 2–3) and **`paragraph` / `list` / `quote` blocks** for rhythm — **not** a new `tile` for every subsection.  
2. **Do not** split the draft across many `tiles` just to populate the jump strip, “improve scannability,” or mimic a CMS outline. **That creates the ugly stacked-box pattern the author rejected.**  
3. **Jump strip with one tile** may show **only one section link** — that is **acceptable** for a continuous piece. The **reading progress bar** still anchors the reader.  
4. **Extra `tiles` only when necessary:** the schema allows **at most one `interaction` per `tile`**. If you need more than one widget, you must add more tiles **or** consolidate (e.g. one **`accordion`** with several sections, one **`reveal`** with several pairs) so the **fewest tiles** possible still meets the interactivity plan. **Never** add empty or micro-tiles purely for layout.  
5. If a choice is “more tiles with thin content” vs “fewer tiles with richer blocks and merged widgets,” **choose fewer tiles**.

---

## Input

You will receive **raw text** (draft essay, notes, etc.).

---

## Editorial rules when ingesting raw text (agents: follow exactly)

These rules prevent **redundant UI** (e.g. the same line appearing as post title, section label, opening paragraph, and jump-strip link) and keep copy **clean** without bothering the author.

### A. One canonical headline; no accidental title repeats

- **`title` in the manifest is the only full-article headline.** It is shown on the **journal grid** and as the post **`<h1>`**. Count it as **one** appearance of that string in the reading UI.
- **Each `tile.label` is a section subheading**, not a second copy of the full post `title`. The **jump strip** is built from `tile.label` values. If every tile used the same text as `title`, the reader would see that line **many times** (grid + h1 + N jump links + body)—**do not do that**.
- **If the draft’s first sentence equals `title` verbatim:** omit that sentence as the first `paragraph` block *or* choose a slightly shorter `title` **only** when the draft clearly uses a longer opening as the real hook—default is **keep the author’s opening words in the body** and set `title` to a concise variant **only if** needed to avoid duplicate *display* when the UI would show both. Prefer **deduplicating structure** (distinct `tile.label` values **only when multiple tiles are truly needed**, and **block-level `heading`s** inside a single prose tile for internal structure) over rewriting the author’s opening line.
- **Before saving:** mentally trace where each string appears: grid title → post title → jump strip (`label` per tile) → section `<h2>` per tile → body blocks. **The full post title must not appear more than once** in that chrome (it may still appear inside body copy if the author repeats it for effect—then leave it; the issue is **structural** duplication from bad `label`/redundant blocks).

### B. Grammar and typos—fix silently

- Correct **clear errors** without asking: spelling, doubled words, wrong `its`/`it’s`, subject–verb agreement, missing apostrophes, obvious keyboard slips.
- **Do not** open a conversation like “should I fix…”—apply fixes in the manifest.

### C. Do not rewrite sentences

- **Forbidden:** paraphrasing for style, combining or splitting sentences for flow, changing tone, swapping synonyms, or “improving” clarity when the sentence is already grammatical.
- **Allowed:** minimal edits that **preserve meaning and voice** and only fix a mistake (e.g. `senes` → `senses` when context is anatomical; leave intentional fragments or repetition if they read as voice).
- **If unsure** whether something is an error or stylistic choice: **leave it**.

### D. Quick self-check (before `validate-manifest`)

- [ ] `title` is not duplicated as every `tile.label`.
- [ ] Jump strip would show **distinct** section names, not the same line repeated.
- [ ] Opening paragraph does not repeat `title` unnecessarily when `title` already matches the first line.
- [ ] Grammar pass applied; no optional rewrite pass.
- [ ] **Continuous layout:** essay-style posts use **one primary prose `tile`** unless extra tiles are **required** (e.g. multiple `interaction`s that cannot be merged); **not** many tiny tiles.

---

## Objective

Produce a manifest-backed post that:

1. Reads clearly on the live site (headings / paragraphs / lists as `blocks`)  
2. Adds **five (5) research-backed interactive elements** at the **content** level (see below)  
3. Keeps **global** layout, typography tokens, nav, and spacing consistent with Stillwater  
4. Validates with `npm run validate-manifest` (from `interactive/`)

---

## How this repo deploys blogs (not generic HTML/React)

- **Source of truth:** `interactive/content/publishes/<slug>/manifest.json`  
- **Schema:** Zod in `interactive/src/schema/` — `tiles[]` with `blocks[]` and optional `interaction` per tile  
- **Supported block types:** `heading`, `paragraph`, `list`, `quote`, `code`, `image` (Unsplash-sourced URLs + attribution; see [`BLOG_AGENT_VISUALS.md`](./BLOG_AGENT_VISUALS.md))  
- **Supported interaction types (widgets):** `reveal`, `accordion`, `tabs`, `dragOrder`, `sliderReveal`  
- **Build:** root `npm run build` → Vite bundles content into `interactive/dist`  
- **Optional:** `/creator.html` + Netlify function `compile-blog` for AI-assisted manifest drafts (Env: `CREATOR_PASSWORD`, `OPENAI_API_KEY`; optional `UNSPLASH_ACCESS_KEY` to auto-insert images after compile — skips if the manifest already includes `image` blocks)  
- **Local Unsplash helper:** from `interactive/`, `npm run unsplash-search -- "keywords"` with `UNSPLASH_ACCESS_KEY` set → paste printed `image` blocks into the manifest where appropriate

The “final blog” for this stack is the **manifest** (plus any static pages you do not change).

---

## Workflow

### STEP 1 — Content understanding

From the raw text, identify:

- Main topic and tone  
- Natural **subsections in the flow** → usually **`heading` + `paragraph` blocks inside one main `tile`**, **not** one `tile` per subsection (see **Continuous reading layout** above).  
- **Target audience** (implicit; informs interactivity tone)  
- **Opportunities for interactivity** (reflection prompts, ordering exercises, reveals, contrasts, etc.) — design widgets to **minimize** extra `tiles`.

---

### STEP 2 — Web research (**mandatory**)

Find **5 credible sources** relevant to **improving interactivity / comprehension / engagement** for this topic (or for the interaction patterns you plan).

**Credible examples:** peer‑reviewed papers, established UX guidance (e.g. NN/g, WebAIM), major publications, documented HCI / learning research.

For **each** source, capture:

- **Title**  
- **Link** (full URL)  
- **Key takeaway** (one line, usable in design rationale)

---

### STEP 3 — Interactivity design (5 elements)

Using research insights, define **5 interactive elements** for **this post**.

**Then** follow **[`BLOG_AGENT_VISUALS.md`](./BLOG_AGENT_VISUALS.md)** and add a **Visual spec** (mood, motifs, `cardVariant` / optional `theme` note, alt-text guidance for any future images) so imagery **resonates** with the piece without breaking the global design rules below.

**Quota split**

- **Up to 5** are implemented via **`interaction`** objects on **tiles** (use the types the schema supports: `reveal`, `accordion`, `tabs`, `dragOrder`, `sliderReveal`).  
- **Prefer consolidating** widgets (e.g. one `reveal` with many `pairs`, one `accordion` with many `sections`) so you **do not** multiply `tiles` just to hit five patches of interactivity — that stacks boxed sections and hurts the reading experience.  
- If the plan lists five distinct elements, map them to **the minimum number of `interaction` objects** (and thus tiles) that still respects the schema; the written plan can elaborate **sub-parts** inside merged widgets.  
- Do **not** count the platform trio (jump strip, progress bar, scroll-spy) toward these five.

For **each** of the 5 elements, specify:

| Field | Description |
|-------|--------------|
| **Name** | Short label |
| **Type** | One of: `reveal` / `accordion` / `tabs` / `dragOrder` / `sliderReveal` (or “structural” only if justified—prefer widgets) |
| **Placement** | Which `tile.id` (section) |
| **Purpose** | What the reader gains |
| **Research justification** | One sentence tied to STEP 2 |

**Examples mapped to schema:** inline reveal prompts → `reveal`; compare viewpoints → `tabs`; step sequence → `dragOrder` or `sliderReveal`; optional depth → `accordion`.

---

### STEP 4 — Blog generation (manifest)

Emit **`manifest.json`**:

- `slug`, `title`, `summary`, `createdAt` (ISO 8601 with offset, e.g. `…Z`), optional `category`, `cardVariant`, `readTimeMinutes`, optional `theme`  
- `tiles[]`: each with stable kebab-case `id`, human `label`, `blocks[]`, and `interaction` where designed  
- **Chunking:** **default = one main prose `tile`** with long `blocks[]`; add **additional tiles only** when required for extra `interaction`s (one per tile max) or explicit multi-part posts. **Do not** use “several tiles for jump-strip SEO” at the cost of a stacked-box layout.  
- **Images (Cursor agent):** follow **`.cursor/rules/stillwater-unsplash-images.mdc`** — run **`npm run unsplash-search`** from `interactive/` with a mood-appropriate query, then splice **`image`** blocks into `blocks[]` (real URLs only). Skip only if the user opts out or images already exist.  
- **Images (Creator / Netlify):** `compile-blog` can auto-insert images when `UNSPLASH_ACCESS_KEY` is set on Netlify and the model output has no `image` blocks yet.  
- Run **`cd interactive && npm run validate-manifest -- content/publishes/<slug>/manifest.json`** and fix errors  

---

### STEP 5 — Design constraints (**critical**)

**Global design — do not change for one post:**

- Shared **color palette**, **typography**, **nav**, **footer**, **grid cards**, **post shell**  
- **Spacing system** in `interactive/src/style.css` for layout regions you do not own  

**Allowed per post:**

- `theme` overrides **only if** the user explicitly wants tonal variation; default is **inherit Stillwater** (omit `theme` or keep subtle)  
- Content-level **widgets** and **blocks** inside the shared post layout  

**Do not:**

- Redesign the whole journal or landing page for a single article  
- Remove or bypass the **three platform interactives** listed above  
- **Slice a single essay into many short `tiles`** for convenience — that reads as **many boxed sections** and violates **Continuous reading layout**  
- Introduce paywalls, subscriptions, or financial CTAs unless the user explicitly requests them  

---

### STEP 6 — Output structure (what to return to the user)

```
=== MANIFEST / REPO ACTION ===
- Path: interactive/content/publishes/<slug>/manifest.json
- (Or diff summary if editing existing slug)

=== BLOG CONTENT (human overview) ===
- Section titles and what each contains

=== INTERACTIVITY PLAN (5 elements) ===
For each: Name | Type | Tile (id) | Purpose | Research justification

=== RESEARCH SOURCES (5) ===
For each: Title | Link | Key insight

=== QUALITY CHECK ===
- validate-manifest: pass/fail
- Unsplash: unsplash-search run + image blocks merged (unless user skipped)
- Platform trio: unchanged
```

---

### STEP 7 — Deployment format

- **Deployable artifact:** committed `manifest.json` under `content/publishes/<slug>/`  
- **Responsiveness:** rely on existing Stillwater CSS (no one-off full layouts per post)  
- **Performance:** prefer native widgets; avoid heavy embeds unless added to the stack on purpose  

---

### STEP 8 — Quality check (before hand-off)

- Interactivity **supports** reading; it does not dominate or distract  
- Design **matches** Stillwater patterns  
- Copy **flows as one column** where appropriate: **`heading` blocks** carry structure inside minimal `tiles`, **not** a long stack of separate section cards  
- **`validate-manifest`** passes  
- If the post should include visuals: **`image`** blocks use **Unsplash-sourced** URLs (agent ran **`unsplash-search`**, or Creator/Netlify injected them), not invented links  
- The **jump strip**, **progress bar**, and **scroll-spy** are still assumed present on the live post view  

---

## Goal

Every generated post should feel:

- **Visually consistent** with Stillwater  
- **Engaging** through research-informed widgets + fixed navigation affordances  
- **Deployable** with minimal manual fixing (validate + commit + push)

---

## Quick reference: add a new post

```bash
cd interactive
npm run validate-manifest -- content/publishes/<slug>/manifest.json
```

Open locally: `http://localhost:5173/?slug=<slug>`
