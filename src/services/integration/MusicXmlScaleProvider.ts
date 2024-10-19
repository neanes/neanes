import { Scale, ScaleNote } from '@/models/Scales';

import { IMusicXmlScaleProvider } from './IMusicXmlScaleProvider';
import { MusicXmlAlter, MusicXmlPitch } from './MusicXmlModel';

type AlterMap = Map<ScaleNote, number>;

export class MusicXmlScaleProvider implements IMusicXmlScaleProvider {
  getScale(scale: Scale, transposition: number) {
    let alters: AlterMap = this.hardChromaticFromDAlters;
    switch (scale) {
      case Scale.Diatonic:
        alters = this.getDiatonicAlters(transposition);
        break;
      case Scale.HardChromatic:
        alters = this.getHardChromaticAlters(transposition);
        break;
      case Scale.SoftChromatic:
        alters = this.getSoftChromaticAlters(transposition);
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

    const newScale = this.getDefaultScale();

    for (const [note, pitch] of newScale) {
      const alter = alters.get(note);

      if (alter) {
        pitch.alter = new MusicXmlAlter(alter);
      } else {
        pitch.alter = undefined;
      }
    }

    return newScale;
  }

  private getDiatonicAlters(transposition: number): AlterMap {
    transposition %= 7;
    if (transposition < 0) {
      transposition += 7;
    }

    switch (transposition) {
      case 0:
        return this.diatonicFromCAlters;
      case 1:
        return this.diatonicFromDAlters;
      case 2:
        return this.diatonicFromEAlters;
      case 3:
        return this.diatonicFromFAlters;
      case 4:
        return this.diatonicFromGAlters;
      case 5:
        return this.diatonicFromAAlters;
      case 6:
        return this.diatonicFromBAlters;
      default:
        throw Error(`Invalid transposition: ${transposition}`);
    }
  }

  private getSoftChromaticAlters(transposition: number): AlterMap {
    transposition %= 7;
    if (transposition < 0) {
      transposition += 7;
    }

    switch (transposition) {
      case 0:
        return this.diatonicFromCAlters;
      case 1:
        return this.diatonicFromDAlters;
      case 2:
        return this.diatonicFromEAlters;
      case 3:
        return this.diatonicFromFAlters;
      case 4:
        return this.diatonicFromGAlters;
      case 5:
        return this.diatonicFromAAlters;
      case 6:
        return this.diatonicFromBAlters;
      default:
        throw Error(`Invalid transposition: ${transposition}`);
    }
  }

  private getHardChromaticAlters(transposition: number): AlterMap {
    transposition %= 7;
    if (transposition < 0) {
      transposition += 7;
    }

    switch (transposition) {
      case 0:
        return this.hardChromaticFromDAlters;
      case 1:
        return this.hardChromaticFromEAlters;
      case 2:
        return this.hardChromaticFromFAlters;
      case 3:
        return this.hardChromaticFromGAlters;
      case 4:
        return this.hardChromaticFromAAlters;
      case 5:
        return this.hardChromaticFromBAlters;
      case 6:
        return this.hardChromaticFromCAlters;
      default:
        throw Error(`Invalid transposition: ${transposition}`);
    }
  }

  private getDefaultScale() {
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

  // N/A
  private diatonicFromCAlters: AlterMap = new Map<ScaleNote, number>([]);

  // F#
  private diatonicFromGAlters: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.GaLow, 1],
    [ScaleNote.Ga, 1],
    [ScaleNote.GaHigh, 1],
  ]);

  // F# C#
  private diatonicFromDAlters: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.GaLow, 1],
    [ScaleNote.Ga, 1],
    [ScaleNote.GaHigh, 1],
    [ScaleNote.NiLow, 1],
    [ScaleNote.Ni, 1],
    [ScaleNote.NiHigh, 1],
  ]);

  // F# C# G#
  private diatonicFromAAlters: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.GaLow, 1],
    [ScaleNote.Ga, 1],
    [ScaleNote.GaHigh, 1],
    [ScaleNote.NiLow, 1],
    [ScaleNote.Ni, 1],
    [ScaleNote.NiHigh, 1],
    [ScaleNote.ThiLow, 1],
    [ScaleNote.Thi, 1],
    [ScaleNote.ThiHigh, 1],
  ]);

  // F# C# G# D#
  private diatonicFromEAlters: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.GaLow, 1],
    [ScaleNote.Ga, 1],
    [ScaleNote.GaHigh, 1],
    [ScaleNote.NiLow, 1],
    [ScaleNote.Ni, 1],
    [ScaleNote.NiHigh, 1],
    [ScaleNote.ThiLow, 1],
    [ScaleNote.Thi, 1],
    [ScaleNote.ThiHigh, 1],
    [ScaleNote.PaLow, 1],
    [ScaleNote.Pa, 1],
    [ScaleNote.PaHigh, 1],
  ]);

  // F# C# G# D# A#
  private diatonicFromBAlters: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.GaLow, 1],
    [ScaleNote.Ga, 1],
    [ScaleNote.GaHigh, 1],
    [ScaleNote.NiLow, 1],
    [ScaleNote.Ni, 1],
    [ScaleNote.NiHigh, 1],
    [ScaleNote.ThiLow, 1],
    [ScaleNote.Thi, 1],
    [ScaleNote.ThiHigh, 1],
    [ScaleNote.PaLow, 1],
    [ScaleNote.Pa, 1],
    [ScaleNote.PaHigh, 1],
    [ScaleNote.KeLow, 1],
    [ScaleNote.Ke, 1],
    [ScaleNote.KeHigh, 1],
  ]);

  // Bb
  private diatonicFromFAlters: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.ZoLow, -1],
    [ScaleNote.Zo, -1],
    [ScaleNote.ZoHigh, -1],
  ]);

  // Bb, C#, Eb, F#
  private hardChromaticFromDAlters: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.ZoLow, -1],
    [ScaleNote.NiLow, 1],
    [ScaleNote.VouLow, -1],
    [ScaleNote.GaLow, 1],
    [ScaleNote.Zo, -1],
    [ScaleNote.Ni, 1],
    [ScaleNote.Vou, -1],
    [ScaleNote.Ga, 1],
    [ScaleNote.ZoHigh, -1],
    [ScaleNote.NiHigh, 1],
    [ScaleNote.VouHigh, -1],
    [ScaleNote.GaHigh, 1],
  ]);

  // D#, G#
  private hardChromaticFromEAlters: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.ThiLow, 1],
    [ScaleNote.Thi, 1],
    [ScaleNote.ThiHigh, 1],
    [ScaleNote.PaLow, 1],
    [ScaleNote.Pa, 1],
    [ScaleNote.PaHigh, 1],
  ]);

  // Gb Bb Db
  private hardChromaticFromFAlters: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.ThiLow, -1],
    [ScaleNote.Thi, -1],
    [ScaleNote.ThiHigh, -1],
    [ScaleNote.ZoLow, -1],
    [ScaleNote.Zo, -1],
    [ScaleNote.ZoHigh, -1],
    [ScaleNote.PaLow, -1],
    [ScaleNote.Pa, -1],
    [ScaleNote.PaHigh, -1],
  ]);

  // Ab Eb F#
  private hardChromaticFromGAlters: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.KeLow, -1],
    [ScaleNote.Ke, -1],
    [ScaleNote.KeHigh, -1],
    [ScaleNote.VouLow, -1],
    [ScaleNote.Vou, -1],
    [ScaleNote.VouHigh, -1],
    [ScaleNote.GaLow, 1],
    [ScaleNote.Ga, 1],
    [ScaleNote.GaHigh, 1],
  ]);

  // Bb C# G#
  private hardChromaticFromAAlters: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.ZoLow, -1],
    [ScaleNote.Zo, -1],
    [ScaleNote.ZoHigh, -1],
    [ScaleNote.NiLow, 1],
    [ScaleNote.Ni, 1],
    [ScaleNote.NiHigh, 1],
    [ScaleNote.ThiLow, 1],
    [ScaleNote.Thi, 1],
    [ScaleNote.ThiHigh, 1],
  ]);

  // D# F# A#
  private hardChromaticFromBAlters: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.PaLow, 1],
    [ScaleNote.Pa, 1],
    [ScaleNote.PaHigh, 1],
    [ScaleNote.GaLow, 1],
    [ScaleNote.Ga, 1],
    [ScaleNote.GaHigh, 1],
    [ScaleNote.KeLow, 1],
    [ScaleNote.Ke, 1],
    [ScaleNote.KeHigh, 1],
  ]);

  // Db, Ab
  private hardChromaticFromCAlters: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.PaLow, -1],
    [ScaleNote.Pa, -1],
    [ScaleNote.PaHigh, -1],
    [ScaleNote.KeLow, -1],
    [ScaleNote.Ke, -1],
    [ScaleNote.KeHigh, -1],
  ]);
}
