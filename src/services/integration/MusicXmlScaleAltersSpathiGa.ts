import { ScaleNote } from '@/models/Scales';

type AlterMap = Map<ScaleNote, number>;

export class MusicXmlScaleAltersSpathiGa {
  // On F
  static C: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.ThiLow, -1],
    [ScaleNote.Thi, -1],
    [ScaleNote.ThiHigh, -1],
  ]);

  // On G
  static D: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.GaLow, 1],
    [ScaleNote.Ga, 1],
    [ScaleNote.GaHigh, 1],
    [ScaleNote.NiLow, 1],
    [ScaleNote.Ni, 1],
    [ScaleNote.NiHigh, 1],

    [ScaleNote.KeLow, -1],
    [ScaleNote.Ke, -1],
    [ScaleNote.KeHigh, -1],
  ]);

  // On A
  static E: AlterMap = new Map<ScaleNote, number>([
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

    [ScaleNote.ZoLow, -1],
    [ScaleNote.Zo, -1],
    [ScaleNote.ZoHigh, -1],
  ]);

  // On B
  static Fs: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.GaLow, 1],
    [ScaleNote.Ga, 1],
    [ScaleNote.GaHigh, 1],
    [ScaleNote.ThiLow, 1],
    [ScaleNote.Thi, 1],
    [ScaleNote.ThiHigh, 1],
    [ScaleNote.PaLow, 1],
    [ScaleNote.Pa, 1],
    [ScaleNote.PaHigh, 1],
    [ScaleNote.KeLow, 1],
    [ScaleNote.Ke, 1],
    [ScaleNote.KeHigh, 1],
    [ScaleNote.VouLow, 1],
    [ScaleNote.Vou, 1],
    [ScaleNote.VouHigh, 1],
  ]);

  // On C
  static G: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.GaLow, 1],
    [ScaleNote.Ga, 1],
    [ScaleNote.GaHigh, 1],

    [ScaleNote.PaLow, -1],
    [ScaleNote.Pa, -1],
    [ScaleNote.PaHigh, -1],
  ]);

  // On D
  static A: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.GaLow, 1],
    [ScaleNote.Ga, 1],
    [ScaleNote.GaHigh, 1],
    [ScaleNote.NiLow, 1],
    [ScaleNote.Ni, 1],
    [ScaleNote.NiHigh, 1],
    [ScaleNote.ThiLow, 1],
    [ScaleNote.Thi, 1],
    [ScaleNote.ThiHigh, 1],

    [ScaleNote.VouLow, -1],
    [ScaleNote.Vou, -1],
    [ScaleNote.VouHigh, -1],
  ]);

  // On E
  static B: AlterMap = new Map<ScaleNote, number>([
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
}
