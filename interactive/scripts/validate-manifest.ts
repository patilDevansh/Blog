#!/usr/bin/env npx tsx
/**
 * Usage: npm run validate-manifest -- content/publishes/<slug>/manifest.json
 *        npm run validate-manifest (validates all under content/publishes)
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { safeParseManifest } from "../src/schema/manifest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publishesDir = join(root, "content", "publishes");

function validateFile(path: string): boolean {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const result = safeParseManifest(raw);
  if (!result.success) {
    console.error(`Invalid: ${path}`);
    console.error(result.error.flatten());
    return false;
  }
  console.log(`OK: ${path}`);
  return true;
}

function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (args.length > 0) {
    let ok = true;
    for (const p of args) {
      const abs = p.startsWith("/") ? p : join(root, p);
      if (!validateFile(abs)) ok = false;
    }
    process.exit(ok ? 0 : 1);
    return;
  }

  if (!existsSync(publishesDir)) {
    console.error("No content/publishes directory.");
    process.exit(1);
  }

  let ok = true;
  for (const name of readdirSync(publishesDir, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    const manifestPath = join(publishesDir, name.name, "manifest.json");
    if (!existsSync(manifestPath)) continue;
    if (!validateFile(manifestPath)) ok = false;
  }
  process.exit(ok ? 0 : 1);
}

main();
