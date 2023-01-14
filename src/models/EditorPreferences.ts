import { TempoElement } from './Element';
import { TempoSign } from './Neumes';

export interface IEditorPreferences {
  tempoDefaults: { [key in TempoSign]?: number };
}

export class EditorPreferences implements IEditorPreferences {
  tempoDefaults: { [key in TempoSign]?: number };

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

  static createFrom(data: IEditorPreferences) {
    return Object.assign(new EditorPreferences(), data);
  }

  getDefaultTempo(tempo: TempoSign) {
    tempo = tempo.replace('Above', '') as TempoSign;

    return this.tempoDefaults[tempo];
  }
}
