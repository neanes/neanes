import './assets/main.css';
import './assets/app.css';

import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import { createApp } from 'vue';

import ExportRenderer from '@/components/ExportRenderer.vue';
import { initializeI18n } from '@/i18n';
import { IpcMainChannels, IpcRendererChannels } from '@/ipc/ipcChannels';
import type { SnapshotRenderRequest } from '@/services/rendering/scoreRenderSnapshot';

// This entry never imports the editor, router, recovery, or service worker.
window.ipcRenderer.on(
  IpcMainChannels.ExportRendererSnapshot,
  async (request: SnapshotRenderRequest) => {
    const fail = (error: unknown) =>
      window.ipcRenderer.send(IpcRendererChannels.ExportRendererResult, {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      });
    try {
      await initializeI18n({ lng: request.snapshot.editorLanguage });
      const app = createApp(ExportRenderer, { ...request });
      app.use(I18NextVue, { i18next });
      app.config.errorHandler = fail;
      app.mount('#app');
    } catch (error) {
      fail(error);
    }
  },
);
window.ipcRenderer.send(IpcRendererChannels.ExportRendererReady);
