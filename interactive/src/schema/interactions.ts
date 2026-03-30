import { z } from "zod";

export const interactionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("reveal"),
    pairs: z
      .array(
        z.object({
          prompt: z.string().min(1),
          hidden: z.string().min(1),
        })
      )
      .min(1),
  }),
  z.object({
    type: z.literal("accordion"),
    sections: z
      .array(
        z.object({
          title: z.string().min(1),
          body: z.string().min(1),
        })
      )
      .min(1),
  }),
  z.object({
    type: z.literal("tabs"),
    tabs: z
      .array(
        z.object({
          label: z.string().min(1),
          content: z.string().min(1),
        })
      )
      .min(2),
  }),
  z.object({
    type: z.literal("dragOrder"),
    prompt: z.string().optional(),
    items: z.array(z.string().min(1)).min(2),
    correctOrder: z.array(z.string().min(1)).min(2),
  }),
  z.object({
    type: z.literal("sliderReveal"),
    slides: z
      .array(
        z.object({
          title: z.string().min(1),
          body: z.string().min(1),
        })
      )
      .min(2),
    autoAdvanceMs: z.number().int().positive().optional(),
  }),
]);

export type Interaction = z.infer<typeof interactionSchema>;
