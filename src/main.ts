import './registerServiceWorker';
import 'vue-draggable-resizable/dist/VueDraggableResizable.css';

import { createApp } from 'vue';

import { AudioService } from '@/services/audio/AudioService';
import { PlaybackService } from '@/services/audio/PlaybackService';

import App from './App.vue';
import ObserveVisibility from './directives/observeVisibility';
import { initalizeBrowserIpcListeners } from './ipc/browserIpcListeners';
import { initializeIpcListeners } from './ipc/ipcListeners';
import router from './router';
import { isElectron } from './utils/isElectron';

if (isElectron()) {
  initializeIpcListeners();
} else {
  initalizeBrowserIpcListeners();
}

const app = createApp(App);
app.directive('observe-visibility', ObserveVisibility);
app.provide('audioService', new AudioService());
app.provide('playbackService', new PlaybackService());
app.use(router);
app.mount('#app');
