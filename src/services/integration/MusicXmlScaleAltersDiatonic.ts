import { ScaleNote } from '@/models/Scales';

type AlterMap = Map<ScaleNote, number>;

export class MusicXmlScaleAltersDiatonic {
  // N/A
  static C: AlterMap = new Map<ScaleNote, number>([]);

  // F#
  static G: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.GaLow, 1],
    [ScaleNote.Ga, 1],
    [ScaleNote.GaHigh, 1],
  ]);

  // F# C#
  static D: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.GaLow, 1],
    [ScaleNote.Ga, 1],
    [ScaleNote.GaHigh, 1],
    [ScaleNote.NiLow, 1],
    [ScaleNote.Ni, 1],
    [ScaleNote.NiHigh, 1],
  ]);

  // F# C# G#
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
  ]);

  // F# C# G# D#
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
  ]);

  // F# C# G# D# A#
  static B: AlterMap = new Map<ScaleNote, number>([
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
  static F: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.ZoLow, -1],
    [ScaleNote.Zo, -1],
    [ScaleNote.ZoHigh, -1],
  ]);

  // Bb Eb
  static Bb: AlterMap = new Map<ScaleNote, number>([
    [ScaleNote.ZoLow, -1],
    [ScaleNote.Zo, -1],
    [ScaleNote.ZoHigh, -1],
    [ScaleNote.VouLow, -1],
    [ScaleNote.Vou, -1],
    [ScaleNote.VouHigh, -1],
  ]);
}
