import { z } from "zod";
import { blockSchema } from "./blocks";
import { interactionSchema } from "./interactions";
import { themeSchema } from "./theme";

export const tileSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    label: z.string().min(1),
    blocks: z.array(blockSchema).min(1),
    interaction: interactionSchema.optional(),
  })
  .strict();

export const publishManifestSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    summary: z.string().min(1),
    createdAt: z.string().datetime({ offset: true }),
    navigation: z.array(z.string().min(1)).min(1),
    theme: themeSchema.optional(),
    tiles: z.array(tileSchema).min(1),
  })
  .strict()
  .superRefine((data, ctx) => {
    const ids = new Set(data.tiles.map((t) => t.id));
    for (const id of data.navigation) {
      if (!ids.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `navigation references unknown tile id: ${id}`,
          path: ["navigation"],
        });
      }
    }
    for (const tile of data.tiles) {
      if (!data.navigation.includes(tile.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `tile "${tile.id}" is missing from navigation`,
          path: ["tiles"],
        });
      }
      const inter = tile.interaction;
      if (inter?.type === "dragOrder") {
        const itemSet = new Set(inter.items);
        if (itemSet.size !== inter.items.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `tile "${tile.id}": dragOrder.items must be unique`,
            path: ["tiles"],
          });
        }
        if (inter.correctOrder.length !== inter.items.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `tile "${tile.id}": dragOrder.correctOrder length must match items`,
            path: ["tiles"],
          });
        }
        const correctSet = new Set(inter.correctOrder);
        if (correctSet.size !== inter.correctOrder.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `tile "${tile.id}": dragOrder.correctOrder must be unique`,
            path: ["tiles"],
          });
        }
        for (const x of inter.items) {
          if (!correctSet.has(x)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `tile "${tile.id}": dragOrder items and correctOrder must match as sets`,
              path: ["tiles"],
            });
            break;
          }
        }
      }
    }
  });

export type PublishManifest = z.infer<typeof publishManifestSchema>;
export type Tile = z.infer<typeof tileSchema>;

export function parseManifest(raw: unknown): PublishManifest {
  return publishManifestSchema.parse(raw);
}

export function safeParseManifest(raw: unknown) {
  return publishManifestSchema.safeParse(raw);
}
