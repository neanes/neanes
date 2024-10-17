import { Scale, ScaleNote } from '@/models/Scales';

import { MusicXmlPitch } from './MusicXmlModel';

export interface IMusicXmlScaleProvider {
  alterScale(
    currentScale: Map<ScaleNote, MusicXmlPitch>,
    newScale: Scale,
    transposition: number,
  ): void;

  getDefaultScale(): Map<ScaleNote, MusicXmlPitch>;
}
