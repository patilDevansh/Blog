#!/usr/bin/env npx tsx
/**
 * compile-blog — hybrid hook for the Cursor/CLI phase.
 *
 * Usage:
 *   npm run compile-blog
 *   npm run compile-blog -- --file path/to/draft.txt
 */
import { readFileSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function main() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf("--file");
  const file =
    fileIdx >= 0 && args[fileIdx + 1] ? args[fileIdx + 1] : null;

  console.log("Agentic blog — compile hook\n");
  console.log("1. Copy agent/prompts/system.md into your agent’s system context.");
  console.log("2. Fill agent/prompts/user-template.md with your draft.");
  console.log("3. Ask the agent for the manifest JSON.");
  console.log("4. Save as content/publishes/<slug>/manifest.json");
  console.log("5. Run: npm run validate-manifest -- content/publishes/<slug>/manifest.json");
  console.log("6. Run: npm run dev  (add ?slug=<slug> if multiple posts)\n");

  if (file) {
    const abs = file.startsWith("/") ? file : join(process.cwd(), file);
    if (!existsSync(abs)) {
      console.error(`File not found: ${abs}`);
      process.exit(1);
    }
    const text = readFileSync(abs, "utf8");
    const name = basename(abs, ".txt").replace(/\.md$/i, "");
    const suggestedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    console.log(`Draft file: ${abs}`);
    console.log(`Characters: ${text.length}`);
    console.log(`Suggested slug from filename: ${suggestedSlug || "(adjust manually)"}`);
  } else {
    console.log("(Pass --file <draft.txt> to see character count and suggested slug.)\n");
  }

  console.log(`Project root: ${root}`);
}

main();
