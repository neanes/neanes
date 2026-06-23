import { TempoElement } from './Element';
import { TempoSign } from './Neumes';

export enum ButtonMenuMode {
  Click = 'Click',
  Hold = 'Hold',
}

export interface IEditorPreferences {
  tempoDefaults: { [key in TempoSign]?: number };
  buttonMenuMode: ButtonMenuMode;
  // Empty string means "follow the system / browser locale".
  language: string;
  showDeveloperPanels: boolean;
  overlaysEnabled: boolean;
  printOverlays: boolean;
  showGuides: boolean;
  showAdjustmentRatios: boolean;
  showAnonymousBoxes: boolean;
  showInkBoundingBoxes: boolean;
  showLyricBoundingBoxes: boolean;
  showNeumeBoundingBoxes: boolean;
  showCollisionRegions: boolean;
  showGlueWidths: boolean;
}

export class EditorPreferences implements IEditorPreferences {
  tempoDefaults: { [key in TempoSign]?: number };
  buttonMenuMode = ButtonMenuMode.Hold;
  language = '';
  showDeveloperPanels = false;
  overlaysEnabled = true;
  printOverlays = false;
  showGuides = false;
  showAdjustmentRatios = false;
  showAnonymousBoxes = false;
  showInkBoundingBoxes = false;
  showLyricBoundingBoxes = false;
  showNeumeBoundingBoxes = false;
  showCollisionRegions = false;
  showGlueWidths = false;

  constructor() {
    this.tempoDefaults = {
      [TempoSign.VerySlow]: TempoElement.getDefaultBpm(TempoSign.VerySlow),
      [TempoSign.Slower]: TempoElement.getDefaultBpm(TempoSign.Slower),
      [TempoSign.Slow]: TempoElement.getDefaultBpm(TempoSign.Slow),
      [TempoSign.Moderate]: TempoElement.getDefaultBpm(TempoSign.Moderate),
      [TempoSign.Medium]: TempoElement.getDefaultBpm(TempoSign.Medium),
      [TempoSign.Quick]: TempoElement.getDefaultBpm(TempoSign.Quick),
      [TempoSign.Quicker]: TempoElement.getDefaultBpm(TempoSign.Quicker),
      [TempoSign.VeryQuick]: TempoElement.getDefaultBpm(TempoSign.VeryQuick),
    };
  }

  static createFrom(data: Partial<IEditorPreferences>) {
    return Object.assign(new EditorPreferences(), data);
  }

  getDefaultTempo(tempo: TempoSign) {
    tempo = tempo.replace('Above', '') as TempoSign;

    return this.tempoDefaults[tempo];
  }
}
