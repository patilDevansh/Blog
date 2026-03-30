import type { Interaction } from "@schema/interactions";

export type WidgetMountOptions = {
  reducedMotion: boolean;
};

export type InteractionWidget = (
  container: HTMLElement,
  interaction: Interaction,
  options: WidgetMountOptions
) => void;
