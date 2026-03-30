import { z } from "zod";

export const fontPresetSchema = z.enum([
  "editorial",
  "mono",
  "rounded",
  "serif-warm",
]);

export const motionLevelSchema = z.enum(["none", "subtle", "playful"]);

export const themeSchema = z
  .object({
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    fontPreset: fontPresetSchema.optional(),
    motion: motionLevelSchema.optional(),
  })
  .strict();

export type ThemeTokens = z.infer<typeof themeSchema>;
export type FontPreset = z.infer<typeof fontPresetSchema>;
export type MotionLevel = z.infer<typeof motionLevelSchema>;
