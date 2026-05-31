import { inject } from 'vue';

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

export function useEditorServices() {
  return {
    audioService: inject(audioServiceKey, new AudioService()),
    ipcService: inject(ipcServiceKey, new IpcService()),
    latexExporter: inject(latexExporterKey, new LatexExporter()),
    lyricService: inject(lyricServiceKey, new LyricService()),
    musicXmlExporter: inject(musicXmlExporterKey, new MusicXmlExporter()),
    neumeKeyboard: inject(neumeKeyboardKey, new NeumeKeyboard()),
    ocrImporter: inject(ocrImporterKey, new OcrImporter()),
    platformService: inject(platformServiceKey, new PlatformService()),
    playbackService: inject(playbackServiceKey, new PlaybackService()),
    textSearchService: inject(textSearchServiceKey, new TextSearchService()),
  };
}
