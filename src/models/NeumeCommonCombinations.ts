import { NoteElement } from './Element';
import type {
  Accidental,
  Fthora,
  Ison,
  MeasureBar,
  MeasureNumber,
  Tie,
} from './Neumes';
import {
  GorgonNeume,
  QuantitativeNeume,
  TimeNeume,
  VocalExpressionNeume,
} from './Neumes';
import type { ScaleNote } from './Scales';

export interface NeumeCombination {
  id: string;
  source: NeumeCombinationSource;
  name?: string;
  tags?: string[];
  description?: string;

  elements: NoteElement[];
}

export type NeumeCombinationSource = 'built-in' | 'user';

export interface NeumeCombinationNotePayload {
  quantitativeNeume: QuantitativeNeume;
  timeNeume: TimeNeume | null;
  gorgonNeume: GorgonNeume | null;
  secondaryGorgonNeume: GorgonNeume | null;
  vocalExpressionNeume: VocalExpressionNeume | null;
  vareia: boolean;
  fthora: Fthora | null;
  secondaryFthora: Fthora | null;
  tertiaryFthora: Fthora | null;
  chromaticFthoraNote: ScaleNote | null;
  secondaryChromaticFthoraNote: ScaleNote | null;
  tertiaryChromaticFthoraNote: ScaleNote | null;
  accidental: Accidental | null;
  secondaryAccidental: Accidental | null;
  tertiaryAccidental: Accidental | null;
  measureBarLeft: MeasureBar | null;
  measureBarRight: MeasureBar | null;
  measureNumber: MeasureNumber | null;
  noteIndicator: boolean;
  ison: Ison | null;
  tie: Tie | null;
  koronis: boolean;
  stavros: boolean;
  accidentalOffsetX: number | null;
  accidentalOffsetY: number | null;
  fthoraOffsetX: number | null;
  fthoraOffsetY: number | null;
  gorgonNeumeOffsetX: number | null;
  gorgonNeumeOffsetY: number | null;
  isonOffsetX: number | null;
  isonOffsetY: number | null;
  koronisOffsetX: number | null;
  koronisOffsetY: number | null;
  measureBarLeftOffsetX: number | null;
  measureBarLeftOffsetY: number | null;
  measureBarRightOffsetX: number | null;
  measureBarRightOffsetY: number | null;
  measureNumberOffsetX: number | null;
  measureNumberOffsetY: number | null;
  noteIndicatorOffsetX: number | null;
  noteIndicatorOffsetY: number | null;
  secondaryAccidentalOffsetX: number | null;
  secondaryAccidentalOffsetY: number | null;
  secondaryFthoraOffsetX: number | null;
  secondaryFthoraOffsetY: number | null;
  secondaryGorgonNeumeOffsetX: number | null;
  secondaryGorgonNeumeOffsetY: number | null;
  stavrosOffsetX: number | null;
  stavrosOffsetY: number | null;
  tertiaryAccidentalOffsetX: number | null;
  tertiaryAccidentalOffsetY: number | null;
  tertiaryFthoraOffsetX: number | null;
  tertiaryFthoraOffsetY: number | null;
  tieOffsetX: number | null;
  tieOffsetY: number | null;
  timeNeumeOffsetX: number | null;
  timeNeumeOffsetY: number | null;
  vareiaOffsetX: number | null;
  vareiaOffsetY: number | null;
  vocalExpressionNeumeOffsetX: number | null;
  vocalExpressionNeumeOffsetY: number | null;
}

const ending1: NeumeCombination = {
  id: 'ending-1',
  source: 'built-in',
  name: 'Ending 1',
  tags: ['ending'],
  elements: [
    createNote({
      vareia: true,
      quantitativeNeume: QuantitativeNeume.Apostrophos,
      timeNeume: TimeNeume.Klasma_Top,
    }),
    createNote({
      quantitativeNeume: QuantitativeNeume.Hyporoe,
      gorgonNeume: GorgonNeume.Gorgon_Top,
    }),
    createNote({
      quantitativeNeume: QuantitativeNeume.Oligon,
      gorgonNeume: GorgonNeume.Gorgon_Top,
      vocalExpressionNeume: VocalExpressionNeume.Antikenoma,
    }),
    createNote({
      quantitativeNeume: QuantitativeNeume.Apostrophos,
    }),
    createNote({
      quantitativeNeume: QuantitativeNeume.Ison,
      timeNeume: TimeNeume.Klasma_Top,
    }),
  ],
};

const ending2: NeumeCombination = {
  id: 'ending-2',
  source: 'built-in',
  name: 'Ending 2',
  tags: ['ending'],
  elements: [
    createNote({
      vareia: true,
      quantitativeNeume: QuantitativeNeume.Ison,
      timeNeume: TimeNeume.Klasma_Top,
    }),
    createNote({
      quantitativeNeume: QuantitativeNeume.Hyporoe,
      gorgonNeume: GorgonNeume.Gorgon_Top,
    }),
    createNote({
      quantitativeNeume: QuantitativeNeume.Oligon,
      gorgonNeume: GorgonNeume.Gorgon_Top,
      vocalExpressionNeume: VocalExpressionNeume.Antikenoma,
    }),
    createNote({
      quantitativeNeume: QuantitativeNeume.Apostrophos,
    }),
    createNote({
      quantitativeNeume: QuantitativeNeume.Ison,
      timeNeume: TimeNeume.Klasma_Top,
    }),
  ],
};

const ornament1: NeumeCombination = {
  id: 'ornament-1',
  source: 'built-in',
  name: 'Ornament 1',
  tags: ['ornament'],
  elements: [
    createNote({
      quantitativeNeume: QuantitativeNeume.OligonPlusIsonPlusKentemata,
      gorgonNeume: GorgonNeume.Gorgon_Top,
    }),
    createNote({
      vareia: true,
      quantitativeNeume: QuantitativeNeume.Ison,
    }),
    createNote({
      quantitativeNeume: QuantitativeNeume.Apostrophos,
      gorgonNeume: GorgonNeume.Gorgon_Top,
    }),
    createNote({
      quantitativeNeume: QuantitativeNeume.Ison,
      timeNeume: TimeNeume.Klasma_Top,
    }),
  ],
};

const ornament1Alt: NeumeCombination = {
  id: 'ornament-1-alt',
  source: 'built-in',
  name: 'Ornament 1 (alt)',
  tags: ['ornament'],
  elements: [
    createNote({
      quantitativeNeume: QuantitativeNeume.OligonPlusIsonPlusKentemata,
      gorgonNeume: GorgonNeume.GorgonDottedRight,
    }),
    createNote({
      vareia: true,
      quantitativeNeume: QuantitativeNeume.Ison,
    }),
    createNote({
      quantitativeNeume: QuantitativeNeume.Apostrophos,
      gorgonNeume: GorgonNeume.Gorgon_Top,
    }),
    createNote({
      quantitativeNeume: QuantitativeNeume.Ison,
      timeNeume: TimeNeume.Klasma_Top,
    }),
  ],
};

function createNote(args: Partial<NoteElement>): NoteElement {
  const note = new NoteElement();
  Object.assign(note, args);
  return note;
}

export function serializeNeumeCombinationNote(
  note: NoteElement,
): NeumeCombinationNotePayload {
  return {
    quantitativeNeume: note.quantitativeNeume,
    timeNeume: note.timeNeume,
    gorgonNeume: note.gorgonNeume,
    secondaryGorgonNeume: note.secondaryGorgonNeume,
    vocalExpressionNeume: note.vocalExpressionNeume,
    vareia: note.vareia,
    fthora: note.fthora,
    secondaryFthora: note.secondaryFthora,
    tertiaryFthora: note.tertiaryFthora,
    chromaticFthoraNote: note.chromaticFthoraNote,
    secondaryChromaticFthoraNote: note.secondaryChromaticFthoraNote,
    tertiaryChromaticFthoraNote: note.tertiaryChromaticFthoraNote,
    accidental: note.accidental,
    secondaryAccidental: note.secondaryAccidental,
    tertiaryAccidental: note.tertiaryAccidental,
    measureBarLeft: note.measureBarLeft,
    measureBarRight: note.measureBarRight,
    measureNumber: note.measureNumber,
    noteIndicator: note.noteIndicator,
    ison: note.ison,
    tie: note.tie,
    koronis: note.koronis,
    stavros: note.stavros,
    accidentalOffsetX: note.accidentalOffsetX,
    accidentalOffsetY: note.accidentalOffsetY,
    fthoraOffsetX: note.fthoraOffsetX,
    fthoraOffsetY: note.fthoraOffsetY,
    gorgonNeumeOffsetX: note.gorgonNeumeOffsetX,
    gorgonNeumeOffsetY: note.gorgonNeumeOffsetY,
    isonOffsetX: note.isonOffsetX,
    isonOffsetY: note.isonOffsetY,
    koronisOffsetX: note.koronisOffsetX,
    koronisOffsetY: note.koronisOffsetY,
    measureBarLeftOffsetX: note.measureBarLeftOffsetX,
    measureBarLeftOffsetY: note.measureBarLeftOffsetY,
    measureBarRightOffsetX: note.measureBarRightOffsetX,
    measureBarRightOffsetY: note.measureBarRightOffsetY,
    measureNumberOffsetX: note.measureNumberOffsetX,
    measureNumberOffsetY: note.measureNumberOffsetY,
    noteIndicatorOffsetX: note.noteIndicatorOffsetX,
    noteIndicatorOffsetY: note.noteIndicatorOffsetY,
    secondaryAccidentalOffsetX: note.secondaryAccidentalOffsetX,
    secondaryAccidentalOffsetY: note.secondaryAccidentalOffsetY,
    secondaryFthoraOffsetX: note.secondaryFthoraOffsetX,
    secondaryFthoraOffsetY: note.secondaryFthoraOffsetY,
    secondaryGorgonNeumeOffsetX: note.secondaryGorgonNeumeOffsetX,
    secondaryGorgonNeumeOffsetY: note.secondaryGorgonNeumeOffsetY,
    stavrosOffsetX: note.stavrosOffsetX,
    stavrosOffsetY: note.stavrosOffsetY,
    tertiaryAccidentalOffsetX: note.tertiaryAccidentalOffsetX,
    tertiaryAccidentalOffsetY: note.tertiaryAccidentalOffsetY,
    tertiaryFthoraOffsetX: note.tertiaryFthoraOffsetX,
    tertiaryFthoraOffsetY: note.tertiaryFthoraOffsetY,
    tieOffsetX: note.tieOffsetX,
    tieOffsetY: note.tieOffsetY,
    timeNeumeOffsetX: note.timeNeumeOffsetX,
    timeNeumeOffsetY: note.timeNeumeOffsetY,
    vareiaOffsetX: note.vareiaOffsetX,
    vareiaOffsetY: note.vareiaOffsetY,
    vocalExpressionNeumeOffsetX: note.vocalExpressionNeumeOffsetX,
    vocalExpressionNeumeOffsetY: note.vocalExpressionNeumeOffsetY,
  };
}

export function hydrateNeumeCombinationNote(
  payload: NeumeCombinationNotePayload,
): NoteElement {
  const note = new NoteElement();
  Object.assign(note, payload);
  return note as NoteElement;
}

export const NeumeCommonCombinations = {
  ending1,
  ending2,
  ornament1,
  ornament1Alt,
};
