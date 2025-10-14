import { InjectionKey } from 'vue';

import { AudioService } from './services/audio/AudioService';
import { PlaybackService } from './services/audio/PlaybackService';
import { LatexExporter } from './services/integration/LatexExporter';
import { MusicXmlExporter } from './services/integration/MusicXmlExporter';
import { IIpcService } from './services/ipc/IIpcService';
import { LyricService } from './services/LyricService';
import { NeumeKeyboard } from './services/NeumeKeyboard';
import { IPlatformService } from './services/platform/IPlatformService';
import { TextSearchService } from './services/TextSearchService';

export const audioServiceKey: InjectionKey<AudioService> = Symbol();
export const latexExporterKey: InjectionKey<LatexExporter> = Symbol();
export const lyricServiceKey: InjectionKey<LyricService> = Symbol();
export const musicXmlExporterKey: InjectionKey<MusicXmlExporter> = Symbol();
export const neumeKeyboardKey: InjectionKey<NeumeKeyboard> = Symbol();
export const platformServiceKey: InjectionKey<IPlatformService> = Symbol();
export const playbackServiceKey: InjectionKey<PlaybackService> = Symbol();
export const textSearchServiceKey: InjectionKey<TextSearchService> = Symbol();
export const ipcServiceKey: InjectionKey<IIpcService> = Symbol();
