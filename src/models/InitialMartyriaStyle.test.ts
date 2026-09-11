import { describe, expect, it } from 'vitest';

import { createInitialMartyriaStyle } from '@/models/InitialMartyriaGrammar';
import {
  cloneInitialMartyriaStyle,
  INITIAL_MARTYRIA_DEFAULT_FONT_FAMILY,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
} from '@/models/InitialMartyriaStyle';

import { attestedStructures } from './InitialMartyriaStyle.testData';
import { styleFor } from './InitialMartyriaStyle.testHelpers';

describe('InitialMartyriaStyle', () => {
  it('clones styles without sharing mutable state', () => {
    const source = styleFor(attestedStructures['greek-mode-names']);
    const clone = cloneInitialMartyriaStyle(source);
    clone.paragraphStyleOverrides.fontFamily = 'Source Serif';
    if (
      source.structure.modeIdentificationMethod === 'mode-sign' ||
      clone.structure.modeIdentificationMethod === 'mode-sign'
    ) {
      throw new Error('Expected a text structure');
    }
    clone.structure.numeralStyle = INITIAL_MARTYRIA_NUMERAL_STYLES.Words;

    expect(source.paragraphStyleOverrides.fontFamily).toBe(
      INITIAL_MARTYRIA_DEFAULT_FONT_FAMILY,
    );
    expect(source.structure.numeralStyle).toBe(
      INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    );
    expect(createInitialMartyriaStyle(source).id).not.toBe(source.id);
  });
});
