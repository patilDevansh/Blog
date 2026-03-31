import { setSessionPassword, setStudioUnlocked } from "./storage";
import { el } from "./ui";

const VERIFY_FN =
  import.meta.env.VITE_VERIFY_STUDIO_URL ||
  "/.netlify/functions/verify-creator-access";

export function renderStudioGate(
  root: HTMLElement,
  onUnlocked: () => void
): void {
  root.replaceChildren();

  const wrap = el("div", "cr-gate");
  const panel = el("div", "cr-gate-panel");
  panel.appendChild(el("p", "cr-gate-eyebrow", "Stillwater — private"));
  panel.appendChild(el("h1", "cr-gate-title", "Sign in"));
  panel.appendChild(
    el(
      "p",
      "cr-gate-lede",
      "This page is only for you. Enter your creator password to open the dashboard. It is not shown in the public menu and is hidden from search engines."
    )
  );

  const field = el("div", "cr-gate-field");
  field.appendChild(el("label", "", "Password"));
  const input = el("input") as HTMLInputElement;
  input.type = "password";
  input.autocomplete = "current-password";
  input.id = "cr-gate-pw";
  input.placeholder = "Your creator password";
  field.appendChild(input);

  const err = el("p", "cr-gate-error");
  err.hidden = true;

  const submit = el(
    "button",
    "cr-btn cr-btn--primary cr-gate-submit",
    "Sign in"
  ) as HTMLButtonElement;
  submit.type = "submit";

  const form = el("form", "cr-gate-form");
  form.appendChild(field);
  form.appendChild(err);
  form.appendChild(submit);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.hidden = true;
    err.textContent = "";
    const password = input.value.trim();
    if (!password) {
      err.textContent = "Please enter your password.";
      err.hidden = false;
      return;
    }
    submit.disabled = true;
    try {
      const res = await fetch(VERIFY_FN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        err.textContent = data.error || `Could not sign in (${res.status}).`;
        err.hidden = false;
        return;
      }
      if (!data.ok) {
        err.textContent = "Wrong password. Try again.";
        err.hidden = false;
        return;
      }
      setSessionPassword(password);
      setStudioUnlocked();
      onUnlocked();
    } catch {
      err.textContent =
        "Cannot reach the server. Use your live Netlify URL, or from the repo root run `npx netlify dev` and open the site it prints.";
      err.hidden = false;
    } finally {
      submit.disabled = false;
    }
  });

  panel.appendChild(form);
  wrap.appendChild(panel);
  root.appendChild(wrap);
  document.title = "Sign in — Stillwater Creator";
  input.focus();
}
