import { describe, expect, it } from 'vitest';

import { createInitialMartyriaStyle } from '@/models/InitialMartyriaGrammar';
import {
  cloneInitialMartyriaStyle,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
} from '@/models/InitialMartyriaStyle';

import { attestedStructures } from './InitialMartyriaStyle.testData';
import { styleFor } from './InitialMartyriaStyle.testHelpers';

describe('InitialMartyriaStyle', () => {
  it('clones styles without sharing mutable state', () => {
    const source = styleFor(attestedStructures['greek-mode-names']);
    const clone = cloneInitialMartyriaStyle(source);
    if (
      source.structure.modeIdentificationMethod === 'mode-sign' ||
      clone.structure.modeIdentificationMethod === 'mode-sign'
    ) {
      throw new Error('Expected a text structure');
    }
    clone.structure.numeralStyle = INITIAL_MARTYRIA_NUMERAL_STYLES.Words;

    expect(clone).not.toBe(source);
    expect(clone.structure).not.toBe(source.structure);
    expect(source.structure.numeralStyle).toBe(
      INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    );
    expect(createInitialMartyriaStyle(source).id).not.toBe(source.id);
  });
});
