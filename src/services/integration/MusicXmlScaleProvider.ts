import { Scale, ScaleNote } from '@/models/Scales';

import { IMusicXmlScaleProvider } from './IMusicXmlScaleProvider';
import { MusicXmlAlter, MusicXmlPitch } from './MusicXmlModel';
import { MusicXmlScaleAltersDiatonic } from './MusicXmlScaleAltersDiatonic';
import { MusicXmlScaleAltersHardChromatic } from './MusicXmlScaleAltersHardChromatic';
import { MusicXmlScaleAltersKliton } from './MusicXmlScaleAltersKliton';
import { MusicXmlScaleAltersSpathi } from './MusicXmlScaleAltersSpathi';
import { MusicXmlScaleAltersSpathiGa } from './MusicXmlScaleAltersSpathiGa';
import { MusicXmlScaleAltersZygos } from './MusicXmlScaleAltersZygos';

type AlterMap = Map<ScaleNote, number>;

export class MusicXmlScaleProvider implements IMusicXmlScaleProvider {
  getScale(scale: Scale, transposition: number) {
    let alters: AlterMap = MusicXmlScaleAltersHardChromatic.D;
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
        alters = this.getDiatonicAlters(transposition);
        break;
      case Scale.EnharmonicVou:
        alters = this.getEnharmonicVouAlters(transposition);
        break;
      case Scale.EnharmonicVouHigh:
        alters = this.getEnharmonicVouAlters(transposition);
        break;
      case Scale.EnharmonicZo:
        alters = this.getEnharmonicZoAlters(transposition);
        break;
      case Scale.EnharmonicZoHigh:
        alters = this.getEnharmonicZoAlters(transposition);
        break;
      case Scale.Kliton:
        alters = this.getKlitonAlters(transposition);
        break;
      case Scale.Spathi:
        alters = this.getSpathiAlters(transposition);
        break;
      case Scale.SpathiGa:
        alters = this.getSpathiGaAlters(transposition);
        break;
      case Scale.Zygos:
        alters = this.getZygosAlters(transposition);
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
        return MusicXmlScaleAltersDiatonic.C;
      case 1:
        return MusicXmlScaleAltersDiatonic.D;
      case 2:
        return MusicXmlScaleAltersDiatonic.E;
      case 3:
        return MusicXmlScaleAltersDiatonic.F;
      case 4:
        return MusicXmlScaleAltersDiatonic.G;
      case 5:
        return MusicXmlScaleAltersDiatonic.A;
      case 6:
        return MusicXmlScaleAltersDiatonic.B;
      default:
        throw Error(`Invalid transposition: ${transposition}`);
    }
  }

  // Bb C D Eb
  private getEnharmonicVouAlters(transposition: number): AlterMap {
    transposition %= 7;
    if (transposition < 0) {
      transposition += 7;
    }

    // We don't support this option in transposition

    switch (transposition) {
      case 0:
        return MusicXmlScaleAltersDiatonic.Bb;
      // case 1:
      //   return MusicXmlScaleAltersDiatonic.C;
      // case 2:
      //   return MusicXmlScaleAltersEnharmonicVou.D;
      // case 3:
      //   return MusicXmlScaleAltersEnharmonicVou.E;
      // case 4:
      //   return MusicXmlScaleAltersEnharmonicVou.Gb;
      // case 5:
      //   return MusicXmlScaleAltersEnharmonicVou.Ab;
      // case 6:
      //   return MusicXmlScaleAltersEnharmonicVou.A;
      default:
        return MusicXmlScaleAltersDiatonic.Bb;

      //throw Error(`Invalid transposition: ${transposition}`);
    }
  }

  private getEnharmonicZoAlters(transposition: number): AlterMap {
    transposition %= 7;
    if (transposition < 0) {
      transposition += 7;
    }

    switch (transposition) {
      case 0:
        return MusicXmlScaleAltersDiatonic.F;
      case 1:
        return MusicXmlScaleAltersDiatonic.G;
      case 2:
        return MusicXmlScaleAltersDiatonic.A;
      case 3:
        return MusicXmlScaleAltersDiatonic.B;
      case 4:
        return MusicXmlScaleAltersDiatonic.C;
      case 5:
        return MusicXmlScaleAltersDiatonic.D;
      case 6:
        return MusicXmlScaleAltersDiatonic.E;
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
        return MusicXmlScaleAltersDiatonic.C;
      case 1:
        return MusicXmlScaleAltersDiatonic.D;
      case 2:
        return MusicXmlScaleAltersDiatonic.E;
      case 3:
        return MusicXmlScaleAltersDiatonic.F;
      case 4:
        return MusicXmlScaleAltersDiatonic.G;
      case 5:
        return MusicXmlScaleAltersDiatonic.A;
      case 6:
        return MusicXmlScaleAltersDiatonic.B;
      default:
        throw Error(`Invalid transposition: ${transposition}`);
    }
  }

  private getZygosAlters(transposition: number): AlterMap {
    transposition %= 7;
    if (transposition < 0) {
      transposition += 7;
    }

    switch (transposition) {
      case 0:
        return MusicXmlScaleAltersZygos.C;
      case 1:
        return MusicXmlScaleAltersZygos.D;
      case 2:
        return MusicXmlScaleAltersZygos.E;
      case 3:
        return MusicXmlScaleAltersZygos.F;
      case 4:
        return MusicXmlScaleAltersZygos.G;
      case 5:
        return MusicXmlScaleAltersZygos.A;
      case 6:
        return MusicXmlScaleAltersZygos.Bb;
      default:
        throw Error(`Invalid transposition: ${transposition}`);
    }
  }

  private getKlitonAlters(transposition: number): AlterMap {
    transposition %= 7;
    if (transposition < 0) {
      transposition += 7;
    }

    switch (transposition) {
      case 0:
        return MusicXmlScaleAltersKliton.C;
      case 1:
        return MusicXmlScaleAltersKliton.D;
      case 2:
        return MusicXmlScaleAltersKliton.E;
      case 3:
        return MusicXmlScaleAltersKliton.F;
      case 4:
        return MusicXmlScaleAltersKliton.G;
      case 5:
        return MusicXmlScaleAltersKliton.A;
      case 6:
        return MusicXmlScaleAltersKliton.Bb;
      default:
        throw Error(`Invalid transposition: ${transposition}`);
    }
  }

  private getSpathiAlters(transposition: number): AlterMap {
    transposition %= 7;
    if (transposition < 0) {
      transposition += 7;
    }

    switch (transposition) {
      case 0:
        return MusicXmlScaleAltersSpathi.C;
      case 1:
        return MusicXmlScaleAltersSpathi.D;
      case 2:
        return MusicXmlScaleAltersSpathi.Eb;
      case 3:
        return MusicXmlScaleAltersSpathi.F;
      case 4:
        return MusicXmlScaleAltersSpathi.G;
      case 5:
        return MusicXmlScaleAltersSpathi.A;
      case 6:
        return MusicXmlScaleAltersSpathi.Bb;
      default:
        throw Error(`Invalid transposition: ${transposition}`);
    }
  }

  private getSpathiGaAlters(transposition: number): AlterMap {
    transposition %= 7;
    if (transposition < 0) {
      transposition += 7;
    }

    switch (transposition) {
      case 0:
        return MusicXmlScaleAltersSpathiGa.C;
      case 1:
        return MusicXmlScaleAltersSpathiGa.D;
      case 2:
        return MusicXmlScaleAltersSpathiGa.E;
      case 3:
        return MusicXmlScaleAltersSpathiGa.Fs;
      case 4:
        return MusicXmlScaleAltersSpathiGa.G;
      case 5:
        return MusicXmlScaleAltersSpathiGa.A;
      case 6:
        return MusicXmlScaleAltersSpathiGa.B;
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
        return MusicXmlScaleAltersHardChromatic.D;
      case 1:
        return MusicXmlScaleAltersHardChromatic.D;
      case 2:
        return MusicXmlScaleAltersHardChromatic.F;
      case 3:
        return MusicXmlScaleAltersHardChromatic.G;
      case 4:
        return MusicXmlScaleAltersHardChromatic.A;
      case 5:
        return MusicXmlScaleAltersHardChromatic.B;
      case 6:
        return MusicXmlScaleAltersHardChromatic.C;
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
}
