# Stillwater — blog

## AI agent: raw text → structured posts

If you’re using Cursor (or another agent) with **raw draft text**, point it at **[`BLOG_AGENT_WORKFLOW.md`](./BLOG_AGENT_WORKFLOW.md)**. That file defines the **agentic workflow**: content analysis, mandatory web research (5 sources), **5 per-post interactive elements** (manifest widgets), and **design constraints**. For **images, mood, and art direction**, use the linked companion **[`BLOG_AGENT_VISUALS.md`](./BLOG_AGENT_VISUALS.md)** (see the top of the workflow file for when to switch).

**Fixed for every post (do not remove per article):** section **jump strip** (smooth scroll), **reading progress bar**, **scroll-spy** on jump links — implemented in `interactive/src/main.ts`.

**Two “home” grids (keep them in sync):** The journal at **`/`** builds post cards from **`interactive/content/publishes/*/manifest.json`**. The marketing pages **`interactive/public/stillwater.html`** (built to `dist`) and **`index 2.html`** use a **hand-written** grid for the same look. When you change a manifest (`title`, `summary`, `category`, `readTimeMinutes`), update the matching `<a class="blog-tile" href="/?slug=…">` block in those HTML files or the tile will **lie** while the article is correct—and **back/forward** between `/` and `stillwater.html` will feel inconsistent.

### Images (Unsplash) — how to phrase search queries

When you or an agent run **`npm run unsplash-search`** (from `interactive/`, with `UNSPLASH_ACCESS_KEY` in the repo root `.env`), the **query string** is the only lever you have. Poor queries return pretty but **off-topic** photos. Use this order:

1. **Tie the query to what the prose is actually doing.** Skim the draft (or the `paragraph` blocks near where the image will sit) and extract **concrete cues**: setting (kitchen, path, room), time of day, weather, metaphor (light, water, threshold). Build **3–8 words** that a photographer might have tagged honestly—not a generic mood like “peaceful nature” unless the essay is truly about nature.

2. **Keep a contemplative register.** Stillwater reads **spiritual-but-editorial**: favor soft light, mist, hands at rest, distant mountains, empty bench, candle, temple *architecture* as space, walking path, dawn—things that feel **inward** and quiet. Avoid neon “wellness” stock, cliché yoga poses, or loud tourist shots.

3. **Use Himalayan / Buddhist / meditation vocabulary only when it fits.** Words like *Himalaya*, *Tibet*, *temple*, *prayer flags*, *Zen garden*, *meditation* can **sharpen** a query when the piece touches stillness, tradition, altitude, or pilgrimage. They are **not** a default template—if the essay is domestic, intimate, or grounded in ordinary mornings, search for **that** (e.g. *steam morning kitchen window light*) instead of forcing exotic place-names.

4. **Vary queries between images.** The first and second image should each reflect **different beats** in the essay (e.g. opening “threshold” vs later “return”), not the same generic search twice.

For the full art-direction checklist, see **[`BLOG_AGENT_VISUALS.md`](./BLOG_AGENT_VISUALS.md)** (Unsplash section).

---

This repo is **one** spiritual blog, two ways to open it:

## 1. Landing page (the grid of posts)

**`index 2.html`** — The full Stillwater marketing page: hero, post tiles, quote band, newsletter, footer. Open it in a browser (double‑click or drag into Chrome), or deploy it as a static file.

## 2. Interactive journal (same tiles as `index 2.html`)

**`interactive/`** — **`/`** shows the **blog grid** (colored headers, category, title, excerpt, date) like your original page. **Each JSON post** = **one tile** on that grid. Opening a post (`?slug=…`) shows the full entry in **one scrolling page** (section titles + your copy + optional interactions) — **no “Arrival / The noise” pill buttons**.

Add a post: new folder `interactive/content/publishes/<slug>/manifest.json` with `title`, `summary`, `category`, optional `cardVariant` (`purple` | `teal` | `amber` | `pink`), `readTimeMinutes`, and `tiles` (the parts of the article).

```bash
cd interactive
npm install
npm run dev
```

- **Journal grid:** [http://localhost:5173/](http://localhost:5173/)
- **Stillwater static landing:** [http://localhost:5173/stillwater.html](http://localhost:5173/stillwater.html) (same as `index 2.html`)

## Netlify (production)

The repo includes [`netlify.toml`](file:///Users/dp/Desktop/Blog/netlify.toml):

- **Build command:** `cd interactive && npm ci && npm run build`
- **Publish directory:** `interactive/dist`
- **SPA redirects:** [`interactive/public/_redirects`](file:///Users/dp/Desktop/Blog/interactive/public/_redirects) is copied into `dist` so client-side routes and `?slug=` work on refresh.

In the Netlify UI: connect the Git repo and deploy (no need to set a separate “base directory” if you keep this `netlify.toml` at the repo root). Node 20 is set in `[build.environment]`.

**Links in production:** Use **relative** URLs like `/` and `/stillwater.html` (as in `index 2.html`) so they resolve on your live domain.

## Creator (private)

**URL:** `/creator.html` — not linked from the public journal; `noindex` in HTML. Bookmark it.

1. In **Netlify → Site configuration → Environment variables**, add:
   - `CREATOR_PASSWORD` — your secret (you type this on the creator page)
   - `OPENAI_API_KEY` — your OpenAI key
   - Optional: `OPENAI_MODEL` (default `gpt-4o-mini`)

2. Redeploy. Open `https://your-site.netlify.app/creator.html`, enter password + draft → **Generate manifest** → copy or download JSON.

3. Add the file to the repo as `interactive/content/publishes/<slug>/manifest.json`, commit, push (Netlify rebuilds).

**Local:** plain `npm run dev` does **not** run Netlify Functions. From the **repo root** (where `netlify.toml` lives), run `npx netlify dev` so the function at `/.netlify/functions/compile-blog` is available. See `.env.example` for variable names.

### Netlify shows “Page not found” (404)

Usually the **publish directory** or **base directory** in the Netlify UI does not match the repo.

1. Open **Site configuration → Build & deploy → Continuous deployment → Build settings**.
2. **Set “Base directory” to empty** (repository root). If it is `interactive`, Netlify looks for `interactive/interactive/dist` and deploys nothing useful.
3. Set **Build command** to `npm run build` **or** leave blank so `netlify.toml` is used (root `package.json` runs the Vite build).
4. Set **Publish directory** to `interactive/dist` **or** leave blank so `netlify.toml` wins.
5. **Save**, then **Deploys → Trigger deploy → Clear cache and deploy site**.

After a good deploy, the deploy log should list published files including `index.html` at the site root.
