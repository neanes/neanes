import './assets/main.css';
import './assets/app.css';

import { createApp } from 'vue';

import AutomationRenderer from '@/automation/components/AutomationRenderer.vue';

import { initializeI18n } from './i18n';
import { initializeIpcListeners } from './ipc/ipcListeners';
initializeIpcListeners();
await initializeI18n({ lng: 'en' });
createApp(AutomationRenderer).mount('#app');
