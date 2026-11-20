import { describe, expect, it } from 'vitest';

import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  getBuiltInInitialMartyriaStyle,
} from '@/models/InitialMartyriaBuiltInStyles';
import { getInitialMartyriaWordingKey } from '@/models/InitialMartyriaResolver';
import {
  cloneInitialMartyriaStyle,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
} from '@/models/InitialMartyriaStyle';

import { withInitialMartyriaStyleStructure } from './InitialMartyriaStylesDialog.shared';

describe('withInitialMartyriaStyleStructure', () => {
  it('preserves paragraph style selections when the language changes', () => {
    const english = cloneInitialMartyriaStyle(
      getBuiltInInitialMartyriaStyle(
        BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishTraditionalSign,
      ),
    );
    english.paragraphStyleId = 'custom-main';
    english.greekParagraphStyleId = 'custom-greek';

    const arabic = getBuiltInInitialMartyriaStyle(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ArabicOrdinal,
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

  it('keeps the ordinal forms choice when a wording introduces digit ordinals', () => {
    const english = cloneInitialMartyriaStyle(
      getBuiltInInitialMartyriaStyle(
        BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishTraditionalSign,
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

    expect(changed.useOrdinalForms).toBe(false);
  });
});

describe('getInitialMartyriaWordingKey', () => {
  it('tells the neume font apart from the Greek text it reads as', () => {
    const classic = getBuiltInInitialMartyriaStyle(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.Classic,
    );
    const traditional = getBuiltInInitialMartyriaStyle(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekTraditionalSign,
    );

    expect(classic.structure).toEqual(traditional.structure);
    expect(getInitialMartyriaWordingKey(classic)).not.toBe(
      getInitialMartyriaWordingKey(traditional),
    );
  });
});
