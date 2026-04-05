import './registerServiceWorker';

import { CkeditorPlugin } from '@ckeditor/ckeditor5-vue';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Pseudo from 'i18next-pseudo';
import I18NextVue from 'i18next-vue';
import { createApp } from 'vue';
import VueObserveVisibility from 'vue3-observe-visibility';

import App from './App.vue';
import { defaultNS, resources } from './i18n';
import {
  audioServiceKey,
  ipcServiceKey,
  latexExporterKey,
  lyricServiceKey,
  musicXmlExporterKey,
  neumeKeyboardKey,
  ocrImporterKey,
  platformServiceKey,
  playbackServiceKey,
  textSearchServiceKey,
} from './injectionKeys';
import { initalizeBrowserIpcListeners } from './ipc/browserIpcListeners';
import { initializeIpcListeners } from './ipc/ipcListeners';
import router from './router';
import { AudioService } from './services/audio/AudioService';
import { PlaybackService } from './services/audio/PlaybackService';
import { LatexExporter } from './services/integration/LatexExporter';
import { MusicXmlExporter } from './services/integration/MusicXmlExporter';
import { OcrImporter } from './services/integration/OcrImporter';
import { BrowserIpcService } from './services/ipc/BrowserIpcService';
import { IpcService } from './services/ipc/IpcService';
import { LyricService } from './services/LyricService';
import { NeumeKeyboard } from './services/NeumeKeyboard';
import { BrowserPlatformService } from './services/platform/BrowserPlatformService';
import { PlatformService } from './services/platform/PlatformService';
import { TextSearchService } from './services/TextSearchService';
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
app.use(CkeditorPlugin);

if (isElectron()) {
  app.provide(ipcServiceKey, new IpcService());
  app.provide(platformServiceKey, new PlatformService());
} else {
  app.provide(ipcServiceKey, new BrowserIpcService());
  app.provide(platformServiceKey, new BrowserPlatformService());
}

app.provide(audioServiceKey, new AudioService());
app.provide(latexExporterKey, new LatexExporter());
app.provide(lyricServiceKey, new LyricService());
app.provide(musicXmlExporterKey, new MusicXmlExporter());
app.provide(neumeKeyboardKey, new NeumeKeyboard());
app.provide(ocrImporterKey, new OcrImporter());
app.provide(playbackServiceKey, new PlaybackService());
app.provide(textSearchServiceKey, new TextSearchService());

app.use(router);
app.use(I18NextVue, { i18next });
app.mount('#app');
