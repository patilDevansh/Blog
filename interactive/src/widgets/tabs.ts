import type { Interaction } from "@schema/interactions";
import type { WidgetMountOptions } from "./types";

export function mountTabs(
  container: HTMLElement,
  interaction: Interaction,
  _options: WidgetMountOptions
): void {
  if (interaction.type !== "tabs") return;
  const wrap = document.createElement("div");
  wrap.className = "widget widget-tabs";
  const tablist = document.createElement("div");
  tablist.className = "tabs-list";
  tablist.setAttribute("role", "tablist");
  const panels = document.createElement("div");
  panels.className = "tabs-panels";
  const base = `tab-${Math.random().toString(36).slice(2, 8)}`;

  interaction.tabs.forEach((tab, i) => {
    const tid = `${base}-${i}`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tabs-tab";
    btn.id = `${tid}-tab`;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", i === 0 ? "true" : "false");
    btn.setAttribute("aria-controls", `${tid}-panel`);
    btn.tabIndex = i === 0 ? 0 : -1;
    btn.textContent = tab.label;
    tablist.appendChild(btn);

    const panel = document.createElement("div");
    panel.className = "tabs-panel";
    panel.id = `${tid}-panel`;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", `${tid}-tab`);
    panel.hidden = i !== 0;
    const p = document.createElement("p");
    p.textContent = tab.content;
    panel.appendChild(p);
    panels.appendChild(panel);

    btn.addEventListener("click", () => {
      for (const b of tablist.querySelectorAll(".tabs-tab")) {
        const bt = b as HTMLButtonElement;
        bt.setAttribute("aria-selected", "false");
        bt.tabIndex = -1;
      }
      for (const pEl of panels.querySelectorAll(".tabs-panel")) {
        (pEl as HTMLElement).hidden = true;
      }
      btn.setAttribute("aria-selected", "true");
      btn.tabIndex = 0;
      panel.hidden = false;
    });
  });

  wrap.appendChild(tablist);
  wrap.appendChild(panels);
  container.appendChild(wrap);
}
