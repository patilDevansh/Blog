import "./creator.css";

const FN =
  import.meta.env.VITE_COMPILE_FUNCTION_URL ||
  "/.netlify/functions/compile-blog";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "post";
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}

function mount(): void {
  const root = document.getElementById("creator-app");
  if (!root) return;

  const wrap = el("div", "creator-wrap");
  wrap.appendChild(el("h1", "", "Creator"));
  wrap.appendChild(
    el(
      "p",
      "creator-lede",
      "Paste your English draft. The server turns it into manifest JSON (tiles, interactions, theme). Not indexed by search engines."
    )
  );

  const note = el("p", "creator-note");
  note.innerHTML =
    "<strong>Deploy:</strong> set <code>CREATOR_PASSWORD</code> and <code>OPENAI_API_KEY</code> in Netlify. " +
    "Locally, run <code>npx netlify dev</code> from the repo root so <code>/.netlify/functions/compile-blog</code> runs. " +
    "Plain <code>npm run dev</code> cannot call the function unless you proxy it.";

  const pwField = el("div", "creator-field");
  pwField.appendChild(el("label", "", "Creator password"));
  const password = el("input") as HTMLInputElement;
  password.type = "password";
  password.autocomplete = "current-password";
  password.placeholder = "Same as CREATOR_PASSWORD on Netlify";
  pwField.appendChild(password);

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

  const draftField = el("div", "creator-field");
  draftField.appendChild(el("label", "", "Draft (English)"));
  const draft = el("textarea") as HTMLTextAreaElement;
  draft.placeholder = "Full blog text…";
  draftField.appendChild(draft);

  const err = el("p", "creator-error");
  err.hidden = true;

  const actions = el("div", "creator-actions");
  const gen = el("button", "", "Generate manifest") as HTMLButtonElement;
  gen.type = "button";
  const copyBtn = el("button", "secondary", "Copy JSON") as HTMLButtonElement;
  copyBtn.type = "button";
  copyBtn.disabled = true;
  const dlBtn = el("button", "secondary", "Download manifest.json") as HTMLButtonElement;
  dlBtn.type = "button";
  dlBtn.disabled = true;
  actions.appendChild(gen);
  actions.appendChild(copyBtn);
  actions.appendChild(dlBtn);

  const outField = el("div", "creator-field");
  outField.appendChild(el("label", "", "Output (paste into repo or validate)"));
  const out = el("textarea") as HTMLTextAreaElement;
  out.id = "out-json";
  out.readOnly = true;
  out.placeholder = "Generated JSON appears here…";
  outField.appendChild(out);

  let lastBlob: string | null = null;

  gen.addEventListener("click", async () => {
    err.hidden = true;
    err.textContent = "";
    out.value = "";
    copyBtn.disabled = true;
    dlBtn.disabled = true;
    lastBlob = null;

    if (!password.value) {
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
        password: password.value,
        title: titleIn.value.trim(),
        draft: draft.value.trim(),
      };
      const s = slugIn.value.trim();
      if (s) body.slug = s;
      const c = catIn.value.trim();
      if (c) body.category = c;
      const rt = rtIn.value.trim();
      if (rt) body.readTimeMinutes = Number(rt);

      const res = await fetch(FN, {
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
      copyBtn.disabled = false;
      dlBtn.disabled = false;
    } catch (e) {
      err.textContent =
        e instanceof Error
          ? e.message
          : "Request failed. Use Netlify production or run `npx netlify dev` from the repo root.";
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

  const foot = el("div", "creator-footer");
  foot.innerHTML = `<a href="/">← Journal</a> · <a href="/stillwater.html">Home</a> · Save JSON to <code>content/publishes/&lt;slug&gt;/manifest.json</code>, then commit and deploy.`;

  wrap.appendChild(note);
  wrap.appendChild(pwField);
  wrap.appendChild(titleField);
  wrap.appendChild(slugField);
  wrap.appendChild(catField);
  wrap.appendChild(rtField);
  wrap.appendChild(draftField);
  wrap.appendChild(err);
  wrap.appendChild(actions);
  wrap.appendChild(outField);
  wrap.appendChild(foot);

  root.appendChild(wrap);
}

mount();
