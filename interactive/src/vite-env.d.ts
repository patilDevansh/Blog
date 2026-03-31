/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Web3Forms access key (configure the inbox at web3forms.com—never put your raw email in the repo). */
  readonly VITE_WEB3FORMS_ACCESS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
