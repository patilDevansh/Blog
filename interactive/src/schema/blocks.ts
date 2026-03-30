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
]);

export type Block = z.infer<typeof blockSchema>;
