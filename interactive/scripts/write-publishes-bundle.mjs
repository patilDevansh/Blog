#!/usr/bin/env node
/**
 * Writes public/publishes-bundle.json for production fallback when import.meta.glob
 * resolves empty (some CI / path edge cases). Vite copies public/ → dist root.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const interactiveRoot = join(__dirname, "..");
const publishesDir = join(interactiveRoot, "content", "publishes");
const publicDir = join(interactiveRoot, "public");
const outFile = join(publicDir, "publishes-bundle.json");

if (!existsSync(publishesDir)) {
  console.warn("write-publishes-bundle: no content/publishes dir, writing []");
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
  writeFileSync(outFile, "[]\n");
  process.exit(0);
}

const slugs = readdirSync(publishesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const manifests = [];
for (const slug of slugs) {
  const fp = join(publishesDir, slug, "manifest.json");
  if (!existsSync(fp)) continue;
  try {
    const raw = JSON.parse(readFileSync(fp, "utf8"));
    manifests.push(raw);
  } catch (e) {
    console.warn(`write-publishes-bundle: skip ${slug}:`, e);
  }
}

if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
writeFileSync(outFile, `${JSON.stringify(manifests)}\n`);
console.log(`write-publishes-bundle: ${manifests.length} post(s) → public/publishes-bundle.json`);
