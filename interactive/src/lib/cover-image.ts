import { orderedTiles, type PublishManifest } from "@schema/manifest";

/** First `image` block in reading order; used for journal cards. */
export function firstImageFromManifest(
  manifest: PublishManifest
): { src: string; alt: string } | null {
  for (const tile of orderedTiles(manifest)) {
    for (const block of tile.blocks) {
      if (block.type === "image") {
        return { src: block.src, alt: block.alt };
      }
    }
  }
  return null;
}
