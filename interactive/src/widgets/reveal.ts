import type { Interaction } from "@schema/interactions";
import type { WidgetMountOptions } from "./types";

export function mountReveal(
  container: HTMLElement,
  interaction: Interaction,
  options: WidgetMountOptions
): void {
  if (interaction.type !== "reveal") return;
  const wrap = document.createElement("div");
  wrap.className = "widget widget-reveal";
  for (const pair of interaction.pairs) {
    const row = document.createElement("div");
    row.className = "reveal-row";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "reveal-prompt";
    btn.textContent = pair.prompt;
    const hidden = document.createElement("div");
    hidden.className = "reveal-hidden";
    hidden.hidden = true;
    hidden.setAttribute("role", "region");
    const p = document.createElement("p");
    p.textContent = pair.hidden;
    hidden.appendChild(p);
    btn.addEventListener("click", () => {
      const open = !hidden.hidden;
      hidden.hidden = open;
      btn.setAttribute("aria-expanded", String(!open));
      if (!options.reducedMotion) {
        hidden.style.animation = open ? "none" : "fadeIn 0.35s ease";
      }
    });
    btn.setAttribute("aria-expanded", "false");
    row.appendChild(btn);
    row.appendChild(hidden);
    wrap.appendChild(row);
  }
  container.appendChild(wrap);
}
