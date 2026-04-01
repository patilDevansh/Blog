import { safeParseManifest } from "@schema/manifest";
import { el } from "../ui";
import {
  getSessionPassword,
  saveLocalDraft,
  setSessionPassword,
} from "../storage";

const COMPILE_FN =
  import.meta.env.VITE_COMPILE_FUNCTION_URL || "/.netlify/functions/compile-blog";

const PUBLISH_FN =
  import.meta.env.VITE_PUBLISH_MANIFEST_URL ||
  "/.netlify/functions/publish-manifest";

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "post"
  );
}

export function renderCompose(
  container: HTMLElement,
  opts: {
    consumeImportJson: () => string | null;
  }
): void {
  container.replaceChildren();

  const head = el("div", "cr-view-head");
  head.appendChild(el("p", "cr-eyebrow", "Write"));
  const headRow = el("div", "cr-view-head__row");
  headRow.appendChild(el("h1", "cr-view-title", "Post Editor"));
  head.appendChild(headRow);
  head.appendChild(
    el(
      "p",
      "cr-view-lede",
      "Compose in plain text; Generate turns it into a full manifest with layout and imagery. Publish sends it to your database or GitHub."
    )
  );

  const note = el("div", "cr-callout cr-callout--compact cr-callout--editor");
  note.innerHTML =
    "<strong>Behind the scenes:</strong> “Generate” uses AI to build your post. " +
    "<strong>Publish to live site</strong> saves to Postgres when <code>DATABASE_URL</code> is set, otherwise to GitHub. " +
    "Set <code>CREATOR_PASSWORD</code>, and either <code>DATABASE_URL</code> (recommended) or <code>GITHUB_TOKEN</code> + <code>GITHUB_REPO</code>, plus <code>OPENAI_API_KEY</code> for AI generation.";

  const rememberRow = el("div", "cr-field-row");
  const remember = el(
    "label",
    "cr-check-label"
  ) as HTMLLabelElement;
  const rememberIn = el("input") as HTMLInputElement;
  rememberIn.type = "checkbox";
  rememberIn.id = "cr-remember-pw";
  const remembered = getSessionPassword();
  if (remembered) rememberIn.checked = true;
  remember.appendChild(rememberIn);
  remember.appendChild(
    document.createTextNode("Remember password for this browser session")
  );

  const pwField = el("div", "creator-field");
  pwField.appendChild(el("label", "", "Creator password"));
  const password = el("input") as HTMLInputElement;
  password.type = "password";
  password.autocomplete = "current-password";
  password.placeholder = "Same as CREATOR_PASSWORD on Netlify";
  if (remembered) password.value = remembered;
  pwField.appendChild(password);

  rememberRow.appendChild(remember);
  rememberRow.appendChild(pwField);

  const titleField = el("div", "creator-field");
  titleField.appendChild(el("label", "", "Post title"));
  const titleIn = el("input") as HTMLInputElement;
  titleIn.placeholder = "Returning to the breath";
  titleField.appendChild(titleIn);

  const slugField = el("div", "creator-field");
  slugField.appendChild(el("label", "", "Slug (optional)"));
  const slugIn = el("input") as HTMLInputElement;
  slugIn.placeholder = "auto from title if empty";
  titleIn.addEventListener("blur", () => {
    if (!slugIn.value.trim() && titleIn.value.trim()) {
      slugIn.value = slugify(titleIn.value);
    }
  });
  slugField.appendChild(slugIn);

  const catField = el("div", "creator-field");
  catField.appendChild(el("label", "", "Category (optional)"));
  const catIn = el("input") as HTMLInputElement;
  catIn.placeholder = "Presence";
  catField.appendChild(catIn);

  const rtField = el("div", "creator-field");
  rtField.appendChild(el("label", "", "Read time minutes (optional)"));
  const rtIn = el("input") as HTMLInputElement;
  rtIn.type = "number";
  rtIn.min = "1";
  rtIn.placeholder = "e.g. 6";
  rtField.appendChild(rtIn);

  const draftField = el("div", "creator-field cr-compose-draft-wrap");
  draftField.appendChild(el("label", "", "Draft (English)"));
  const draft = el("textarea") as HTMLTextAreaElement;
  draft.placeholder = "Full blog text…";
  draft.className = "cr-compose-draft";
  draft.rows = 20;
  draftField.appendChild(draft);

  const err = el("p", "creator-error");
  err.hidden = true;

  const valOk = el("p", "cr-validate-ok");
  valOk.hidden = true;

  const gen = el("button", "", "Generate my post") as HTMLButtonElement;
  gen.type = "button";
  const validateBtn = el("button", "", "Validate JSON") as HTMLButtonElement;
  validateBtn.type = "button";
  const copyBtn = el("button", "", "Copy JSON") as HTMLButtonElement;
  copyBtn.type = "button";
  copyBtn.disabled = true;
  const dlBtn = el(
    "button",
    "",
    "Download manifest.json"
  ) as HTMLButtonElement;
  dlBtn.type = "button";
  dlBtn.disabled = true;
  const saveDraftBtn = el(
    "button",
    "",
    "Save draft on this device"
  ) as HTMLButtonElement;
  saveDraftBtn.type = "button";
  saveDraftBtn.disabled = true;
  const publishBtn = el(
    "button",
    "",
    "Publish to live site"
  ) as HTMLButtonElement;
  publishBtn.type = "button";
  publishBtn.disabled = true;
  publishBtn.title =
    "Saves this post to your database or GitHub (see settings).";

  validateBtn.classList.add("cr-btn", "cr-btn--ghost", "cr-btn--sm", "cr-btn--block");
  copyBtn.classList.add("cr-btn", "cr-btn--ghost", "cr-btn--sm", "cr-btn--block");
  dlBtn.classList.add("cr-btn", "cr-btn--ghost", "cr-btn--sm", "cr-btn--block");
  saveDraftBtn.classList.add("cr-btn", "cr-btn--secondary", "cr-btn--sm", "cr-btn--block");

  const publishHelp = el("p", "cr-publish-hint");
  publishHelp.innerHTML =
    "After <strong>Generate my post</strong>, use <strong>Publish to live site</strong> — wait ~1–2 minutes, then refresh your journal. If publishing is not set up yet, you can still use <strong>Copy JSON</strong> for a developer.";

  const outField = el("div", "creator-field");
  outField.appendChild(el("label", "", "Technical: raw post data (JSON)"));
  const out = el("textarea") as HTMLTextAreaElement;
  out.id = "out-json";
  out.readOnly = false;
  out.placeholder =
    "Your post appears here after Generate. You don’t need to edit this unless you know JSON.";
  outField.appendChild(out);

  const advanced = el("details", "cr-advanced");
  advanced.appendChild(
    el(
      "summary",
      "cr-advanced-summary",
      "Advanced — show raw JSON"
    )
  );
  advanced.appendChild(outField);

  const foot = el("div", "creator-footer");
  foot.innerHTML = `Problems publishing? Check Netlify <code>DATABASE_URL</code> or GitHub env vars. · <a href="./creator.html">Reload</a>`;

  const imported = opts.consumeImportJson();
  if (imported) {
    out.value = imported;
    saveDraftBtn.disabled = false;
    copyBtn.disabled = false;
    dlBtn.disabled = false;
    try {
      const m = JSON.parse(imported) as { title?: string; slug?: string };
      if (m.title) titleIn.value = m.title;
      if (m.slug) slugIn.value = m.slug;
    } catch {
      /* ignore */
    }
  }

  let lastBlob: string | null = out.value.trim() || null;

  function syncLastBlob(): void {
    const t = out.value.trim();
    lastBlob = t || null;
    const has = Boolean(lastBlob);
    copyBtn.disabled = !has;
    dlBtn.disabled = !has;
    saveDraftBtn.disabled = !has;
    publishBtn.disabled = !has;
  }

  out.addEventListener("input", () => {
    valOk.hidden = true;
    syncLastBlob();
  });

  validateBtn.addEventListener("click", () => {
    err.hidden = true;
    valOk.hidden = true;
    const raw = out.value.trim();
    if (!raw) {
      err.textContent = "Paste or generate JSON first.";
      err.hidden = false;
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      err.textContent =
        e instanceof Error ? e.message : "Invalid JSON.";
      err.hidden = false;
      return;
    }
    const res = safeParseManifest(parsed);
    if (!res.success) {
      const msg = res.error.errors.map((x) => x.message).join("; ");
      err.textContent = msg || "Manifest invalid.";
      err.hidden = false;
      return;
    }
    valOk.textContent =
      "Post looks valid. You can publish to your live site, or save a draft on this device.";
    valOk.hidden = false;
  });

  gen.addEventListener("click", async () => {
    err.hidden = true;
    valOk.hidden = true;
    out.value = "";
    syncLastBlob();

    const pwVal = password.value || getSessionPassword() || "";
    if (!pwVal) {
      err.textContent = "Enter the creator password.";
      err.hidden = false;
      return;
    }
    if (!titleIn.value.trim()) {
      err.textContent = "Enter a title.";
      err.hidden = false;
      return;
    }
    if (draft.value.trim().length < 20) {
      err.textContent = "Draft should be at least 20 characters.";
      err.hidden = false;
      return;
    }

    gen.disabled = true;
    try {
      const body: Record<string, unknown> = {
        password: pwVal,
        title: titleIn.value.trim(),
        draft: draft.value.trim(),
      };
      const s = slugIn.value.trim();
      if (s) body.slug = s;
      const c = catIn.value.trim();
      if (c) body.category = c;
      const rt = rtIn.value.trim();
      if (rt) body.readTimeMinutes = Number(rt);

      const res = await fetch(COMPILE_FN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { manifest?: unknown; error?: string };

      if (!res.ok) {
        err.textContent = data.error || `HTTP ${res.status}`;
        err.hidden = false;
        return;
      }

      if (!data.manifest) {
        err.textContent = "No manifest in response";
        err.hidden = false;
        return;
      }

      lastBlob = JSON.stringify(data.manifest, null, 2);
      out.value = lastBlob;
      syncLastBlob();

      if (rememberIn.checked) {
        setSessionPassword(pwVal);
      }
    } catch (e) {
      err.textContent =
        e instanceof Error
          ? e.message
          : "Request failed. Use Netlify production or run netlify dev.";
      err.hidden = false;
    } finally {
      gen.disabled = false;
    }
  });

  copyBtn.addEventListener("click", async () => {
    if (!lastBlob) return;
    await navigator.clipboard.writeText(lastBlob);
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy JSON";
    }, 2000);
  });

  dlBtn.addEventListener("click", () => {
    if (!lastBlob) return;
    let slug = slugIn.value.trim() || slugify(titleIn.value);
    try {
      const m = JSON.parse(lastBlob) as { slug?: string };
      if (m.slug) slug = m.slug;
    } catch {
      /* ignore */
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([lastBlob], { type: "application/json" })
    );
    a.download = `manifest-${slug}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  publishBtn.addEventListener("click", async () => {
    err.hidden = true;
    valOk.hidden = true;
    if (!lastBlob) {
      err.textContent = "Generate your post first.";
      err.hidden = false;
      return;
    }
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(lastBlob);
    } catch {
      err.textContent = "This post data is broken. Try Generate again.";
      err.hidden = false;
      return;
    }
    const parsed = safeParseManifest(parsedJson);
    if (!parsed.success) {
      err.textContent =
        "This post isn’t ready to publish. Click Validate or Generate again.";
      err.hidden = false;
      return;
    }
    const pwVal = password.value || getSessionPassword() || "";
    if (!pwVal) {
      err.textContent = "Enter your creator password above.";
      err.hidden = false;
      return;
    }
    publishBtn.disabled = true;
    try {
      const res = await fetch(PUBLISH_FN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: pwVal,
          manifest: parsed.data,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        commitUrl?: string;
        slug?: string;
        source?: string;
      };
      if (!res.ok) {
        err.textContent =
          data.error || `Could not publish (${res.status}).`;
        err.hidden = false;
        return;
      }
      valOk.replaceChildren();
      const liveMsg =
        data.source === "database"
          ? `Published “${parsed.data.slug}” to the database. Open the journal to view it now. `
          : `Published “${parsed.data.slug}”. Your site should update in a minute or two. `;
      valOk.appendChild(document.createTextNode(liveMsg));
      if (data.commitUrl) {
        const a = el(
          "a",
          "cr-validate-ok-link",
          "See the save on GitHub"
        ) as HTMLAnchorElement;
        a.href = data.commitUrl;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        valOk.appendChild(a);
      }
      valOk.hidden = false;
    } catch (e) {
      err.textContent =
        e instanceof Error
          ? e.message
          : "Could not reach the publish service.";
      err.hidden = false;
    } finally {
      publishBtn.disabled = !lastBlob;
    }
  });

  saveDraftBtn.addEventListener("click", () => {
    if (!lastBlob) return;
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(lastBlob);
    } catch {
      err.textContent = "Invalid JSON.";
      err.hidden = false;
      return;
    }
    const parsed = safeParseManifest(parsedJson);
    if (!parsed.success) {
      err.textContent = "Fix JSON before saving (use Validate).";
      err.hidden = false;
      return;
    }
    const slug = parsed.data.slug;
    saveLocalDraft(slug, {
      json: lastBlob,
      updatedAt: new Date().toISOString(),
      title: parsed.data.title,
    });
    valOk.textContent = `Draft saved for “${slug}” in this browser.`;
    valOk.hidden = false;
  });

  gen.classList.add("cr-btn", "cr-btn--secondary", "cr-btn--lg");
  publishBtn.classList.add("cr-btn", "cr-btn--primary", "cr-btn--lg");

  const modes = el("div", "cr-editor-modes");
  ["Default", "Focus", "Outline", "Preview"].forEach((label, i) => {
    const b = el("button", "cr-editor-mode", label) as HTMLButtonElement;
    b.type = "button";
    if (i === 0) b.classList.add("is-active");
    b.addEventListener("click", () => {
      modes.querySelectorAll(".cr-editor-mode").forEach((x) => {
        x.classList.remove("is-active");
      });
      b.classList.add("is-active");
      if (label === "Focus") draft.classList.add("cr-compose-draft--focus");
      else draft.classList.remove("cr-compose-draft--focus");
    });
    modes.appendChild(b);
  });

  const tb = el("div", "cr-editor-toolbar-mock");
  ["B", "I", "U", "H2", "H3", "❦", "Quote", "—", "IAST", "¹"].forEach((t) => {
    const b = el("button", "cr-editor-tool", t) as HTMLButtonElement;
    b.type = "button";
    b.disabled = true;
    b.title = "Reserved for a future rich-text surface";
    tb.appendChild(b);
  });

  const primaryBar = el("div", "cr-compose-primary");
  primaryBar.appendChild(gen);
  primaryBar.appendChild(publishBtn);

  const railSession = el("div", "cr-rail-panel");
  railSession.appendChild(el("div", "cr-rail-panel-head", "Session & password"));
  railSession.appendChild(rememberRow);

  const railTools = el("div", "cr-rail-panel");
  railTools.appendChild(el("div", "cr-rail-panel-head", "Manifest tools"));
  const toolStack = el("div", "cr-rail-buttons");
  toolStack.appendChild(validateBtn);
  toolStack.appendChild(copyBtn);
  toolStack.appendChild(dlBtn);
  toolStack.appendChild(saveDraftBtn);
  railTools.appendChild(toolStack);

  const rail = el("div", "cr-compose-rail");
  rail.appendChild(railSession);
  rail.appendChild(railTools);

  const metaRow = el("div", "cr-compose-fields");
  metaRow.appendChild(catField);
  metaRow.appendChild(rtField);

  const main = el("div", "cr-compose-main");
  main.appendChild(note);
  main.appendChild(modes);
  main.appendChild(tb);
  main.appendChild(titleField);
  main.appendChild(slugField);
  main.appendChild(metaRow);
  main.appendChild(draftField);
  main.appendChild(err);
  main.appendChild(valOk);
  main.appendChild(primaryBar);
  main.appendChild(publishHelp);
  main.appendChild(advanced);
  main.appendChild(foot);

  const shell = el("div", "cr-compose-shell");
  shell.appendChild(main);
  shell.appendChild(rail);

  container.appendChild(head);
  container.appendChild(shell);
}
