import { el, clearChildren } from "../ui";

const ITEMS: { src: string; name: string; size: string; tag: string }[] = [
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/5/54/Palmleaf_Manuscript.jpg",
    name: "palm-leaf-manuscript.jpg",
    size: "1.1 MB",
    tag: "Manuscript",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Lahiri_Mahasaya.jpg/640px-Lahiri_Mahasaya.jpg",
    name: "lahiri-mahasaya.jpg",
    size: "0.8 MB",
    tag: "Sage portrait",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Gorakshanath.jpg/640px-Gorakshanath.jpg",
    name: "gorakshanath.jpg",
    size: "1.2 MB",
    tag: "Sage portrait",
  },
];

export function renderMediaLibrary(container: HTMLElement): void {
  clearChildren(container);

  const head = el("div", "cr-page-header");
  head.appendChild(el("h1", "cr-dash-title cr-page-header__title", "Media Library"));
  const actions = el("div", "cr-page-actions");
  const filt = el("button", "cr-btn cr-btn--ghost cr-btn--sm", "Filter: Sage portraits") as HTMLButtonElement;
  filt.type = "button";
  const up = el("button", "cr-btn cr-btn--primary cr-btn--sm", "Upload image") as HTMLButtonElement;
  up.type = "button";
  up.addEventListener("click", () => {
    globalThis.alert("Wire Netlify Blob or S3 to enable uploads; this screen is the studio layout.");
  });
  actions.appendChild(filt);
  actions.appendChild(up);
  head.appendChild(actions);

  container.appendChild(head);
  container.appendChild(
    el(
      "p",
      "cr-muted cr-page-lede",
      "Hero images, thangkas, and sage portraits. Tag an image as “Sage portrait” to surface it in the post editor picker."
    )
  );

  const grid = el("div", "cr-media-grid");
  const uploadCell = el("button", "cr-media-upload", "+ Upload") as HTMLButtonElement;
  uploadCell.type = "button";
  uploadCell.addEventListener("click", () => {
    globalThis.alert("Uploads require a storage backend.");
  });
  grid.appendChild(uploadCell);

  for (const it of ITEMS) {
    const cell = el("div", "cr-media-item");
    const imgWrap = el("div", "cr-media-item__img");
    const img = el("img", "") as HTMLImageElement;
    img.src = it.src;
    img.alt = "";
    img.loading = "lazy";
    imgWrap.appendChild(img);
    const info = el("div", "cr-media-item__info");
    info.appendChild(el("div", "cr-media-item__name", it.name));
    const meta = el("div", "cr-media-item__meta", `${it.size} · `);
    const tag = el("span", "cr-media-item__tag", it.tag);
    meta.appendChild(tag);
    info.appendChild(meta);
    cell.appendChild(imgWrap);
    cell.appendChild(info);
    grid.appendChild(cell);
  }

  container.appendChild(grid);
}
