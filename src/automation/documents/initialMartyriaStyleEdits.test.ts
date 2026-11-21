import { describe, expect, it } from 'vitest';

import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  getBuiltInInitialMartyriaStyle,
} from '@/models/InitialMartyriaBuiltInStyles';
import { createInitialMartyriaStyle } from '@/models/InitialMartyriaGrammar';
import {
  INITIAL_MARTYRIA_LABEL_VARIANTS,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
} from '@/models/InitialMartyriaStyle';
import { attestedStructures } from '@/models/InitialMartyriaStyle.testData';
import { Score } from '@/models/Score';

import { initialMartyriaStyleChangesSchema } from '../contracts/initialMartyriaStyles';
import {
  planInitialMartyriaStyleEdits,
  readInitialMartyriaStyles,
} from './initialMartyriaStyleEdits';

function createSignAloneStyle() {
  return createInitialMartyriaStyle({
    ...getBuiltInInitialMartyriaStyle(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.Classic,
    ),
    displayName: 'Bare sign',
    structure: attestedStructures['greek-mode-sign-alone'],
  });
}

describe('initial martyria style edits: the sign group alone', () => {
  it('accepts the sign group alone and reads it back unchanged', () => {
    const score = new Score();
    const style = createSignAloneStyle();
    const changes = initialMartyriaStyleChangesSchema.parse({
      upsert: [style],
      defaultStyleId: style.id,
    });

    const update = planInitialMartyriaStyleEdits(score, changes);
    score.initialMartyriaStyles = update.styles;
    score.defaultInitialMartyriaStyleId = update.defaultStyleId;

    const read = readInitialMartyriaStyles(score);
    expect(read.defaultStyleId).toBe(style.id);
    expect(read.styles.find(({ id }) => id === style.id)).toEqual(style);
  });

  it.each([
    ['labelVariant', INITIAL_MARTYRIA_LABEL_VARIANTS.Tone],
    ['numeralKind', INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
  ])('rejects the mode-name axis %s', (axis, value) => {
    const style = createSignAloneStyle();
    const result = initialMartyriaStyleChangesSchema.safeParse({
      upsert: [{ ...style, structure: { ...style.structure, [axis]: value } }],
    });

    expect(result.success).toBe(false);
  });
});
