import type { Block } from "@schema/blocks";

export function renderBlocks(blocks: Block[]): DocumentFragment {
  const frag = document.createDocumentFragment();
  for (const b of blocks) {
    frag.appendChild(renderBlock(b));
  }
  return frag;
}

function renderBlock(block: Block): HTMLElement {
  switch (block.type) {
    case "heading": {
      const tag = `h${block.level}` as "h1" | "h2" | "h3";
      const el = document.createElement(tag);
      el.className = "block-heading";
      el.textContent = block.text;
      return el;
    }
    case "paragraph": {
      const p = document.createElement("p");
      p.className = "block-paragraph";
      p.textContent = block.text;
      return p;
    }
    case "list": {
      const list = document.createElement(block.ordered ? "ol" : "ul");
      list.className = "block-list";
      for (const item of block.items) {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      }
      return list;
    }
    case "quote": {
      const q = document.createElement("blockquote");
      q.className = "block-quote";
      const inner = document.createElement("p");
      inner.textContent = block.text;
      q.appendChild(inner);
      if (block.attribution) {
        const cite = document.createElement("cite");
        cite.textContent = block.attribution;
        q.appendChild(cite);
      }
      return q;
    }
    case "code": {
      const pre = document.createElement("pre");
      pre.className = "block-code";
      const code = document.createElement("code");
      if (block.language) {
        code.className = `language-${block.language}`;
      }
      code.textContent = block.code;
      pre.appendChild(code);
      return pre;
    }
  }
}
