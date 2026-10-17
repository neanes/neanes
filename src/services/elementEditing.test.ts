import { describe, expect, it } from 'vitest';

import { Fthora } from '@/models/Neumes';

import {
  fthoraInterpretationKeys,
  getFthoraChange,
  getMartyriaAlignmentChange,
} from './elementEditing';

describe('musical element changes', () => {
  it.each(
    Object.keys(
      fthoraInterpretationKeys,
    ) as (keyof typeof fthoraInterpretationKeys)[],
  )(
    'pairs %s with its default interpretation, including explicit clearing',
    (key) => {
      const noteKey = fthoraInterpretationKeys[key];
      expect(getFthoraChange(key, Fthora.SoftChromaticPa_Top)).toEqual({
        [key]: Fthora.SoftChromaticPa_Top,
        [noteKey]: 'Ga',
      });
      expect(getFthoraChange(key, null)).toEqual({
        [key]: null,
        [noteKey]: null,
      });
    },
  );

  it.each([true, false])(
    'clears the quantitative neume when aligning right=%s',
    (alignRight) => {
      expect(getMartyriaAlignmentChange(!alignRight, alignRight)).toEqual({
        alignRight,
        quantitativeNeume: null,
      });
      expect(getMartyriaAlignmentChange(alignRight, alignRight)).toEqual({
        alignRight,
      });
    },
  );
});
