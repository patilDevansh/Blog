import type { Interaction } from "@schema/interactions";
import type { InteractionWidget } from "./types";
import { mountReveal } from "./reveal";
import { mountAccordion } from "./accordion";
import { mountTabs } from "./tabs";
import { mountDragOrder } from "./drag-order";
import { mountSliderReveal } from "./slider-reveal";

const registry: Record<Interaction["type"], InteractionWidget> = {
  reveal: mountReveal,
  accordion: mountAccordion,
  tabs: mountTabs,
  dragOrder: mountDragOrder,
  sliderReveal: mountSliderReveal,
};

export function mountInteraction(
  container: HTMLElement,
  interaction: Interaction,
  options: { reducedMotion: boolean }
): void {
  const fn = registry[interaction.type];
  if (fn) fn(container, interaction, options);
}

export { clearSliderTimers } from "./slider-reveal";
export type { InteractionWidget } from "./types";
