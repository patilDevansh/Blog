import type { FontPreset, MotionLevel, ThemeTokens } from "@schema/theme";

const defaults: ThemeTokens = {
  accent: "#c45c26",
  background: "#f4efe6",
  surface: "#fffdf8",
  text: "#1a1614",
  fontPreset: "editorial",
  motion: "subtle",
};

const fontStacks: Record<FontPreset, string> = {
  editorial:
    '"Fraunces", "Source Serif 4", Georgia, "Times New Roman", serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
  rounded: '"Nunito", system-ui, sans-serif',
  "serif-warm": '"Source Serif 4", Georgia, serif',
};

export function applyTheme(
  root: HTMLElement,
  theme: ThemeTokens | undefined,
  prefersReducedMotion: boolean
): void {
  const t = { ...defaults, ...theme };
  const motion: MotionLevel =
    prefersReducedMotion && t.motion !== "none"
      ? "subtle"
      : (t.motion ?? defaults.motion)!;

  root.style.setProperty("--color-accent", t.accent);
  root.style.setProperty("--color-bg", t.background);
  root.style.setProperty("--color-surface", t.surface ?? defaults.surface!);
  root.style.setProperty("--color-text", t.text ?? defaults.text!);
  root.style.setProperty("--font-body", fontStacks[t.fontPreset ?? "editorial"]);
  root.dataset.motion = motion;
  if (prefersReducedMotion) {
    root.dataset.reducedMotion = "1";
  } else {
    root.removeAttribute("data-reduced-motion");
  }
}

export function readPrefersReducedMotion(): boolean {
  return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")
    ?.matches ?? false;
}
