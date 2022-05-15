import Vue from 'vue';
import App from './App.vue';
import { EventBus } from './eventBus';
import { IpcMainChannels } from './ipc/ipcChannels';
import { initializeIpcListeners } from './ipc/ipcListeners';
import { initalizeBrowserIpcListeners } from './ipc/browserIpcListeners';
import router from './router';

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
