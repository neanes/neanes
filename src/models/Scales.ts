import { Ison } from './Neumes';

export enum Scale {
  Diatonic = 'Diatonic',
  SoftChromatic = 'SoftChromatic',
  HardChromatic = 'HardChromatic',
  EnharmonicGa = 'EnharmonicGa',
  EnharmonicZoHigh = 'EnharmonicZoHigh',
  EnharmonicVou = 'EnharmonicVou',
  EnharmonicVouHigh = 'EnharmonicVouHigh',
  Zygos = 'Zygos',
  Spathi = 'Spathi',
  Kliton = 'Kliton',
}

export enum ScaleNote {
  VouLow = 'VouLow',
  GaLow = 'GaLow',
  ThiLow = 'ThiLow',
  KeLow = 'KeLow',
  Zo = 'Zo',
  Ni = 'Ni',
  Pa = 'Pa',
  Vou = 'Vou',
  Ga = 'Ga',
  Thi = 'Thi',
  Ke = 'Ke',
  ZoHigh = 'ZoHigh',
  NiHigh = 'NiHigh',
  PaHigh = 'PaHigh',
  VouHigh = 'VouHigh',
  GaHigh = 'GaHigh',
  ThiHigh = 'ThiHigh',
  KeHigh = 'KeHigh',
}

const scaleNoteToNoteValueMap = new Map<ScaleNote, number>([
  [ScaleNote.VouLow, -6],
  [ScaleNote.GaLow, -5],
  [ScaleNote.ThiLow, -4],
  [ScaleNote.KeLow, -3],
  [ScaleNote.Zo, -2],
  [ScaleNote.Ni, -1],
  [ScaleNote.Pa, 0],
  [ScaleNote.Vou, 1],
  [ScaleNote.Ga, 2],
  [ScaleNote.Thi, 3],
  [ScaleNote.Ke, 4],
  [ScaleNote.ZoHigh, 5],
  [ScaleNote.NiHigh, 6],
  [ScaleNote.PaHigh, 7],
  [ScaleNote.VouHigh, 8],
  [ScaleNote.GaHigh, 9],
  [ScaleNote.ThiHigh, 10],
  [ScaleNote.KeHigh, 11],
]);

const isonToNoteValueMap = new Map<Ison, number>([
  [Ison.ThiLow, -4],
  [Ison.KeLow, -3],
  [Ison.Zo, -2],
  [Ison.Ni, -1],
  [Ison.Pa, 0],
  [Ison.Vou, 1],
  [Ison.Ga, 2],
  [Ison.Thi, 3],
  [Ison.Ke, 4],
  [Ison.ZoHigh, 5],
]);

export const getScaleNoteValue = (note: ScaleNote) =>
  scaleNoteToNoteValueMap.get(note)!;

export const getIsonValue = (ison: Ison) => isonToNoteValueMap.get(ison)!;
