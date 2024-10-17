import { Scale, ScaleNote } from '@/models/Scales';

import { IMusicXmlScaleProvider } from './IMusicXmlScaleProvider';
import { MusicXmlAlter, MusicXmlPitch } from './MusicXmlModel';

export class MusicXmlScaleProvider implements IMusicXmlScaleProvider {
  alterScale(
    currentScale: Map<ScaleNote, MusicXmlPitch>,
    newScale: Scale,
    transposition: number,
  ) {
    let alters: Map<ScaleNote, MusicXmlAlter>;
    switch (newScale) {
      case Scale.Diatonic:
        alters = this.getDiatonicAlters(transposition);
        break;
      case Scale.HardChromatic:
        alters = this.getHardChromaticAlters(transposition);
        break;
      case Scale.SoftChromatic:
        alters = this.hardChromaticFromDAlters;
        break;
      case Scale.EnharmonicGa:
        alters = this.hardChromaticFromDAlters;
        break;
      case Scale.EnharmonicVou:
        alters = this.hardChromaticFromDAlters;
        break;
      case Scale.EnharmonicVouHigh:
        alters = this.hardChromaticFromDAlters;
        break;
      case Scale.EnharmonicZo:
        alters = this.hardChromaticFromDAlters;
        break;
      case Scale.EnharmonicZoHigh:
        alters = this.hardChromaticFromDAlters;
        break;
      case Scale.Kliton:
        alters = this.hardChromaticFromDAlters;
        break;
      case Scale.Spathi:
        alters = this.hardChromaticFromDAlters;
        break;
      case Scale.SpathiGa:
        alters = this.hardChromaticFromDAlters;
        break;
      case Scale.Zygos:
        alters = this.hardChromaticFromDAlters;
        break;
    }

    for (const [note, pitch] of currentScale) {
      pitch.alter = alters.get(note);
    }
  }

  private getDiatonicAlters(
    transposition: number,
  ): Map<ScaleNote, MusicXmlAlter> {
    switch (transposition) {
      case 0:
        return new Map<ScaleNote, MusicXmlAlter>();
      default:
        throw Error(`Invalid transposition: ${transposition}`);
    }
  }

  private getHardChromaticAlters(
    transposition: number,
  ): Map<ScaleNote, MusicXmlAlter> {
    switch (transposition) {
      case 0:
        return this.hardChromaticFromDAlters;
      default:
        throw Error(`Invalid transposition: ${transposition}`);
    }
  }

  getDefaultScale() {
    return new Map<ScaleNote, MusicXmlPitch>([
      [ScaleNote.ZoLow, new MusicXmlPitch('B', 2)],
      [ScaleNote.NiLow, new MusicXmlPitch('C', 3)],
      [ScaleNote.PaLow, new MusicXmlPitch('D', 3)],
      [ScaleNote.VouLow, new MusicXmlPitch('E', 3)],
      [ScaleNote.GaLow, new MusicXmlPitch('F', 3)],
      [ScaleNote.ThiLow, new MusicXmlPitch('G', 3)],
      [ScaleNote.KeLow, new MusicXmlPitch('A', 3)],
      [ScaleNote.Zo, new MusicXmlPitch('B', 3)],
      [ScaleNote.Ni, new MusicXmlPitch('C', 4)],
      [ScaleNote.Pa, new MusicXmlPitch('D', 4)],
      [ScaleNote.Vou, new MusicXmlPitch('E', 4)],
      [ScaleNote.Ga, new MusicXmlPitch('F', 4)],
      [ScaleNote.Thi, new MusicXmlPitch('G', 4)],
      [ScaleNote.Ke, new MusicXmlPitch('A', 4)],
      [ScaleNote.ZoHigh, new MusicXmlPitch('B', 4)],
      [ScaleNote.NiHigh, new MusicXmlPitch('C', 5)],
      [ScaleNote.PaHigh, new MusicXmlPitch('D', 5)],
      [ScaleNote.VouHigh, new MusicXmlPitch('E', 5)],
      [ScaleNote.GaHigh, new MusicXmlPitch('F', 5)],
      [ScaleNote.ThiHigh, new MusicXmlPitch('G', 5)],
      [ScaleNote.KeHigh, new MusicXmlPitch('A', 5)],
    ]);
  }

  // Bb, C#, Eb, F#
  private hardChromaticFromDAlters: Map<ScaleNote, MusicXmlAlter> = new Map<
    ScaleNote,
    MusicXmlAlter
  >([
    [ScaleNote.ZoLow, new MusicXmlAlter(-1)],
    [ScaleNote.NiLow, new MusicXmlAlter(1)],
    [ScaleNote.VouLow, new MusicXmlAlter(-1)],
    [ScaleNote.GaLow, new MusicXmlAlter(1)],
    [ScaleNote.Zo, new MusicXmlAlter(-1)],
    [ScaleNote.Ni, new MusicXmlAlter(1)],
    [ScaleNote.Vou, new MusicXmlAlter(-1)],
    [ScaleNote.Ga, new MusicXmlAlter(1)],
    [ScaleNote.ZoHigh, new MusicXmlAlter(-1)],
    [ScaleNote.NiHigh, new MusicXmlAlter(1)],
    [ScaleNote.VouHigh, new MusicXmlAlter(-1)],
    [ScaleNote.GaHigh, new MusicXmlAlter(1)],
  ]);
}
