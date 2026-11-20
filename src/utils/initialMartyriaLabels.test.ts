import i18next from 'i18next';
import { beforeAll, describe, expect, it } from 'vitest';

import { defaultNS, resources } from '@/i18n';
import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  getBuiltInInitialMartyriaStyle,
} from '@/models/InitialMartyriaBuiltInStyles';

import { getNewInitialMartyriaStyleName } from './initialMartyriaLabels';

const english = getBuiltInInitialMartyriaStyle(
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNames,
);
const neumeFont = getBuiltInInitialMartyriaStyle(
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.Classic,
);
const greek = getBuiltInInitialMartyriaStyle(
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekTraditionalSign,
);

async function createT(lng: string) {
  const instance = i18next.createInstance();
  await instance.init({
    lng,
    fallbackLng: 'en',
    ns: Object.keys(resources.en),
    defaultNS,
    enableSelector: 'strict',
    interpolation: { escapeValue: false },
    resources,
  });
  return instance.t;
}

let t: Awaited<ReturnType<typeof createT>>;

beforeAll(async () => {
  t = await createT('en');
});

describe('getNewInitialMartyriaStyleName', () => {
  it('names a style after its language, numbering it when taken', () => {
    expect(getNewInitialMartyriaStyleName(t, english, [])).toBe('English');
    expect(
      getNewInitialMartyriaStyleName(t, english, ['English', 'English 2']),
    ).toBe('English 3');
  });

  it('names a neume font style after the neume font, not Greek', () => {
    expect(getNewInitialMartyriaStyleName(t, neumeFont, [])).toBe('Neume Font');
    expect(getNewInitialMartyriaStyleName(t, greek, [])).toBe('Greek');
  });
});
