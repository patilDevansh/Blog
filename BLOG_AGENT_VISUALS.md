# Stillwater — visuals & imagery (blog agent supplement)

**Companion to [`BLOG_AGENT_WORKFLOW.md`](./BLOG_AGENT_WORKFLOW.md).**  
Read the workflow first for content, structure, and interactives. **Then** use *this* file whenever you plan or specify **images, illustration direction, and on-page visuals** so they match the essay and the Stillwater design system.

---

## When to open this document

- **After** you have a stable `title`, `summary`, tone, and section themes from the draft.  
- **Before** you suggest asset filenames, placeholder art, or updates to marketing pages that depend on mood (e.g. static `stillwater.html` grid feel).  
- **Whenever** the user asks for “visuals,” “hero,” “cover,” “thumbnails,” or “images” for a post.

---

## Role (for agents)

You are specifying **visual language** that **resonates** with the written piece—**not** replacing copy or changing layout tokens. Instructions here must be **actionable** (mood, subject, palette, restraint, accessibility) and **consistent** with Stillwater: contemplative, unhurried, editorial—not loud marketing or generic stock.

---

## Current technical reality (repo)

- Post bodies in **`manifest.json`** use **`blocks`**: `heading`, `paragraph`, `list`, `quote`, `code`, **`image`** (`src`, `alt`, `creditName`, `creditLink` for attribution).  
- **Unsplash (agentic / API):** from `interactive/`, run `UNSPLASH_ACCESS_KEY=... npm run unsplash-search -- "your search terms"` and paste the printed JSON block into a tile’s `blocks` array where it supports the prose. Follow [Unsplash API guidelines](https://unsplash.com/documentation) (attribution, hotlinking).  
- **Netlify `compile-blog` function:** if `UNSPLASH_ACCESS_KEY` is set in the site env, the server **automatically inserts** one or two landscape images after paragraphs (only when the model output has **no** existing `image` blocks).  
- **Journal grid cards** still use **color variants** and SVG motifs, not per-post photos on the card.  
- **Marketing** pages can embed images in HTML/CSS manually if needed.

Use the principles below for **where** an image belongs, **alt text**, and mood — whether the block is added by you, by `unsplash-search`, or by the compile API.

---

## Unsplash search queries — topic alignment (agents)

`unsplash-search` only sees a **text query**. Results will match *that string*, not your intentions—so **anchor every query in the draft**.

| Rule | What to do |
|------|------------|
| **1. Content-first** | Before searching, note **what this section discusses** (setting, metaphor, emotional beat). Build the query from **specific nouns and atmosphere** drawn from those paragraphs—not from the post title alone, and not from vague words like “peaceful” or “beautiful.” |
| **2. Spiritual tone, not spiritual spam** | Prefer a **contemplative** register: soft light, mist, horizon, interior quiet, path, water, hands, fabric, dawn, distant peaks, candle, silence-as-subject. The image should **feel** like Stillwater: inward, unhurried, a little sacred. |
| **3. Eastern / Himalayan / practice cues — optional** | Vocabulary such as *Himalayas*, *Tibet*, *temple*, *Buddhist*, *meditation*, *Zen*, *prayer flags* can appear in queries **when** the essay’s themes support them (tradition, altitude, pilgrimage, practice). **Do not** use them on every post; if the piece is about ordinary mornings or friendship, keep the query **faithful to that** so images stay related. |
| **4. Two images → two distinct queries** | First image: query tied to an **early** thematic beat. Second image: re-read the **later** body; use a **different** query so the second photo is not a duplicate mood with unrelated geography. |

**Bad:** `calm nature sunset` (generic; may match nothing in the essay).  
**Better:** `quiet kitchen morning steam window` when the draft is about dawn and routine.  
**Better (when themes fit):** `mist himalaya mountain dawn` for a piece about threshold and vastness—not for every post.

---

## Principles — what should visuals *do*?

1. **Echo the emotional core** of the essay (e.g. stillness vs storm, weight vs release)—not a literal cliché (no “random zen rock #7”).  
2. **Stay secondary to the text.** Stillwater is a reading experience; images **support** breath and focus, they don’t compete with paragraphs.  
3. **Match the palette family** — soft off-white ground, deep purple ink, teal / amber / rose as **accents** (see existing journal CSS tokens). Avoid neon, harsh contrast, or unrelated brand colors.  
4. **Prefer ambiguity over literalism** — abstract texture, horizon, water, light through glass, shadow, hands loosely framed, nature without “postcard” perfection.  
5. **One clear focal idea per post** — “this piece sounds like ***muted morning light through curtains***” beats ten mixed references.

---

## Per-post deliverables (what you output)

For each post, add a short **Visual spec** block (in your handoff to the user or in internal notes):

| Field | Intent |
|--------|--------|
| **Mood (3–6 words)** | e.g. *grounded, tender, slightly heavy, hopeful edge* |
| **Motifs** | 2–4 concrete but flexible cues (water, horizon, hands, fabric, dusk, interior) |
| **Palette note** | Tie to Stillwater: *lean teal accents*, *warm amber highlight*, *stay in soft purple range* |
| **Avoid** | Explicit list: e.g. *yoga-stock poses, neon wellness graphics, crowded collages* |
| **Grid / card** | Suggest `cardVariant` if it reinforces mood (`purple` introspective, `teal` restorative, `amber` warmth, `pink` gentle / vulnerable) |
| **Optional hero / future asset** | If images are added later: **aspect ratio** (e.g. 16:9 or 3:2), **orientation**, **focal point** (thirds), **alt text** draft (see below) |

Do **not** redesign global chrome, nav, or typography—only **describe** visuals that *fit inside* existing patterns.

---

## Accessibility & copy

- Any real **`img`** eventually used must have **descriptive `alt` text** tied to *emotional function* (“soft light across an empty table”) not empty fluff (“image1”).  
- If an image is purely decorative, plan for **`alt=""`** and decorative ARIA patterns when implemented.  
- Don’t rely on color alone to convey meaning (contrast, captions if needed).

---

## Legal & sourcing (agent reminders)

- Prefer **original**, **commissioned**, or **explicitly licensed** work (stock license, CC with attribution requirements).  
- **Unsplash:** use the API or `unsplash-search` only; put real `src` and `creditLink` (photo page) on every `image` block; never guess URLs.  
- For non-Unsplash assets, never invent “available” URLs—give **search keywords** or **brief for a human** to source.  
- Note **attribution** if the license requires it.

---

## Quality check (visuals only)

- [ ] Mood **matches** the essay’s arc (not just the title).  
- [ ] **Unsplash queries** were built from **section content** (see *Unsplash search queries* above), not generic stock moods.  
- [ ] Spec is **compatible** with Stillwater palette and calm editorial vibe.  
- [ ] No visual idea **contradicts** the “continuous reading” / non-gimmicky spirit of the workflow README.  
- [ ] **Alt / accessibility** considered for any concrete image plan.  
- [ ] **`cardVariant` / `theme`** (if touched) supports the piece without breaking site-wide consistency rules in `BLOG_AGENT_WORKFLOW.md`.

---

## Quick link back

Return to **[`BLOG_AGENT_WORKFLOW.md`](./BLOG_AGENT_WORKFLOW.md)** for manifest structure, research, interactives, deployment, and static HTML sync rules.
