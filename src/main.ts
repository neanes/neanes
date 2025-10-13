import './registerServiceWorker';

import { CkeditorPlugin } from '@ckeditor/ckeditor5-vue';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Pseudo from 'i18next-pseudo';
import I18NextVue from 'i18next-vue';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import VueObserveVisibility from 'vue3-observe-visibility';

import App from './App.vue';
import { defaultNS, resources } from './i18n';
import { initalizeBrowserIpcListeners } from './ipc/browserIpcListeners';
import { initializeIpcListeners } from './ipc/ipcListeners';
import router from './router';
import { BrowserIpcService } from './services/ipc/BrowserIpcService';
import { IpcService } from './services/ipc/IpcService';
import { BrowserPlatformService } from './services/platform/BrowserPlatformService';
import { PlatformService } from './services/platform/PlatformService';
import { isElectron } from './utils/isElectron';

if (isElectron()) {
  initializeIpcListeners();
} else {
  initalizeBrowserIpcListeners();
}

i18next
  .use(LanguageDetector)
  .use(
    new Pseudo({
      enabled:
        'VITE_PSEUDOLOCALIZATION' in import.meta.env &&
        import.meta.env['VITE_PSEUDOLOCALIZATION'] === 'true',
      languageToPseudo: 'en-US',
    }),
  )
  .init({
    debug:
      'VITE_PSEUDOLOCALIZATION' in import.meta.env &&
      import.meta.env['VITE_PSEUDOLOCALIZATION'] === 'true',
    detection: {
      order: ['querystring', 'navigator'],
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    ns: Object.keys(resources['en']),
    postProcess: ['pseudo'],
    defaultNS,
    resources,
  });

const app = createApp(App);
const pinia = createPinia();
app.use(VueObserveVisibility);
app.use(CkeditorPlugin);

if (isElectron()) {
  app.provide('ipcService', new IpcService());
  app.provide('platformService', new PlatformService());
} else {
  app.provide('ipcService', new BrowserIpcService());
  app.provide('platformService', new BrowserPlatformService());
}

app.use(router);
app.use(I18NextVue, { i18next });
app.use(pinia);
app.mount('#app');
