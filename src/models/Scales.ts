import { Ison, Note } from './Neumes';

export enum Scale {
  Diatonic = 'Diatonic',
  SoftChromatic = 'SoftChromatic',
  HardChromatic = 'HardChromatic',
  EnharmonicGa = 'EnharmonicGa',
  EnharmonicZo = 'EnharmonicZo',
  EnharmonicZoHigh = 'EnharmonicZoHigh',
  EnharmonicVou = 'EnharmonicVou',
  EnharmonicVouHigh = 'EnharmonicVouHigh',
  Zygos = 'Zygos',
  Spathi = 'Spathi',
  SpathiGa = 'SpathiGa',
  Kliton = 'Kliton',
}

export enum ScaleNote {
  ZoLow = 'ZoLow',
  NiLow = 'NiLow',
  PaLow = 'PaLow',
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
  [ScaleNote.ZoLow, -9],
  [ScaleNote.NiLow, -8],
  [ScaleNote.PaLow, -7],
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

const noteToNoteValueMap = new Map<Note, number>([
  [Note.ZoLow, -9],
  [Note.NiLow, -8],
  [Note.PaLow, -7],
  [Note.VouLow, -6],
  [Note.GaLow, -5],
  [Note.ThiLow, -4],
  [Note.KeLow, -3],
  [Note.Zo, -2],
  [Note.Ni, -1],
  [Note.Pa, 0],
  [Note.Vou, 1],
  [Note.Ga, 2],
  [Note.Thi, 3],
  [Note.Ke, 4],
  [Note.ZoHigh, 5],
  [Note.NiHigh, 6],
  [Note.PaHigh, 7],
  [Note.VouHigh, 8],
  [Note.GaHigh, 9],
  [Note.ThiHigh, 10],
  [Note.KeHigh, 11],
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

const noteValueToScaleNoteMap = new Map<number, ScaleNote>();

for (const [key, value] of scaleNoteToNoteValueMap) {
  noteValueToScaleNoteMap.set(value, key);
}

const noteValueToNoteMap = new Map<number, Note>();

for (const [key, value] of noteToNoteValueMap) {
  noteValueToNoteMap.set(value, key);
}

const noteValueToIsonMap = new Map<number, Ison>();

for (const [key, value] of isonToNoteValueMap) {
  noteValueToIsonMap.set(value, key);
}

export const getScaleNoteValue = (note: ScaleNote) =>
  scaleNoteToNoteValueMap.get(note)!;

export const getScaleNoteFromValue = (value: number) =>
  noteValueToScaleNoteMap.get(value)!;

export const getNoteValue = (note: Note) => noteToNoteValueMap.get(note)!;

export const getNoteFromValue = (value: number) =>
  noteValueToNoteMap.get(value)!;

export const getIsonValue = (ison: Ison) => isonToNoteValueMap.get(ison)!;

export const getIsonFromValue = (value: number) =>
  noteValueToIsonMap.get(value)!;

export const getOrderedNotes = () => [
  ScaleNote.ZoLow,
  ScaleNote.NiLow,
  ScaleNote.PaLow,
  ScaleNote.VouLow,
  ScaleNote.GaLow,
  ScaleNote.ThiLow,
  ScaleNote.KeLow,
  ScaleNote.Zo,
  ScaleNote.Ni,
  ScaleNote.Pa,
  ScaleNote.Vou,
  ScaleNote.Ga,
  ScaleNote.Thi,
  ScaleNote.Ke,
  ScaleNote.ZoHigh,
  ScaleNote.NiHigh,
  ScaleNote.PaHigh,
  ScaleNote.VouHigh,
  ScaleNote.GaHigh,
  ScaleNote.ThiHigh,
  ScaleNote.KeHigh,
];
