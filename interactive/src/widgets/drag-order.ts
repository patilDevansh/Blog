import type { Interaction } from "@schema/interactions";
import type { WidgetMountOptions } from "./types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function mountDragOrder(
  container: HTMLElement,
  interaction: Interaction,
  options: WidgetMountOptions
): void {
  if (interaction.type !== "dragOrder") return;
  const wrap = document.createElement("div");
  wrap.className = "widget widget-drag-order";

  if (interaction.prompt) {
    const intro = document.createElement("p");
    intro.className = "drag-prompt";
    intro.textContent = interaction.prompt;
    wrap.appendChild(intro);
  }

  const order = shuffle([...interaction.items]);
  const list = document.createElement("ol");
  list.className = "drag-list";
  list.setAttribute("aria-label", "Reorder items");

  order.forEach((text, idx) => {
    const li = document.createElement("li");
    li.className = "drag-item";
    li.draggable = !options.reducedMotion;
    li.dataset.index = String(idx);
    const span = document.createElement("span");
    span.textContent = text;
    li.appendChild(span);

    const controls = document.createElement("div");
    controls.className = "drag-controls";
    const up = document.createElement("button");
    up.type = "button";
    up.className = "drag-nudge";
    up.textContent = "↑";
    up.setAttribute("aria-label", "Move up");
    const down = document.createElement("button");
    down.type = "button";
    down.className = "drag-nudge";
    down.textContent = "↓";
    down.setAttribute("aria-label", "Move down");
    controls.appendChild(up);
    controls.appendChild(down);
    li.appendChild(controls);

    up.addEventListener("click", () => {
      if (li.previousElementSibling) {
        list.insertBefore(li, li.previousElementSibling);
      }
    });
    down.addEventListener("click", () => {
      if (li.nextElementSibling) {
        list.insertBefore(li.nextElementSibling, li);
      }
    });

    if (!options.reducedMotion) {
      li.addEventListener("dragstart", (e) => {
        e.dataTransfer?.setData("text/plain", li.dataset.index ?? "0");
        li.classList.add("dragging");
      });
      li.addEventListener("dragend", () => li.classList.remove("dragging"));
      li.addEventListener("dragover", (e) => {
        e.preventDefault();
      });
      li.addEventListener("drop", (e) => {
        e.preventDefault();
        const from = list.querySelector(".dragging");
        if (from && from !== li) {
          const rect = li.getBoundingClientRect();
          const before = e.clientY < rect.top + rect.height / 2;
          if (before) {
            list.insertBefore(from, li);
          } else {
            list.insertBefore(from, li.nextElementSibling);
          }
        }
      });
    }

    list.appendChild(li);
  });

  const check = document.createElement("button");
  check.type = "button";
  check.className = "drag-check";
  check.textContent = "Check order";

  const feedback = document.createElement("p");
  feedback.className = "drag-feedback";
  feedback.setAttribute("role", "status");
  feedback.hidden = true;

  check.addEventListener("click", () => {
    const current = [...list.querySelectorAll(".drag-item span")].map(
      (s) => s.textContent ?? ""
    );
    const ok =
      current.length === interaction.correctOrder.length &&
      current.every((v, i) => v === interaction.correctOrder[i]);
    feedback.textContent = ok
      ? "Perfect order."
      : "Not quite — nudge items or drag to match your reasoning.";
    feedback.hidden = false;
  });

  wrap.appendChild(list);
  wrap.appendChild(check);
  wrap.appendChild(feedback);
  container.appendChild(wrap);
}
