const baseUrl = import.meta.env.BASE_URL ?? "/";

export type ShellNav = "journal" | undefined;

export function buildShell(activeNav?: ShellNav): {
  shell: HTMLElement;
  topNav: HTMLElement;
  mainEl: HTMLElement;
  footer: HTMLElement;
} {
  const shell = document.createElement("div");
  shell.className = "sw-shell";

  const topNav = document.createElement("nav");
  topNav.className = "sw-top-nav";
  const logo = document.createElement("a");
  logo.className = "sw-logo";
  logo.href = `${baseUrl}stillwater.html`;
  logo.textContent = "Stillwater";
  const ul = document.createElement("ul");
  ul.className = "sw-nav-links";
  const topNavLinks: [string, string][] = [
    ["Home", `${baseUrl}stillwater.html`],
    ["Journal", `${baseUrl}journal.html`],
    ["About", `${baseUrl}stillwater.html`],
    ["Contact", `${baseUrl}journal.html#contact`],
  ];
  for (const [label, href] of topNavLinks) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    if (label === "Journal" && activeNav === "journal") {
      a.classList.add("sw-nav-current");
      a.setAttribute("aria-current", "page");
    }
    li.appendChild(a);
    ul.appendChild(li);
  }
  topNav.appendChild(logo);
  topNav.appendChild(ul);

  const mainEl = document.createElement("main");
  mainEl.className = "sw-main sw-main--fluid";

  const footer = document.createElement("footer");
  footer.className = "sw-footer";

  const footerBar = document.createElement("div");
  footerBar.className = "sw-footer-bar";

  const footLogo = document.createElement("div");
  footLogo.className = "footer-logo";
  footLogo.textContent = "Stillwater";
  const footerLinks = document.createElement("ul");
  footerLinks.className = "footer-links";
  const footerLinkItems: [string, string][] = [
    ["Journal", `${baseUrl}journal.html`],
    ["About", `${baseUrl}stillwater.html`],
    ["Contact", `${baseUrl}journal.html#contact`],
  ];
  for (const [label, href] of footerLinkItems) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    li.appendChild(a);
    footerLinks.appendChild(li);
  }
  const footCopy = document.createElement("div");
  footCopy.className = "footer-copy";
  footCopy.textContent =
    "© " + new Date().getFullYear() + " Stillwater. Made with intention.";

  footerBar.appendChild(footLogo);
  footerBar.appendChild(footerLinks);
  footerBar.appendChild(footCopy);

  footer.appendChild(footerBar);

  shell.appendChild(topNav);
  shell.appendChild(mainEl);
  shell.appendChild(footer);

  return { shell, topNav, mainEl, footer };
}
