import { describe, expect, it } from 'vitest';

import { createInitialMartyriaStyle } from '@/models/InitialMartyriaGrammar';
import {
  cloneInitialMartyriaStyle,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  initialMartyriaLanguageIds,
} from '@/models/InitialMartyriaStyle';

import { attestedStructures } from './InitialMartyriaStyle.testData';
import { styleFor } from './InitialMartyriaStyle.testHelpers';

describe('InitialMartyriaStyle', () => {
  it('lists languages alphabetically', () => {
    expect(initialMartyriaLanguageIds).toEqual([
      INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
      INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
      INITIAL_MARTYRIA_LANGUAGE_IDS.English,
      INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
      INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian,
      INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
      INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
      INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    ]);
  });

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
