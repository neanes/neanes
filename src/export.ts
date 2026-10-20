import './assets/main.css';
import './assets/app.css';

import { createApp } from 'vue';

import ExportRenderer from '@/components/ExportRenderer.vue';
import { initializeI18n } from '@/i18n';
import { IpcMainChannels, IpcRendererChannels } from '@/ipc/ipcChannels';
import type { SnapshotRenderRequest } from '@/services/rendering/scoreRenderSnapshot';

// This entry never imports the editor, router, recovery, or service worker.
window.ipcRenderer.on(
  IpcMainChannels.ExportRendererSnapshot,
  async ({ snapshot, png }: SnapshotRenderRequest) => {
    const fail = (error: unknown) =>
      window.ipcRenderer.send(IpcRendererChannels.ExportRendererResult, {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      });
    try {
      await initializeI18n({ lng: snapshot.editorLanguage });
      const app = createApp(ExportRenderer, { snapshot, png });
      app.config.errorHandler = fail;
      app.mount('#app');
    } catch (error) {
      fail(error);
    }
  },
);
window.ipcRenderer.send(IpcRendererChannels.ExportRendererReady);
