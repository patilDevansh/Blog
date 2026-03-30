# Interactive agentic blog (Vite)

Tile-based posts driven by `content/publishes/<slug>/manifest.json`.

```bash
npm install
npm run dev
```

Open the printed URL (often `http://localhost:5173`). Sample: `sample-post`.

```bash
npm run validate-manifest
npm run build
```

See `agent/prompts/` and `agent/checklist.md` for the compile workflow.

## Adding a new interaction type

1. Extend `src/schema/interactions.ts`
2. Add `src/widgets/<name>.ts` and register in `src/widgets/index.ts`
3. Document in `agent/prompts/system.md`
