import type { Interaction } from "@schema/interactions";
import type { WidgetMountOptions } from "./types";

export function mountAccordion(
  container: HTMLElement,
  interaction: Interaction,
  _options: WidgetMountOptions
): void {
  if (interaction.type !== "accordion") return;
  const wrap = document.createElement("div");
  wrap.className = "widget widget-accordion";
  for (let i = 0; i < interaction.sections.length; i++) {
    const sec = interaction.sections[i]!;
    const id = `acc-${Math.random().toString(36).slice(2, 9)}-${i}`;
    const h = document.createElement("h3");
    h.className = "accordion-header";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "accordion-trigger";
    btn.id = `${id}-trigger`;
    btn.setAttribute("aria-controls", `${id}-panel`);
    btn.setAttribute("aria-expanded", i === 0 ? "true" : "false");
    btn.textContent = sec.title;
    h.appendChild(btn);
    const panel = document.createElement("div");
    panel.className = "accordion-panel";
    panel.id = `${id}-panel`;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", `${id}-trigger`);
    panel.hidden = i !== 0;
    const body = document.createElement("p");
    body.textContent = sec.body;
    panel.appendChild(body);
    btn.addEventListener("click", () => {
      const open = !panel.hidden;
      for (const c of wrap.querySelectorAll(".accordion-panel")) {
        (c as HTMLElement).hidden = true;
      }
      for (const t of wrap.querySelectorAll(".accordion-trigger")) {
        t.setAttribute("aria-expanded", "false");
      }
      if (open) {
        panel.hidden = false;
        btn.setAttribute("aria-expanded", "true");
      }
    });
    wrap.appendChild(h);
    wrap.appendChild(panel);
  }
  container.appendChild(wrap);
}
