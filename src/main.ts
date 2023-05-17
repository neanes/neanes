import Vue from 'vue';
import App from './App.vue';
import { initializeIpcListeners } from './ipc/ipcListeners';
import { initalizeBrowserIpcListeners } from './ipc/browserIpcListeners';
import router from './router';
import './registerServiceWorker';
// @ts-ignore
import VueDraggableResizable from 'vue-draggable-resizable';
import 'vue-draggable-resizable/dist/VueDraggableResizable.css';

Vue.component('vue-draggable-resizable', VueDraggableResizable);

Vue.config.productionTip = false;

if (process.env.IS_ELECTRON) {
  initializeIpcListeners();
} else {
  initalizeBrowserIpcListeners();
}

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
