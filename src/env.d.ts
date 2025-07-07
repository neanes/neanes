/// <reference types="vite/client" />

declare const APP_VERSION: string;

interface ImportMetaEnv {
  readonly VITE_TITLE: string;
  readonly VITE_GUIDE_URL: string;
  readonly VITE_ISSUES_URL: string;
  readonly VITE_DOWNLOAD_URL: string;
  readonly VITE_BYZHTML_VERSION: string;
  readonly VITE_IS_ELECTRON: string;
  readonly VITE_PLAYBACK_SERVICE_LOGGING_ENABLED?: string;
  readonly VITE_AUDIO_SERVICE_LOGGING_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
