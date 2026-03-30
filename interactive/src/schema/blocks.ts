import { z } from "zod";

export const blockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("heading"),
    level: z.number().int().min(1).max(3),
    text: z.string().min(1),
  }),
  z.object({
    type: z.literal("paragraph"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("list"),
    ordered: z.boolean(),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal("quote"),
    text: z.string().min(1),
    attribution: z.string().optional(),
  }),
  z.object({
    type: z.literal("code"),
    language: z.string().optional(),
    code: z.string(),
  }),
  z.object({
    type: z.literal("image"),
    /** Unsplash CDN or other HTTPS image URL from a licensed source */
    src: z.string().url(),
    alt: z.string(),
    /** Photographer name (Unsplash attribution) */
    creditName: z.string().min(1),
    /** Link to the photo on Unsplash (or photographer page), including UTM if required */
    creditLink: z.string().url(),
  }),
]);

export type Block = z.infer<typeof blockSchema>;
