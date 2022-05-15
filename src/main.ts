import Vue from 'vue';
import App from './App.vue';
import { EventBus } from './eventBus';
import { IpcMainChannels } from './ipc/ipcChannels';
import { initializeIpcListeners } from './ipc/ipcListeners';
import router from './router';

Vue.config.productionTip = false;

if (process.env.IS_ELECTRON) {
  initializeIpcListeners();
} else {
  // If using the browser, then we need to hook into the beforeprint event
  // to handle printing
  window.addEventListener('beforeprint', () =>
    EventBus.$emit(IpcMainChannels.FileMenuPrint),
  );
}

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
