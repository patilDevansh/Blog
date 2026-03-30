# Blog

This folder has **two** parts:

| Path | What it is |
|------|------------|
| **`index 2.html`** | Your standalone “Stillwater” spiritual journal page (open it in a browser). |
| **`interactive/`** | The **agentic interactive blog** app (Vite + TypeScript): tiles, `manifest.json` posts, widgets. |

The ~30 project files live under **`interactive/`** — expand that folder in the file tree.

### Run the interactive app

```bash
cd interactive
npm install
npm run dev
```

### Why you only saw one file before

The earlier implementation was created in a **different Cursor worktree**, not on `Desktop/Blog`. Everything is now copied into **`interactive/`** here.
