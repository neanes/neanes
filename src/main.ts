import Vue from 'vue';
import App from './App.vue';
import { initializeIpcListeners } from './ipc/ipcListeners';
import router from './router';

Vue.config.productionTip = false;

if (process.env.IS_ELECTRON) {
  initializeIpcListeners();
}

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
