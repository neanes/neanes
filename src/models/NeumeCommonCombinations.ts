import { NoteElement } from './Element';
import {
  GorgonNeume,
  QuantitativeNeume,
  TimeNeume,
  VocalExpressionNeume,
} from './Neumes';

export interface NeumeCombination {
  name: string;
  tags: string[];
  description?: string;

  elements: NoteElement[];
}

const ending1: NeumeCombination = {
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

export const NeumeCommonCombinations = {
  ending1,
  ending2,
  ornament1,
  ornament1Alt,
};
