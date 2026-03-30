/** Decorative SVGs matching `index 2.html` blog tiles — cycle by post index */

export const CARD_VARIANTS = ["purple", "teal", "amber", "pink"] as const;
export type CardVariant = (typeof CARD_VARIANTS)[number];

export function pickVariant(
  explicit: CardVariant | undefined,
  index: number
): CardVariant {
  if (explicit && CARD_VARIANTS.includes(explicit)) return explicit;
  return CARD_VARIANTS[index % CARD_VARIANTS.length]!;
}

const SVGS: Record<CardVariant, string> = {
  purple: `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true"><circle cx="28" cy="28" r="22" stroke="#AFA9EC" stroke-width="1.5"/><circle cx="28" cy="28" r="10" fill="#CECBF6"/><circle cx="28" cy="28" r="4" fill="#AFA9EC"/></svg>`,
  teal: `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true"><path d="M28 8 C16 22 16 42 28 48 C40 42 40 22 28 8Z" stroke="#5DCAA5" stroke-width="1.5" fill="#9FE1CB"/><path d="M28 18 C22 28 22 40 28 44 C34 40 34 28 28 18Z" fill="#5DCAA5" opacity="0.5"/></svg>`,
  amber: `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true"><path d="M28 10 L32 22 H46 L35 30 L39 43 L28 35 L17 43 L21 30 L10 22 H24Z" stroke="#EF9F27" stroke-width="1.5" fill="#FAC775"/></svg>`,
  pink: `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true"><path d="M28 46 C28 46 10 36 10 23 C10 16 15 11 21 11 C24.5 11 28 14 28 14 C28 14 31.5 11 35 11 C41 11 46 16 46 23 C46 36 28 46 28 46Z" stroke="#ED93B1" stroke-width="1.5" fill="#F4C0D1"/></svg>`,
};

export function svgForVariant(v: CardVariant): string {
  return SVGS[v];
}
