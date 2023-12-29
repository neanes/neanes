import './registerServiceWorker';
import 'vue-draggable-resizable/dist/VueDraggableResizable.css';

import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Pseudo from 'i18next-pseudo';
import I18NextVue from 'i18next-vue';
import { createApp } from 'vue';
import VueObserveVisibility from 'vue3-observe-visibility';

import { AudioService } from '@/services/audio/AudioService';
import { PlaybackService } from '@/services/audio/PlaybackService';

import App from './App.vue';
import { defaultNS, resources } from './i18n';
import { initalizeBrowserIpcListeners } from './ipc/browserIpcListeners';
import { initializeIpcListeners } from './ipc/ipcListeners';
import router from './router';
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
app.use(VueObserveVisibility);
app.provide('audioService', new AudioService());
app.provide('playbackService', new PlaybackService());
app.use(router);
app.use(I18NextVue, { i18next });
app.mount('#app');
