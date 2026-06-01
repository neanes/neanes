import { inject, InjectionKey } from 'vue';

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
} from '@/injectionKeys';
import { AudioService } from '@/services/audio/AudioService';
import { PlaybackService } from '@/services/audio/PlaybackService';
import { LatexExporter } from '@/services/integration/LatexExporter';
import { MusicXmlExporter } from '@/services/integration/MusicXmlExporter';
import { OcrImporter } from '@/services/integration/OcrImporter';
import { IpcService } from '@/services/ipc/IpcService';
import { LyricService } from '@/services/LyricService';
import { NeumeKeyboard } from '@/services/NeumeKeyboard';
import { PlatformService } from '@/services/platform/PlatformService';
import { TextSearchService } from '@/services/TextSearchService';

function injectOrCreate<T>(key: InjectionKey<T>, factory: () => T) {
  return inject(key, factory, true);
}

export function useEditorServices() {
  return {
    audioService: injectOrCreate(audioServiceKey, () => new AudioService()),
    ipcService: injectOrCreate(ipcServiceKey, () => new IpcService()),
    latexExporter: injectOrCreate(latexExporterKey, () => new LatexExporter()),
    lyricService: injectOrCreate(lyricServiceKey, () => new LyricService()),
    musicXmlExporter: injectOrCreate(
      musicXmlExporterKey,
      () => new MusicXmlExporter(),
    ),
    neumeKeyboard: injectOrCreate(neumeKeyboardKey, () => new NeumeKeyboard()),
    ocrImporter: injectOrCreate(ocrImporterKey, () => new OcrImporter()),
    platformService: injectOrCreate(
      platformServiceKey,
      () => new PlatformService(),
    ),
    playbackService: injectOrCreate(
      playbackServiceKey,
      () => new PlaybackService(),
    ),
    textSearchService: injectOrCreate(
      textSearchServiceKey,
      () => new TextSearchService(),
    ),
  };
}
