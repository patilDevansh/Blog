import type { Interaction } from "@schema/interactions";
import type { WidgetMountOptions } from "./types";

export function mountSliderReveal(
  container: HTMLElement,
  interaction: Interaction,
  options: WidgetMountOptions
): void {
  if (interaction.type !== "sliderReveal") return;
  const { slides, autoAdvanceMs } = interaction;
  const wrap = document.createElement("div");
  wrap.className = "widget widget-slider";

  let index = 0;
  const slideEl = document.createElement("div");
  slideEl.className = "slider-slide";

  const title = document.createElement("h4");
  const body = document.createElement("p");
  slideEl.appendChild(title);
  slideEl.appendChild(body);

  function show(i: number) {
    const s = slides[i]!;
    title.textContent = s.title;
    body.textContent = s.body;
    index = i;
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
    indicator.textContent = `${i + 1} / ${slides.length}`;
  }

  const nav = document.createElement("div");
  nav.className = "slider-nav";
  const prev = document.createElement("button");
  prev.type = "button";
  prev.textContent = "←";
  prev.setAttribute("aria-label", "Previous slide");
  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "→";
  next.setAttribute("aria-label", "Next slide");
  const indicator = document.createElement("span");
  indicator.className = "slider-indicator";

  prev.addEventListener("click", () => show(Math.max(0, index - 1)));
  next.addEventListener("click", () =>
    show(Math.min(slides.length - 1, index + 1))
  );

  nav.appendChild(prev);
  nav.appendChild(indicator);
  nav.appendChild(next);

  show(0);

  wrap.appendChild(slideEl);
  wrap.appendChild(nav);

  const ms = autoAdvanceMs;
  if (ms && ms > 0 && !options.reducedMotion) {
    const timer = setInterval(() => {
      const n = index >= slides.length - 1 ? 0 : index + 1;
      show(n);
    }, ms);
    (wrap as HTMLElement & { _autoTimer?: ReturnType<typeof setInterval> })._autoTimer =
      timer;
  }

  container.appendChild(wrap);
}

export function clearSliderTimers(root: HTMLElement): void {
  const slider = root.querySelector(
    ".widget-slider"
  ) as (HTMLElement & { _autoTimer?: ReturnType<typeof setInterval> }) | null;
  if (slider?._autoTimer) {
    clearInterval(slider._autoTimer);
    slider._autoTimer = undefined;
  }
}
