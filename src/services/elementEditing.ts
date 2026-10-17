import type { MartyriaElement, NoteElement } from '@/models/Element';
import { getDefaultChromaticFthoraNote } from '@/models/NeumeReplacements';
import type { Fthora } from '@/models/Neumes';

export const fthoraInterpretationKeys = {
  fthora: 'chromaticFthoraNote',
  secondaryFthora: 'secondaryChromaticFthoraNote',
  tertiaryFthora: 'tertiaryChromaticFthoraNote',
  quantitativeNeumeFthora: 'quantitativeNeumeChromaticFthoraNote',
} as const;

type FthoraKey = keyof typeof fthoraInterpretationKeys;
type FthoraChange<K extends FthoraKey> = Pick<
  NoteElement & MartyriaElement,
  K | (typeof fthoraInterpretationKeys)[K]
>;

// Selecting a fthora also selects its default interpretation. Callers decide
// whether this is a selection or a partial update that preserves an override.
export function getFthoraChange<K extends FthoraKey>(
  key: K,
  fthora: Fthora | null,
): FthoraChange<K> {
  return {
    [key]: fthora,
    [fthoraInterpretationKeys[key]]: getDefaultChromaticFthoraNote(fthora),
  } as FthoraChange<K>;
}

// Changing alignment clears the attached quantitative neume in either direction.
export function getMartyriaAlignmentChange(
  current: boolean,
  alignRight: boolean,
): Partial<MartyriaElement> {
  return current === alignRight
    ? { alignRight }
    : { alignRight, quantitativeNeume: null };
}
