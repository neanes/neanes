import { createApp } from 'vue';
import App from './App.vue';
import { initializeIpcListeners } from './ipc/ipcListeners';
import { initalizeBrowserIpcListeners } from './ipc/browserIpcListeners';
import { AudioService } from '@/services/audio/AudioService';
import { PlaybackService } from '@/services/audio/PlaybackService';
import router from './router';
import ObserveVisibility from './directives/observeVisibility';
import 'vue-draggable-resizable/dist/VueDraggableResizable.css';
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
