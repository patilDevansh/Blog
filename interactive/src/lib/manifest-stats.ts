import type { Block } from "@schema/blocks";
import type { PublishManifest } from "@schema/manifest";

function blockWordCount(b: Block): number {
  switch (b.type) {
    case "heading":
    case "paragraph":
      return b.text.split(/\s+/).filter(Boolean).length;
    case "list":
      return b.items.join(" ").split(/\s+/).filter(Boolean).length;
    case "quote":
      return b.text.split(/\s+/).filter(Boolean).length;
    case "code":
      return b.code.split(/\s+/).filter(Boolean).length;
    case "image":
    case "divider":
      return 0;
  }
}

export function estimatedWordCount(manifest: PublishManifest): number {
  let n = 0;
  n += manifest.title.split(/\s+/).filter(Boolean).length;
  n += manifest.summary.split(/\s+/).filter(Boolean).length;
  for (const t of manifest.tiles) {
    for (const b of t.blocks) {
      n += blockWordCount(b);
    }
  }
  return n;
}

export function sectionCount(manifest: PublishManifest): number {
  return manifest.tiles.length;
}

export function imageBlockCount(manifest: PublishManifest): number {
  let n = 0;
  for (const t of manifest.tiles) {
    for (const b of t.blocks) {
      if (b.type === "image") n++;
    }
  }
  return n;
}
