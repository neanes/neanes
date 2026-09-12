import { describe, expect, it } from 'vitest';

import { getDefaultBuiltInInitialMartyriaStyle } from '@/models/InitialMartyriaBuiltInStyles';
import {
  cloneInitialMartyriaStyle,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
} from '@/models/InitialMartyriaStyle';

import { withInitialMartyriaStyleStructure } from './InitialMartyriaStylesDialog.shared';

describe('withInitialMartyriaStyleStructure', () => {
  it('preserves paragraph style selections when the language changes', () => {
    const english = cloneInitialMartyriaStyle(
      getDefaultBuiltInInitialMartyriaStyle(
        INITIAL_MARTYRIA_LANGUAGE_IDS.English,
      ),
    );
    english.paragraphStyleId = 'custom-main';
    english.greekParagraphStyleId = 'custom-greek';

    const arabic = getDefaultBuiltInInitialMartyriaStyle(
      INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
    );
    const changed = withInitialMartyriaStyleStructure(
      english,
      arabic.structure,
    );

    expect(changed.structure).toEqual(arabic.structure);
    expect(changed.paragraphStyleId).toBe('custom-main');
    expect(changed.greekParagraphStyleId).toBe('custom-greek');
    expect(changed).not.toBe(english);
    expect(changed.structure).not.toBe(english.structure);
  });

  it('defaults ordinal forms when a picker choice introduces digit ordinals', () => {
    const english = cloneInitialMartyriaStyle(
      getDefaultBuiltInInitialMartyriaStyle(
        INITIAL_MARTYRIA_LANGUAGE_IDS.English,
      ),
    );
    english.useOrdinalForms = false;

    const changed = withInitialMartyriaStyleStructure(english, {
      ...english.structure,
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    });

    expect(changed.useOrdinalForms).toBe(true);
    expect(english.useOrdinalForms).toBe(false);
  });
});
