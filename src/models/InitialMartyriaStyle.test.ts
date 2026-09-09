import { describe, expect, it } from 'vitest';

import { resources } from '@/i18n';
import { ModeKeyElement } from '@/models/Element';
import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  type BuiltInInitialMartyriaStyleId,
  builtInInitialMartyriaStyles,
  cloneInitialMartyriaConfiguration,
  createInitialMartyriaConfiguration,
  getBuiltInInitialMartyriaStyleNameSelector,
  getInitialMartyriaContext,
  getInitialMartyriaFixedSeparatorSize,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaStyle,
  type ResolvedInitialMartyriaRun,
  resolveInitialMartyriaConfiguration,
  resolveInitialMartyriaStyle,
  resolveInitialMartyriaStyleSelection,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { ModeSign } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';

const englishLanguageNames: Record<InitialMartyriaStyle['languageId'], string> =
  {
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: 'Greek',
    [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: 'English',
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: 'Spanish',
    [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: 'Church Slavonic',
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: 'Russian',
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: 'Arabic',
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: 'Romanian',
  };

const englishNumeralStyleNames: Record<
  InitialMartyriaStyle['numeralStyle'],
  string
> = {
  [INITIAL_MARTYRIA_NUMERAL_STYLES.Digits]: 'Digits',
  [INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals]: 'Roman Numerals',
  [INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals]: 'Alphabetic Numerals',
  [INITIAL_MARTYRIA_NUMERAL_STYLES.Words]: 'Words',
};

const englishNumeralKindNames: Record<
  InitialMartyriaStyle['numeralKind'],
  string
> = {
  [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal]: 'Cardinal',
  [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal]: 'Ordinal',
};

const englishNumeralQualifierNames: Record<
  NonNullable<InitialMartyriaStyle['numeralQualifier']>,
  string
> = {
  [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal]: 'Postnominal',
  [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal]: 'Prenominal',
};

const englishPlagalAbbreviationPlacementNames: Record<
  InitialMartyriaStyle['plagalAbbreviationPlacement'],
  string | null
> = {
  beforeModeSign: null,
  afterModeSign: 'Plagal Abbreviation After Sign',
  beforeLabel: 'Plagal Abbreviation Before Mode Word',
};

const englishModeIdentificationNames: Record<
  InitialMartyriaStyle['modeIdentificationMethod'],
  string
> = {
  [INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text]: 'Text Identification',
  [INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign]:
    'Mode-Sign Identification',
  [INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign]:
    'Text and Mode-Sign Identification',
};

function generateEnglishStyleName(style: InitialMartyriaStyle) {
  const qualifier = style.numeralQualifier
    ? `${englishNumeralQualifierNames[style.numeralQualifier]} `
    : '';
  const annotations: string[] = [];

  if (style.usesPlagalTerminology) {
    annotations.push('Plagal Terminology');
  }
  const modeIdentification =
    englishModeIdentificationNames[style.modeIdentificationMethod];
  annotations.push(modeIdentification);
  const placement =
    englishPlagalAbbreviationPlacementNames[style.plagalAbbreviationPlacement];
  if (placement != null) {
    annotations.push(placement);
  }

  const annotationList =
    annotations.length > 0 ? ` (${annotations.join(', ')})` : '';

  return `${englishLanguageNames[style.languageId]} - ${qualifier}${englishNumeralKindNames[style.numeralKind]} ${englishNumeralStyleNames[style.numeralStyle]}${annotationList}`;
}

function encodeRun(run: ResolvedInitialMartyriaRun) {
  if (run.kind === 'glyph') {
    return '<modeSign>';
  }
  if (run.kind === 'startingPitch') {
    return '<pitch>';
  }
  const prefix = run.fontRole === 'greek' ? 'greek:' : '';
  return run.content.layout === 'inline'
    ? prefix + run.content.text
    : prefix + run.content.lines.join('/');
}

/*
 * The attested look of every built-in style: the exact run sequence for
 * modes 1-8. Changing an entry here changes what published scores look
 * like, so treat edits as deliberate typographic decisions.
 */
const expectedRunsByStyle: [BuiltInInitialMartyriaStyleId, string[]][] = [
  [
    'builtin:traditional-greek-v1',
    [
      'Ἦχος | <modeSign> | <pitch>',
      'Ἦχος | <modeSign> | <pitch>',
      'Ἦχος | <modeSign> | <pitch>',
      'Ἦχος | <modeSign> | <pitch>',
      'Ἦχος | greek:λ/π | <modeSign> | <pitch>',
      'Ἦχος | greek:λ/π | <modeSign> | <pitch>',
      'Ἦχος | Βαρύς | <modeSign> | <pitch>',
      'Ἦχος | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:greek-mode-names-v1',
    [
      'Ἦχος | αʹ. | <pitch>',
      'Ἦχος | βʹ. | <pitch>',
      'Ἦχος | γʹ. | <pitch>',
      'Ἦχος | δʹ. | <pitch>',
      'Ἦχος | greek:λ/π | αʹ. | <pitch>',
      'Ἦχος | greek:λ/π | βʹ. | <pitch>',
      'Ἦχος | βαρύς. | <pitch>',
      'Ἦχος | greek:λ/π | δʹ. | <pitch>',
    ],
  ],
  [
    'builtin:english-plagal-first-v1',
    [
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      'greek:λ/π | <modeSign> | Mode | <pitch>',
      'greek:λ/π | <modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      'greek:λ/π | <modeSign> | Mode | <pitch>',
    ],
  ],
  [
    'builtin:english-mode-names-v1',
    [
      'First | Mode. | <pitch>',
      'Second | Mode. | <pitch>',
      'Third | Mode. | <pitch>',
      'Fourth | Mode. | <pitch>',
      'Plagal of | First | Mode. | <pitch>',
      'Plagal of | Second | Mode. | <pitch>',
      'Grave | Mode. | <pitch>',
      'Plagal of | Fourth | Mode. | <pitch>',
    ],
  ],
  [
    'builtin:english-sign-first-v1',
    [
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | greek:λ/π | Mode | <pitch>',
      '<modeSign> | greek:λ/π | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | greek:λ/π | Mode | <pitch>',
    ],
  ],
  [
    'builtin:english-mode-before-sign-v1',
    [
      'Mode | <modeSign> | <pitch>',
      'Mode | <modeSign> | <pitch>',
      'Mode | <modeSign> | <pitch>',
      'Mode | <modeSign> | <pitch>',
      'greek:λ/π | Mode | <modeSign> | <pitch>',
      'greek:λ/π | Mode | <modeSign> | <pitch>',
      'Mode | <modeSign> | <pitch>',
      'greek:λ/π | Mode | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:english-ordinal-v1',
    [
      'First | Mode. | <modeSign> | <pitch>',
      'Second | Mode. | <modeSign> | <pitch>',
      'Third | Mode. | <modeSign> | <pitch>',
      'Fourth | Mode. | <modeSign> | <pitch>',
      'Fifth | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Sixth | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Seventh | Mode. | <modeSign> | <pitch>',
      'Eighth | Mode. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:english-mode-number-v1',
    [
      'Mode | 1. | <modeSign> | <pitch>',
      'Mode | 2. | <modeSign> | <pitch>',
      'Mode | 3. | <modeSign> | <pitch>',
      'Mode | 4. | <modeSign> | <pitch>',
      'Mode | 5. | greek:λ/π | <modeSign> | <pitch>',
      'Mode | 6. | greek:λ/π | <modeSign> | <pitch>',
      'Mode | 7. | <modeSign> | <pitch>',
      'Mode | 8. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:english-mode-roman-numeral-v1',
    [
      'Mode | I. | <modeSign> | <pitch>',
      'Mode | II. | <modeSign> | <pitch>',
      'Mode | III. | <modeSign> | <pitch>',
      'Mode | IV. | <modeSign> | <pitch>',
      'Mode | V. | greek:λ/π | <modeSign> | <pitch>',
      'Mode | VI. | greek:λ/π | <modeSign> | <pitch>',
      'Mode | VII. | <modeSign> | <pitch>',
      'Mode | VIII. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:english-mode-number-word-v1',
    [
      'Mode | One. | <modeSign> | <pitch>',
      'Mode | Two. | <modeSign> | <pitch>',
      'Mode | Three. | <modeSign> | <pitch>',
      'Mode | Four. | <modeSign> | <pitch>',
      'Mode | Five. | greek:λ/π | <modeSign> | <pitch>',
      'Mode | Six. | greek:λ/π | <modeSign> | <pitch>',
      'Mode | Seven. | <modeSign> | <pitch>',
      'Mode | Eight. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:english-full-name-v1',
    [
      'First | Mode. | <modeSign> | <pitch>',
      'Second | Mode. | <modeSign> | <pitch>',
      'Third | Mode. | <modeSign> | <pitch>',
      'Fourth | Mode. | <modeSign> | <pitch>',
      'Plagal of | First | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Plagal of | Second | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Plagal of | Fourth | Mode. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:english-plagal-number-v1',
    [
      'Mode | 1. | <modeSign> | <pitch>',
      'Mode | 2. | <modeSign> | <pitch>',
      'Mode | 3. | <modeSign> | <pitch>',
      'Mode | 4. | <modeSign> | <pitch>',
      'Plagal | Mode | 1. | greek:λ/π | <modeSign> | <pitch>',
      'Plagal | Mode | 2. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Plagal | Mode | 4. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:english-plagal-roman-numeral-v1',
    [
      'Mode | I. | <modeSign> | <pitch>',
      'Mode | II. | <modeSign> | <pitch>',
      'Mode | III. | <modeSign> | <pitch>',
      'Mode | IV. | <modeSign> | <pitch>',
      'Plagal | Mode | I. | greek:λ/π | <modeSign> | <pitch>',
      'Plagal | Mode | II. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Plagal | Mode | IV. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:english-plagal-number-word-v1',
    [
      'Mode | One. | <modeSign> | <pitch>',
      'Mode | Two. | <modeSign> | <pitch>',
      'Mode | Three. | <modeSign> | <pitch>',
      'Mode | Four. | <modeSign> | <pitch>',
      'Plagal | Mode | One. | greek:λ/π | <modeSign> | <pitch>',
      'Plagal | Mode | Two. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Plagal | Mode | Four. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:spanish-tono-number-v1',
    [
      'Tono | 1. | <modeSign> | <pitch>',
      'Tono | 2. | <modeSign> | <pitch>',
      'Tono | 3. | <modeSign> | <pitch>',
      'Tono | 4. | <modeSign> | <pitch>',
      'Tono | 5. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | 6. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | 7. | <modeSign> | <pitch>',
      'Tono | 8. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:spanish-tono-roman-numeral-v1',
    [
      'Tono | I. | <modeSign> | <pitch>',
      'Tono | II. | <modeSign> | <pitch>',
      'Tono | III. | <modeSign> | <pitch>',
      'Tono | IV. | <modeSign> | <pitch>',
      'Tono | V. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | VI. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | VII. | <modeSign> | <pitch>',
      'Tono | VIII. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:spanish-tono-ordinal-number-v1',
    [
      'Tono | 1º. | <modeSign> | <pitch>',
      'Tono | 2º. | <modeSign> | <pitch>',
      'Tono | 3º. | <modeSign> | <pitch>',
      'Tono | 4º. | <modeSign> | <pitch>',
      'Tono | 5º. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | 6º. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | 7º. | <modeSign> | <pitch>',
      'Tono | 8º. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:spanish-tono-ordinal-v1',
    [
      'Tono | primero. | <modeSign> | <pitch>',
      'Tono | segundo. | <modeSign> | <pitch>',
      'Tono | tercero. | <modeSign> | <pitch>',
      'Tono | cuarto. | <modeSign> | <pitch>',
      'Tono | quinto. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | sexto. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | séptimo. | <modeSign> | <pitch>',
      'Tono | octavo. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:spanish-ordinal-tono-v1',
    [
      'Primer | tono. | <modeSign> | <pitch>',
      'Segundo | tono. | <modeSign> | <pitch>',
      'Tercer | tono. | <modeSign> | <pitch>',
      'Cuarto | tono. | <modeSign> | <pitch>',
      'Quinto | tono. | greek:λ/π | <modeSign> | <pitch>',
      'Sexto | tono. | greek:λ/π | <modeSign> | <pitch>',
      'Séptimo | tono. | <modeSign> | <pitch>',
      'Octavo | tono. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:church-slavonic-glas-number-v1',
    [
      'Гла́съ | 1. | <modeSign> | <pitch>',
      'Гла́съ | 2. | <modeSign> | <pitch>',
      'Гла́съ | 3. | <modeSign> | <pitch>',
      'Гла́съ | 4. | <modeSign> | <pitch>',
      'Гла́съ | 5. | greek:λ/π | <modeSign> | <pitch>',
      'Гла́съ | 6. | greek:λ/π | <modeSign> | <pitch>',
      'Гла́съ | 7. | <modeSign> | <pitch>',
      'Гла́съ | 8. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:church-slavonic-glas-cyrillic-numeral-v1',
    [
      'Гла́съ | а҃. | <modeSign> | <pitch>',
      'Гла́съ | в҃. | <modeSign> | <pitch>',
      'Гла́съ | г҃. | <modeSign> | <pitch>',
      'Гла́съ | д҃. | <modeSign> | <pitch>',
      'Гла́съ | є҃. | greek:λ/π | <modeSign> | <pitch>',
      'Гла́съ | ѕ҃. | greek:λ/π | <modeSign> | <pitch>',
      'Гла́съ | з҃. | <modeSign> | <pitch>',
      'Гла́съ | и҃. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:church-slavonic-glas-cyrillic-numeral-text-v1',
    [
      'Гла́съ | а҃. | <pitch>',
      'Гла́съ | в҃. | <pitch>',
      'Гла́съ | г҃. | <pitch>',
      'Гла́съ | д҃. | <pitch>',
      'Гла́съ | є҃. | <pitch>',
      'Гла́съ | ѕ҃. | <pitch>',
      'Гла́съ | з҃. | <pitch>',
      'Гла́съ | и҃. | <pitch>',
    ],
  ],
  [
    'builtin:church-slavonic-glas-ordinal-v1',
    [
      'Гла́съ | пе́рвый. | <modeSign> | <pitch>',
      'Гла́съ | вторы́й. | <modeSign> | <pitch>',
      'Гла́съ | тре́тїй. | <modeSign> | <pitch>',
      'Гла́съ | четве́ртый. | <modeSign> | <pitch>',
      'Гла́съ | пѧ́тый. | greek:λ/π | <modeSign> | <pitch>',
      'Гла́съ | шесты́й. | greek:λ/π | <modeSign> | <pitch>',
      'Гла́съ | седмы́й. | <modeSign> | <pitch>',
      'Гла́съ | ѻ҆сьмы́й. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:church-slavonic-glas-ordinal-text-v1',
    [
      'Гла́съ | пе́рвый. | <pitch>',
      'Гла́съ | вторы́й. | <pitch>',
      'Гла́съ | тре́тїй. | <pitch>',
      'Гла́съ | четве́ртый. | <pitch>',
      'Гла́съ | пѧ́тый. | <pitch>',
      'Гла́съ | шесты́й. | <pitch>',
      'Гла́съ | седмы́й. | <pitch>',
      'Гла́съ | ѻ҆сьмы́й. | <pitch>',
    ],
  ],
  [
    'builtin:russian-glas-number-v1',
    [
      'Глас | 1. | <modeSign> | <pitch>',
      'Глас | 2. | <modeSign> | <pitch>',
      'Глас | 3. | <modeSign> | <pitch>',
      'Глас | 4. | <modeSign> | <pitch>',
      'Глас | 5. | greek:λ/π | <modeSign> | <pitch>',
      'Глас | 6. | greek:λ/π | <modeSign> | <pitch>',
      'Глас | 7. | <modeSign> | <pitch>',
      'Глас | 8. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:russian-glas-ordinal-v1',
    [
      'Глас | первый. | <modeSign> | <pitch>',
      'Глас | второй. | <modeSign> | <pitch>',
      'Глас | третий. | <modeSign> | <pitch>',
      'Глас | четвёртый. | <modeSign> | <pitch>',
      'Глас | пятый. | greek:λ/π | <modeSign> | <pitch>',
      'Глас | шестой. | greek:λ/π | <modeSign> | <pitch>',
      'Глас | седьмой. | <modeSign> | <pitch>',
      'Глас | восьмой. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:russian-glas-ordinal-text-v1',
    [
      'Глас | первый. | <pitch>',
      'Глас | второй. | <pitch>',
      'Глас | третий. | <pitch>',
      'Глас | четвёртый. | <pitch>',
      'Глас | пятый. | <pitch>',
      'Глас | шестой. | <pitch>',
      'Глас | седьмой. | <pitch>',
      'Глас | восьмой. | <pitch>',
    ],
  ],
  [
    'builtin:arabic-ordinal-v1',
    [
      'اللحن الأول | <pitch> | <modeSign>',
      'اللحن الثاني | <pitch> | <modeSign>',
      'اللحن الثالث | <pitch> | <modeSign>',
      'اللحن الرابع | <pitch> | <modeSign>',
      'اللحن الخامس | <pitch> | <modeSign> | greek:λ/π',
      'اللحن السادس | <pitch> | <modeSign> | greek:λ/π',
      'اللحن السابع | <pitch> | <modeSign>',
      'اللحن الثامن | <pitch> | <modeSign> | greek:λ/π',
    ],
  ],
  [
    'builtin:romanian-glas-number-v1',
    [
      'Glas | 1. | <modeSign> | <pitch>',
      'Glas | 2. | <modeSign> | <pitch>',
      'Glas | 3. | <modeSign> | <pitch>',
      'Glas | 4. | <modeSign> | <pitch>',
      'Glas | 5. | greek:λ/π | <modeSign> | <pitch>',
      'Glas | 6. | greek:λ/π | <modeSign> | <pitch>',
      'Glas | 7. | <modeSign> | <pitch>',
      'Glas | 8. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:romanian-glas-roman-numeral-v1',
    [
      'Glas | I. | <modeSign> | <pitch>',
      'Glas | II. | <modeSign> | <pitch>',
      'Glas | III. | <modeSign> | <pitch>',
      'Glas | IV. | <modeSign> | <pitch>',
      'Glas | V. | greek:λ/π | <modeSign> | <pitch>',
      'Glas | VI. | greek:λ/π | <modeSign> | <pitch>',
      'Glas | VII. | <modeSign> | <pitch>',
      'Glas | VIII. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:romanian-glas-ordinal-number-v1',
    [
      'Glasul | al 1-lea. | <modeSign> | <pitch>',
      'Glasul | al 2-lea. | <modeSign> | <pitch>',
      'Glasul | al 3-lea. | <modeSign> | <pitch>',
      'Glasul | al 4-lea. | <modeSign> | <pitch>',
      'Glasul | al 5-lea | lăturaș. | <modeSign> | <pitch>',
      'Glasul | al 6-lea | lăturaș. | <modeSign> | <pitch>',
      'Glasul | al 7-lea. | <modeSign> | <pitch>',
      'Glasul | al 8-lea | lăturaș. | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:romanian-glas-ordinal-roman-numeral-v1',
    [
      'Glasul | al I-lea. | <modeSign> | <pitch>',
      'Glasul | al II-lea. | <modeSign> | <pitch>',
      'Glasul | al III-lea. | <modeSign> | <pitch>',
      'Glasul | al IV-lea. | <modeSign> | <pitch>',
      'Glasul | al V-lea | lăturaș. | <modeSign> | <pitch>',
      'Glasul | al VI-lea | lăturaș. | <modeSign> | <pitch>',
      'Glasul | al VII-lea. | <modeSign> | <pitch>',
      'Glasul | al VIII-lea | lăturaș. | <modeSign> | <pitch>',
    ],
  ],
  [
    'builtin:romanian-glas-v1',
    [
      'Glas | <modeSign> | <pitch>',
      'Glas | <modeSign> | <pitch>',
      'Glas | <modeSign> | <pitch>',
      'Glas | <modeSign> | <pitch>',
      'Glas | greek:λ/π | <modeSign> | <pitch>',
      'Glas | greek:λ/π | <modeSign> | <pitch>',
      'Glas | <modeSign> | <pitch>',
      'Glas | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
];

describe('InitialMartyriaStyle', () => {
  it('renders the attested run sequence for every built-in style and mode', () => {
    expect(expectedRunsByStyle.map(([id]) => id)).toEqual(
      builtInInitialMartyriaStyles.map((style) => style.id),
    );

    for (const [styleId, expectedByMode] of expectedRunsByStyle) {
      const resolved = resolveInitialMartyriaConfiguration(
        createInitialMartyriaConfiguration(styleId),
      )!;
      for (let mode = 1; mode <= 8; mode++) {
        const element = ModeKeyElement.createFromTemplate(
          modeKeyTemplates.find((template) => template.mode === mode)!,
        );
        const encoded = resolveInitialMartyriaStyle({
          context: getInitialMartyriaContext(element),
          resolvedConfiguration: resolved,
          pageSetup: new PageSetup(),
        })
          .runs.map(encodeRun)
          .join(' | ');

        expect(`${styleId} mode ${mode}: ${encoded}`).toBe(
          `${styleId} mode ${mode}: ${expectedByMode[mode - 1]}`,
        );
      }
    }
  });

  it('sizes fixed separators from the main text font size', () => {
    for (const separator of ['plagal', 'modeSign', 'startingNote'] as const) {
      expect(getInitialMartyriaFixedSeparatorSize(separator, 20)).toBe(8.6);
    }
    expect(getInitialMartyriaFixedSeparatorSize('wordSpace', 20)).toBeNull();
  });

  it('defines every built-in ID once with a systematic localized name', () => {
    const styleIds = builtInInitialMartyriaStyles.map((style) => style.id);

    expect(new Set(styleIds).size).toBe(styleIds.length);
    expect(new Set(styleIds)).toEqual(
      new Set(Object.values(BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS)),
    );

    for (const style of builtInInitialMartyriaStyles) {
      const selector = getBuiltInInitialMartyriaStyleNameSelector(style.id);

      expect(selector).not.toBeNull();
      expect(selector?.(resources.en)).toBe(generateEnglishStyleName(style));

      for (const localeResources of Object.values(resources)) {
        expect(selector?.(localeResources)).toEqual(expect.any(String));
        expect(selector?.(localeResources).length).toBeGreaterThan(0);
      }
    }
  });

  it('resolves inherited, Standard, and explicit element configurations', () => {
    const documentConfiguration = createInitialMartyriaConfiguration(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishSignFirstV1,
    );
    const elementConfiguration = createInitialMartyriaConfiguration(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasV1,
    );

    expect(
      resolveInitialMartyriaStyleSelection({
        elementConfiguration: undefined,
        pageConfiguration: null,
      }).kind,
    ).toBe('standard');
    expect(
      resolveInitialMartyriaStyleSelection({
        elementConfiguration: undefined,
        pageConfiguration: documentConfiguration,
      }),
    ).toMatchObject({
      kind: 'custom',
      configuration: documentConfiguration,
    });
    expect(
      resolveInitialMartyriaStyleSelection({
        elementConfiguration: null,
        pageConfiguration: documentConfiguration,
      }).kind,
    ).toBe('standard');
    expect(
      resolveInitialMartyriaStyleSelection({
        elementConfiguration,
        pageConfiguration: documentConfiguration,
      }),
    ).toMatchObject({
      kind: 'custom',
      configuration: elementConfiguration,
    });
  });

  it('uses language-specific note-name transliterations', () => {
    const spanishStyle = builtInInitialMartyriaStyles.find(
      (item) =>
        item.id === BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoNumberV1,
    )!;

    expect(spanishStyle.transliteratedNoteNames).toMatchObject({
      languageTag: 'es',
      names: {
        [ModeSign.Pa]: 'Pa',
        [ModeSign.Vou]: 'Vu',
        [ModeSign.Ga]: 'Ga',
      },
    });

    const churchSlavonicStyle = builtInInitialMartyriaStyles.find(
      (item) =>
        item.id ===
        BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasNumberV1,
    )!;

    expect(churchSlavonicStyle.transliteratedNoteNames).toMatchObject({
      languageTag: 'cu',
      names: {
        [ModeSign.Pa]: 'Па',
        [ModeSign.Vou]: 'Ву',
        [ModeSign.Ga]: 'Га',
      },
    });

    const arabicStyle = builtInInitialMartyriaStyles.find(
      (item) => item.id === BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ArabicOrdinalV1,
    )!;

    expect(arabicStyle).toMatchObject({
      flowDirection: 'rtl',
      defaultAppearance: {
        mainFontFamily: 'Noto Naskh Arabic',
        greekFontFamily: 'GFS Didot',
      },
      transliteratedNoteNames: {
        languageTag: 'ar',
        direction: 'rtl',
        names: {
          [ModeSign.Ni]: 'ني',
          [ModeSign.Pa]: 'با',
          [ModeSign.Vou]: 'فو',
          [ModeSign.Ga]: 'غا',
          [ModeSign.Thi]: 'دي',
          [ModeSign.Ke]: 'كي',
          [ModeSign.Zo]: 'زو',
        },
      },
    });
  });

  it('defines Greek mode names without a mode-sign glyph', () => {
    const configuration = createInitialMartyriaConfiguration(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekModeNamesV1,
    );
    const expectedText = new Map([
      [1, ['Ἦχος', 'αʹ.']],
      [2, ['Ἦχος', 'βʹ.']],
      [3, ['Ἦχος', 'γʹ.']],
      [4, ['Ἦχος', 'δʹ.']],
      [5, ['Ἦχος', 'λ', 'π', 'αʹ.']],
      [6, ['Ἦχος', 'λ', 'π', 'βʹ.']],
      [7, ['Ἦχος', 'βαρύς.']],
      [8, ['Ἦχος', 'λ', 'π', 'δʹ.']],
    ]);

    for (const [mode, expected] of expectedText) {
      const element = ModeKeyElement.createFromTemplate(
        modeKeyTemplates.find((template) => template.mode === mode)!,
      );
      const runs = resolveInitialMartyriaStyle({
        context: getInitialMartyriaContext(element),
        resolvedConfiguration:
          resolveInitialMartyriaConfiguration(configuration)!,
        pageSetup: new PageSetup(),
      }).runs;
      const text = runs.flatMap((run) => {
        if (run.kind !== 'text') {
          return [];
        }
        return run.content.layout === 'inline'
          ? [run.content.text]
          : run.content.lines;
      });

      expect(text).toEqual(expected);
      expect(runs.some((run) => run.kind === 'glyph')).toBe(false);
      expect(runs.some((run) => run.kind === 'startingPitch')).toBe(true);
    }
  });

  it('defines English mode names without a mode-sign glyph', () => {
    const configuration = createInitialMartyriaConfiguration(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNamesV1,
    );
    configuration.transliterateNoteNames = true;
    const expectedText = new Map([
      [1, ['First', 'Mode.']],
      [2, ['Second', 'Mode.']],
      [3, ['Third', 'Mode.']],
      [4, ['Fourth', 'Mode.']],
      [5, ['Plagal of', 'First', 'Mode.']],
      [6, ['Plagal of', 'Second', 'Mode.']],
      [7, ['Grave', 'Mode.']],
      [8, ['Plagal of', 'Fourth', 'Mode.']],
    ]);

    for (const [mode, expected] of expectedText) {
      const element = ModeKeyElement.createFromTemplate(
        modeKeyTemplates.find((template) => template.mode === mode)!,
      );
      const runs = resolveInitialMartyriaStyle({
        context: getInitialMartyriaContext(element),
        resolvedConfiguration:
          resolveInitialMartyriaConfiguration(configuration)!,
        pageSetup: new PageSetup(),
      }).runs;
      const text = runs.flatMap((run) => {
        if (run.kind !== 'text') {
          return [];
        }
        return run.content.layout === 'inline'
          ? [run.content.text]
          : run.content.lines;
      });
      const startingPitch = runs.find((run) => run.kind === 'startingPitch');

      expect(text).toEqual(expected);
      expect(runs.some((run) => run.kind === 'glyph')).toBe(false);
      expect(startingPitch?.kind).toBe('startingPitch');
      if (startingPitch?.kind === 'startingPitch') {
        expect(startingPitch.noteText.names[ModeSign.Pa]).toBe('Pa');
      }
    }
  });

  it('applies one configuration appearance to text and musical glyphs', () => {
    const configuration = createInitialMartyriaConfiguration(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishSignFirstV1,
    );
    configuration.appearanceOverrides = {
      mainFontFamily: 'GFS Didot',
      fontSize: 18,
      color: '#123456',
      strokeWidth: 0.25,
      fontVariantCaps: 'small-caps',
      fontVariantNumeric: 'oldstyle-nums proportional-nums',
      fontVariantLigatures: 'no-common-ligatures',
      fontVariantAlternates: 'historical-forms',
    };

    const resolved = resolveInitialMartyriaConfiguration(configuration)!;
    const element = ModeKeyElement.createFromTemplate(
      modeKeyTemplates.find((template) => template.id === 100)!,
    );
    const runs = resolveInitialMartyriaStyle({
      context: getInitialMartyriaContext(element),
      resolvedConfiguration: resolved,
      pageSetup: new PageSetup(),
    }).runs;

    expect(resolved.mainAppearance).toMatchObject({
      fontFamily: 'GFS Didot',
      fontSize: 18,
      color: '#123456',
      strokeWidth: 0.25,
      fontVariantCaps: 'small-caps',
      fontVariantNumeric: 'oldstyle-nums proportional-nums',
      fontVariantLigatures: 'no-common-ligatures',
      fontVariantAlternates: 'historical-forms',
    });
    expect(
      runs
        .filter((run) => run.kind === 'glyph')
        .every((run) => {
          return (
            run.semantic === 'modeSign' &&
            run.appearance.color === '#123456' &&
            run.appearance.strokeWidth === 0.25
          );
        }),
    ).toBe(true);
  });

  it('uses the Greek font for original note names and permanent Greek text', () => {
    const configuration = createInitialMartyriaConfiguration(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishSignFirstV1,
    );
    configuration.appearanceOverrides.mainFontFamily = 'Source Serif';
    configuration.appearanceOverrides.greekFontFamily = 'GFS Didot';
    const element = ModeKeyElement.createFromTemplate(
      modeKeyTemplates.find((template) => template.id === 500)!,
    );

    const originalRuns = resolveInitialMartyriaStyle({
      context: getInitialMartyriaContext(element),
      resolvedConfiguration:
        resolveInitialMartyriaConfiguration(configuration)!,
      pageSetup: new PageSetup(),
    }).runs;
    const originalPitch = originalRuns.find(
      (run) => run.kind === 'startingPitch',
    );
    expect(originalPitch?.kind).toBe('startingPitch');
    if (originalPitch?.kind === 'startingPitch') {
      expect(originalPitch.noteText.appearance.fontFamily).toBe('GFS Didot');
    }

    configuration.transliterateNoteNames = true;
    const transliteratedRuns = resolveInitialMartyriaStyle({
      context: getInitialMartyriaContext(element),
      resolvedConfiguration:
        resolveInitialMartyriaConfiguration(configuration)!,
      pageSetup: new PageSetup(),
    }).runs;
    const transliteratedPitch = transliteratedRuns.find(
      (run) => run.kind === 'startingPitch',
    );
    expect(transliteratedPitch?.kind).toBe('startingPitch');
    if (transliteratedPitch?.kind === 'startingPitch') {
      expect(transliteratedPitch.noteText.appearance.fontFamily).toBe(
        'Source Serif',
      );
    }
    const plagal = transliteratedRuns.find(
      (run) =>
        run.kind === 'text' &&
        run.content.layout === 'stacked' &&
        run.content.lines[0] === 'λ' &&
        run.content.lines[1] === 'π',
    );
    expect(plagal?.kind).toBe('text');
    if (plagal?.kind === 'text') {
      expect(plagal.fontRole).toBe('greek');
      expect(plagal.languageTag).toBe('el');
      expect(plagal.appearance.fontFamily).toBe('GFS Didot');
    }
  });

  it('uses one font for every Greek style text role', () => {
    const configuration = createInitialMartyriaConfiguration(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1,
    );
    configuration.appearanceOverrides.mainFontFamily = 'Source Serif';
    configuration.appearanceOverrides.greekFontFamily = 'GFS Didot';
    const element = ModeKeyElement.createFromTemplate(
      modeKeyTemplates.find((template) => template.id === 500)!,
    );

    const resolved = resolveInitialMartyriaConfiguration(configuration)!;
    const runs = resolveInitialMartyriaStyle({
      context: getInitialMartyriaContext(element),
      resolvedConfiguration: resolved,
      pageSetup: new PageSetup(),
    }).runs;

    expect(resolved.mainAppearance.fontFamily).toBe('Source Serif');
    expect(resolved.greekAppearance.fontFamily).toBe('Source Serif');
    expect(
      runs
        .filter((run) => run.kind === 'text')
        .every((run) => run.appearance.fontFamily === 'Source Serif'),
    ).toBe(true);
    const startingPitch = runs.find((run) => run.kind === 'startingPitch');
    expect(startingPitch?.kind).toBe('startingPitch');
    if (startingPitch?.kind === 'startingPitch') {
      expect(startingPitch.noteText.appearance.fontFamily).toBe('Source Serif');
    }
  });

  it('clones appearance overrides without sharing mutable state', () => {
    const source = createInitialMartyriaConfiguration(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1,
    );
    source.appearanceOverrides.mainFontFamily = 'GFS Didot';

    const clone = cloneInitialMartyriaConfiguration(source);
    clone.appearanceOverrides.mainFontFamily = 'Source Serif';

    expect(source.appearanceOverrides.mainFontFamily).toBe('GFS Didot');
  });
});
