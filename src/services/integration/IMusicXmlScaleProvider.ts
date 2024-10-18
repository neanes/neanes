import { Scale, ScaleNote } from '@/models/Scales';

import { MusicXmlPitch } from './MusicXmlModel';

export interface IMusicXmlScaleProvider {
  getScale(scale: Scale, transposition: number): Map<ScaleNote, MusicXmlPitch>;
}
