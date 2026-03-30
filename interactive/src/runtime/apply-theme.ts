import type { MotionLevel, ThemeTokens } from "@schema/theme";

/** Stillwater palette — matches `index 2.html` / spiritual journal UI */
const base: Required<
  Pick<ThemeTokens, "accent" | "background" | "surface" | "text">
> = {
  accent: "#3C3489",
  background: "#faf9f7",
  surface: "#ffffff",
  text: "#1a1a2e",
};

export function applyTheme(
  root: HTMLElement,
  theme: ThemeTokens | undefined,
  prefersReducedMotion: boolean
): void {
  const t = { ...base, ...theme };
  const motion: MotionLevel =
    prefersReducedMotion && theme?.motion !== "none"
      ? "subtle"
      : theme?.motion ?? "subtle";

  root.style.setProperty("--sw-accent", t.accent);
  root.style.setProperty("--sw-bg", t.background);
  root.style.setProperty("--sw-surface", t.surface ?? base.surface);
  root.style.setProperty("--sw-text", t.text ?? base.text);
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
