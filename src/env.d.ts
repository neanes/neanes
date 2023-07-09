/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TITLE: string;
  readonly VITE_GUIDE_URL: string;
  readonly VITE_ISSUES_URL: string;
  readonly VITE_DOWNLOAD_URL: string;
  readonly VITE_BYZHTML_VERSION: string;
  readonly VITE_IS_ELECTRON: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
