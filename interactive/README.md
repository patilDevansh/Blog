# Stillwater journal (Vite)

- **`/`** — Blog **grid** (one card per manifest): same tile layout as `index 2.html`.
- **`?slug=your-slug`** — Full **post**: sections stack vertically; interactions stay inline. No section pill nav.

Each post is `content/publishes/<slug>/manifest.json`:

- `title`, `summary`, `createdAt`, optional `category`, `cardVariant`, `readTimeMinutes`
- `tiles[]` — parts of the article (`label` + `blocks` + optional `interaction`)
- `navigation` — optional; if omitted, sections follow the order of `tiles`

```bash
npm install
npm run dev
```
