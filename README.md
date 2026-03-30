# Stillwater — blog

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
