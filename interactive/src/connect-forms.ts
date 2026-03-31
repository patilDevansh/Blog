const WEB3FORMS_URL = "https://api.web3forms.com/submit";

function web3AccessKey(): string {
  const raw = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  return typeof raw === "string" ? raw.trim() : "";
}

async function postToWeb3Forms(payload: Record<string, unknown>): Promise<{
  ok: boolean;
  message?: string;
}> {
  try {
    const res = await fetch(WEB3FORMS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { success?: boolean; message?: string };
    if (!res.ok || !data.success) {
      return { ok: false, message: data.message };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "network" };
  }
}

export function buildConnectSection(): HTMLElement {
  const section = document.createElement("section");
  section.className = "sw-connect";
  section.id = "contact";

  const inner = document.createElement("div");
  inner.className = "sw-connect-inner";

  const head = document.createElement("div");
  head.className = "sw-connect-header";
  const headEyebrow = document.createElement("p");
  headEyebrow.className = "eyebrow";
  headEyebrow.textContent = "Connect";
  const headTitle = document.createElement("h2");
  headTitle.className = "sw-connect-title";
  headTitle.textContent = "Offer your words to the writer";
  const headIntro = document.createElement("p");
  headIntro.className = "sw-connect-intro";
  headIntro.textContent =
    "Leave a note from your own reflection, or ask to hear when something new goes live.";
  head.append(headEyebrow, headTitle, headIntro);

  const grid = document.createElement("div");
  grid.className = "sw-connect-grid";

  const msgPanel = document.createElement("div");
  msgPanel.className = "sw-connect-panel";
  const msgH = document.createElement("h3");
  msgH.className = "sw-connect-panel-title";
  msgH.textContent = "Send a message";
  const msgIntro = document.createElement("p");
  msgIntro.className = "sw-connect-panel-intro";
  msgIntro.textContent =
    "Questions, gratitude, a line that stayed with you—whatever belongs in this quiet exchange.";

  const msgForm = document.createElement("form");
  msgForm.className = "sw-connect-message-form sw-contact-form";

  const nameLabel = document.createElement("label");
  nameLabel.className = "sw-contact-field";
  const nameText = document.createElement("span");
  nameText.className = "sw-contact-label-text";
  nameText.textContent = "Name";
  const nameInput = document.createElement("input");
  nameInput.name = "name";
  nameInput.type = "text";
  nameInput.autocomplete = "name";
  nameLabel.append(nameText, nameInput);

  const emailLabel = document.createElement("label");
  emailLabel.className = "sw-contact-field";
  const emailText = document.createElement("span");
  emailText.className = "sw-contact-label-text";
  emailText.textContent = "Your email";
  const emailInput = document.createElement("input");
  emailInput.name = "email";
  emailInput.type = "email";
  emailInput.required = true;
  emailInput.autocomplete = "email";
  emailLabel.append(emailText, emailInput);

  const msgLabel = document.createElement("label");
  msgLabel.className = "sw-contact-field sw-contact-field--message";
  const msgText = document.createElement("span");
  msgText.className = "sw-contact-label-text";
  msgText.textContent = "Message";
  const textarea = document.createElement("textarea");
  textarea.name = "message";
  textarea.required = true;
  textarea.rows = 5;
  msgLabel.append(msgText, textarea);

  const msgSubmit = document.createElement("button");
  msgSubmit.type = "submit";
  msgSubmit.className = "sw-contact-submit";
  msgSubmit.textContent = "Send message";

  const msgStatus = document.createElement("p");
  msgStatus.className = "sw-connect-message-status sw-contact-status";
  msgStatus.setAttribute("role", "status");
  msgStatus.setAttribute("aria-live", "polite");

  msgForm.append(nameLabel, emailLabel, msgLabel, msgSubmit);
  msgPanel.append(msgH, msgIntro, msgForm, msgStatus);

  const subPanel = document.createElement("div");
  subPanel.className = "sw-connect-panel";
  const subH = document.createElement("h3");
  subH.className = "sw-connect-panel-title";
  subH.textContent = "New writing by email";
  const subIntro = document.createElement("p");
  subIntro.className = "sw-connect-panel-intro";
  subIntro.textContent =
    "When a reflection is published here, you’ll get a single note—no promotions, no filler.";

  const subForm = document.createElement("form");
  subForm.className = "sw-connect-subscribe-form sw-contact-form";

  const subEmailWrap = document.createElement("label");
  subEmailWrap.className = "sw-contact-field";
  const subEmailText = document.createElement("span");
  subEmailText.className = "sw-contact-label-text";
  subEmailText.textContent = "Email address";
  const subEmailInput = document.createElement("input");
  subEmailInput.name = "email";
  subEmailInput.type = "email";
  subEmailInput.required = true;
  subEmailInput.autocomplete = "email";
  subEmailInput.placeholder = "your@email.com";
  subEmailWrap.append(subEmailText, subEmailInput);

  const subSubmit = document.createElement("button");
  subSubmit.type = "submit";
  subSubmit.className = "sw-contact-submit";
  subSubmit.textContent = "Subscribe";

  const subNote = document.createElement("p");
  subNote.className = "sw-connect-footnote";
  subNote.textContent =
    "Signups go on the new-post list only. Unsubscribe anytime from those emails.";

  const subStatus = document.createElement("p");
  subStatus.className = "sw-connect-subscribe-status sw-contact-status";
  subStatus.setAttribute("role", "status");
  subStatus.setAttribute("aria-live", "polite");

  subForm.append(subEmailWrap, subSubmit);
  subPanel.append(subH, subIntro, subForm, subStatus, subNote);

  grid.append(msgPanel, subPanel);
  inner.append(head, grid);
  section.appendChild(inner);
  return section;
}

export function wireConnectForms(section: HTMLElement): void {
  const key = web3AccessKey();
  const msgForm = section.querySelector<HTMLFormElement>(".sw-connect-message-form");
  const msgStatus = section.querySelector<HTMLElement>(".sw-connect-message-status");
  const msgSubmit = msgForm?.querySelector<HTMLButtonElement>('button[type="submit"]');

  const subForm = section.querySelector<HTMLFormElement>(".sw-connect-subscribe-form");
  const subStatus = section.querySelector<HTMLElement>(".sw-connect-subscribe-status");
  const subSubmit = subForm?.querySelector<HTMLButtonElement>('button[type="submit"]');

  const missingMsg =
    "Forms need VITE_WEB3FORMS_ACCESS_KEY. Add it for local builds and hosting.";

  if (!key) {
    msgSubmit?.setAttribute("disabled", "");
    subSubmit?.setAttribute("disabled", "");
    if (msgStatus) {
      msgStatus.textContent = missingMsg;
      msgStatus.classList.add("sw-contact-status--warn");
    }
    if (subStatus) {
      subStatus.textContent = missingMsg;
      subStatus.classList.add("sw-contact-status--warn");
    }
    return;
  }

  if (msgForm && msgStatus && msgSubmit) {
    msgForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const fd = new FormData(msgForm);
      const name = String(fd.get("name") ?? "").trim();
      const email = String(fd.get("email") ?? "").trim();
      const message = String(fd.get("message") ?? "").trim();

      if (!email || !message) {
        msgStatus.textContent = "Please enter your email and a message.";
        msgStatus.classList.remove(
          "sw-contact-status--ok",
          "sw-contact-status--err",
        );
        return;
      }

      msgSubmit.disabled = true;
      msgStatus.textContent = "Sending…";
      msgStatus.classList.remove(
        "sw-contact-status--ok",
        "sw-contact-status--err",
        "sw-contact-status--warn",
      );

      const { ok, message: err } = await postToWeb3Forms({
        access_key: key,
        subject: "Stillwater — message from a reader",
        name: name || "(no name)",
        email,
        message,
      });

      if (ok) {
        msgStatus.textContent = "Thank you. Your note is on its way.";
        msgStatus.classList.add("sw-contact-status--ok");
        msgForm.reset();
      } else {
        msgStatus.textContent =
          err && err !== "network"
            ? `Could not send: ${err}`
            : "Something went wrong. Please try again later.";
        msgStatus.classList.add("sw-contact-status--err");
      }
      msgSubmit.disabled = false;
    });
  }

  if (subForm && subStatus && subSubmit) {
    subForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const fd = new FormData(subForm);
      const email = String(fd.get("email") ?? "").trim();
      if (!email) {
        subStatus.textContent = "Please enter your email.";
        subStatus.classList.remove(
          "sw-contact-status--ok",
          "sw-contact-status--err",
        );
        return;
      }

      subSubmit.disabled = true;
      subStatus.textContent = "Sending…";
      subStatus.classList.remove(
        "sw-contact-status--ok",
        "sw-contact-status--err",
        "sw-contact-status--warn",
      );

      const { ok, message: err } = await postToWeb3Forms({
        access_key: key,
        subject: "Stillwater — new subscriber (new posts list)",
        name: "Newsletter / new posts",
        email,
        message: `This reader asked to be notified by email when new Stillwater journal posts are published.\nSubscriber email: ${email}`,
      });

      if (ok) {
        subStatus.textContent =
          "You’re on the list. Watch your inbox when the next piece goes live.";
        subStatus.classList.add("sw-contact-status--ok");
        subForm.reset();
      } else {
        subStatus.textContent =
          err && err !== "network"
            ? `Could not subscribe: ${err}`
            : "Something went wrong. Please try again later.";
        subStatus.classList.add("sw-contact-status--err");
      }
      subSubmit.disabled = false;
    });
  }
}
