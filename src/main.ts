import './registerServiceWorker';
import 'vue-draggable-resizable/dist/VueDraggableResizable.css';

import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import I18NextVue from 'i18next-vue';
import { createApp } from 'vue';

import { AudioService } from '@/services/audio/AudioService';
import { PlaybackService } from '@/services/audio/PlaybackService';

import App from './App.vue';
import ObserveVisibility from './directives/observeVisibility';
import resources from './i18n';
import { initalizeBrowserIpcListeners } from './ipc/browserIpcListeners';
import { initializeIpcListeners } from './ipc/ipcListeners';
import router from './router';
import { isElectron } from './utils/isElectron';

if (isElectron()) {
  initializeIpcListeners();
} else {
  initalizeBrowserIpcListeners();
}

i18next.use(LanguageDetector).init({
  detection: {
    order: ['querystring', 'navigator'],
  },
  fallbackLng: 'en',
  resources,
});

const app = createApp(App);
app.directive('observe-visibility', ObserveVisibility);
app.provide('audioService', new AudioService());
app.provide('playbackService', new PlaybackService());
app.use(router);
app.use(I18NextVue, { i18next });
app.mount('#app');
