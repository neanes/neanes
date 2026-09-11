import { describe, expect, it } from 'vitest';

import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  getBuiltInInitialMartyriaStyle,
  getDefaultBuiltInInitialMartyriaStyle,
} from '@/models/InitialMartyriaBuiltInStyles';
import {
  enumerateInitialMartyriaStructures,
  getInitialMartyriaStructureKey,
  initialMartyriaModeIdentificationMethods,
  initialMartyriaModeNamingSchemes,
  initialMartyriaNumeralForms,
  initialMartyriaNumeralQualifiers,
  isInitialMartyriaStructureSupported,
} from '@/models/InitialMartyriaGrammar';
import { getInitialMartyriaContext } from '@/models/InitialMartyriaResolver';
import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_NUMBERING_SYSTEMS,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaStartingNoteRun,
  type InitialMartyriaStructure,
} from '@/models/InitialMartyriaStyle';
import { ModeSign } from '@/models/Neumes';
import { ScaleNote } from '@/models/Scales';

import { attestedStructures } from './InitialMartyriaStyle.testData';
import {
  elementForMode,
  elementForTemplate,
  encodeRun,
  resolve,
  styleFor,
  textOf,
} from './InitialMartyriaStyle.testHelpers';

function getLegalInitialMartyriaStructures() {
  const structures: InitialMartyriaStructure[] = [];

  for (const languageId of initialMartyriaLanguageIds) {
    const languageDefault =
      getDefaultBuiltInInitialMartyriaStyle(languageId).structure;
    for (const modeIdentificationMethod of initialMartyriaModeIdentificationMethods) {
      for (const form of initialMartyriaNumeralForms) {
        for (const numberingSystem of [
          undefined,
          ...Object.values(INITIAL_MARTYRIA_NUMBERING_SYSTEMS),
        ]) {
          for (const numeralQualifier of initialMartyriaNumeralQualifiers) {
            for (const modeNamingScheme of initialMartyriaModeNamingSchemes) {
              for (const transliterateNoteNames of [false, true]) {
                const structure: InitialMartyriaStructure = {
                  ...languageDefault,
                  modeIdentificationMethod,
                  ...form,
                  numberingSystem,
                  numeralQualifier,
                  modeNamingScheme,
                  transliterateNoteNames,
                };
                if (isInitialMartyriaStructureSupported(structure)) {
                  structures.push(structure);
                }
              }
            }
          }
        }
      }
    }
  }

  return structures;
}

function getBrowseInitialMartyriaStructures() {
  const structuresByKey = new Map<string, InitialMartyriaStructure>();

  for (const languageId of initialMartyriaLanguageIds) {
    const languageDefault =
      getDefaultBuiltInInitialMartyriaStyle(languageId).structure;
    for (const modeIdentificationMethod of initialMartyriaModeIdentificationMethods) {
      for (const transliterateNoteNames of [false, true]) {
        const variations = enumerateInitialMartyriaStructures({
          languageId,
          modeIdentificationMethod,
          transliterateNoteNames,
          flowDirection: languageDefault.flowDirection,
        });
        for (const variation of variations) {
          if (!structuresByKey.has(variation.key)) {
            structuresByKey.set(variation.key, variation.structure);
          }
        }
      }
    }
  }

  return structuresByKey;
}

function describeStructure(structure: InitialMartyriaStructure) {
  return [
    structure.languageId,
    structure.modeIdentificationMethod,
    structure.numeralStyle,
    structure.numeralKind,
    structure.numberingSystem,
    structure.numeralQualifier,
    structure.modeNamingScheme,
    structure.transliterateNoteNames ? 'transliterated' : 'original',
    structure.flowDirection,
  ]
    .filter((part) => part != null)
    .join('/');
}

function encodeBrowseRun(run: ReturnType<typeof resolve>['runs'][number]) {
  if (run.kind !== 'startingPitch') {
    return encodeRun(run);
  }
  const note = run.cluster.primary?.note;
  return note == null ? '<pitch>' : `<pitch:${run.noteText.names[note]}>`;
}

const expectedRunsByStructure: [string, string[]][] = [
  [
    'traditional-greek',
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
    'greek-mode-names',
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
    'english-plagal-first',
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
    'english-mode-names',
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
    'english-authentic-counterpart-ordinal-digits-text',
    [
      '1st | Mode. | <pitch>',
      '2nd | Mode. | <pitch>',
      '3rd | Mode. | <pitch>',
      '4th | Mode. | <pitch>',
      'Plagal of | 1st | Mode. | <pitch>',
      'Plagal of | 2nd | Mode. | <pitch>',
      'Grave | Mode. | <pitch>',
      'Plagal of | 4th | Mode. | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-number-sign',
    [
      'Mode | <modeSign> | <pitch>',
      'Mode | <modeSign> | <pitch>',
      'Mode | <modeSign> | <pitch>',
      'Mode | <modeSign> | <pitch>',
      'greek:λ/π | Mode | <modeSign> | <pitch>',
      'greek:λ/π | Mode | <modeSign> | <pitch>',
      '<modeSign> | Mode | <pitch>',
      'greek:λ/π | Mode | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-number-text',
    [
      'Mode | 1. | <pitch>',
      'Mode | 2. | <pitch>',
      'Mode | 3. | <pitch>',
      'Mode | 4. | <pitch>',
      'Plagal of | Mode | 1. | <pitch>',
      'Plagal of | Mode | 2. | <pitch>',
      'Grave | Mode. | <pitch>',
      'Plagal of | Mode | 4. | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-roman-numeral-text',
    [
      'Mode | I. | <pitch>',
      'Mode | II. | <pitch>',
      'Mode | III. | <pitch>',
      'Mode | IV. | <pitch>',
      'Plagal of | Mode | I. | <pitch>',
      'Plagal of | Mode | II. | <pitch>',
      'Grave | Mode. | <pitch>',
      'Plagal of | Mode | IV. | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-number-word-text',
    [
      'Mode | One. | <pitch>',
      'Mode | Two. | <pitch>',
      'Mode | Three. | <pitch>',
      'Mode | Four. | <pitch>',
      'Plagal of | Mode | One. | <pitch>',
      'Plagal of | Mode | Two. | <pitch>',
      'Grave | Mode. | <pitch>',
      'Plagal of | Mode | Four. | <pitch>',
    ],
  ],
  [
    'english-sign-first',
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
    'english-plagal-class-ordinal-words-text',
    [
      'First | Mode. | <pitch>',
      'Second | Mode. | <pitch>',
      'Third | Mode. | <pitch>',
      'Fourth | Mode. | <pitch>',
      'First | Plagal | Mode. | <pitch>',
      'Second | Plagal | Mode. | <pitch>',
      'Grave | Mode. | <pitch>',
      'Fourth | Plagal | Mode. | <pitch>',
    ],
  ],
  [
    'english-plagal-class-ordinal-words',
    [
      'First | Mode. | <modeSign> | <pitch>',
      'Second | Mode. | <modeSign> | <pitch>',
      'Third | Mode. | <modeSign> | <pitch>',
      'Fourth | Mode. | <modeSign> | <pitch>',
      'First | Plagal | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Second | Plagal | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Fourth | Plagal | Mode. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-ordinal-plagal-text',
    [
      '1st | Mode. | <pitch>',
      '2nd | Mode. | <pitch>',
      '3rd | Mode. | <pitch>',
      '4th | Mode. | <pitch>',
      '1st | Plagal | Mode. | <pitch>',
      '2nd | Plagal | Mode. | <pitch>',
      'Grave | Mode. | <pitch>',
      '4th | Plagal | Mode. | <pitch>',
    ],
  ],
  [
    'english-ordinal-plagal',
    [
      '1st | Mode. | <modeSign> | <pitch>',
      '2nd | Mode. | <modeSign> | <pitch>',
      '3rd | Mode. | <modeSign> | <pitch>',
      '4th | Mode. | <modeSign> | <pitch>',
      '1st | Plagal | Mode. | greek:λ/π | <modeSign> | <pitch>',
      '2nd | Plagal | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      '4th | Plagal | Mode. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-ordinal',
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
    'english-mode-number',
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
    'english-mode-roman-numeral',
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
    'english-mode-number-word',
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
    'english-full-name',
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
    'english-authentic-counterpart-ordinal-digits',
    [
      '1st | Mode. | <modeSign> | <pitch>',
      '2nd | Mode. | <modeSign> | <pitch>',
      '3rd | Mode. | <modeSign> | <pitch>',
      '4th | Mode. | <modeSign> | <pitch>',
      'Plagal of | 1st | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Plagal of | 2nd | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Plagal of | 4th | Mode. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-number',
    [
      'Mode | 1. | <modeSign> | <pitch>',
      'Mode | 2. | <modeSign> | <pitch>',
      'Mode | 3. | <modeSign> | <pitch>',
      'Mode | 4. | <modeSign> | <pitch>',
      'Plagal of | Mode | 1. | greek:λ/π | <modeSign> | <pitch>',
      'Plagal of | Mode | 2. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Plagal of | Mode | 4. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-roman-numeral',
    [
      'Mode | I. | <modeSign> | <pitch>',
      'Mode | II. | <modeSign> | <pitch>',
      'Mode | III. | <modeSign> | <pitch>',
      'Mode | IV. | <modeSign> | <pitch>',
      'Plagal of | Mode | I. | greek:λ/π | <modeSign> | <pitch>',
      'Plagal of | Mode | II. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Plagal of | Mode | IV. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-number-word',
    [
      'Mode | One. | <modeSign> | <pitch>',
      'Mode | Two. | <modeSign> | <pitch>',
      'Mode | Three. | <modeSign> | <pitch>',
      'Mode | Four. | <modeSign> | <pitch>',
      'Plagal of | Mode | One. | greek:λ/π | <modeSign> | <pitch>',
      'Plagal of | Mode | Two. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Plagal of | Mode | Four. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'spanish-tono-number',
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
    'spanish-tono-roman-numeral',
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
    'spanish-tono-ordinal-number',
    [
      'Tono | 1.º. | <modeSign> | <pitch>',
      'Tono | 2.º. | <modeSign> | <pitch>',
      'Tono | 3.º. | <modeSign> | <pitch>',
      'Tono | 4.º. | <modeSign> | <pitch>',
      'Tono | 5.º. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | 6.º. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | 7.º. | <modeSign> | <pitch>',
      'Tono | 8.º. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'spanish-tono-ordinal',
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
    'spanish-ordinal-tono',
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
    'church-slavonic-glas-number',
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
    'church-slavonic-glas-cyrillic-numeral',
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
    'church-slavonic-glas-cyrillic-numeral-text',
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
    'church-slavonic-glas-ordinal',
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
    'church-slavonic-glas-ordinal-text',
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
    'russian-glas-number',
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
    'russian-glas-ordinal',
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
    'russian-glas-ordinal-text',
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
    'arabic-ordinal',
    [
      'اللحن | الأول | <pitch> | <modeSign>',
      'اللحن | الثاني | <pitch> | <modeSign>',
      'اللحن | الثالث | <pitch> | <modeSign>',
      'اللحن | الرابع | <pitch> | <modeSign>',
      'اللحن | الخامس | <pitch> | <modeSign> | greek:λ/π',
      'اللحن | السادس | <pitch> | <modeSign> | greek:λ/π',
      'اللحن | السابع | <pitch> | <modeSign>',
      'اللحن | الثامن | <pitch> | <modeSign> | greek:λ/π',
    ],
  ],
  [
    'arabic-ordinal-text',
    [
      'اللحن | الأول | <pitch>',
      'اللحن | الثاني | <pitch>',
      'اللحن | الثالث | <pitch>',
      'اللحن | الرابع | <pitch>',
      'اللحن | الخامس | <pitch>',
      'اللحن | السادس | <pitch>',
      'اللحن | السابع | <pitch>',
      'اللحن | الثامن | <pitch>',
    ],
  ],
  [
    'arabic-ordinal-digits',
    [
      'اللحن | 1 | <pitch> | <modeSign>',
      'اللحن | 2 | <pitch> | <modeSign>',
      'اللحن | 3 | <pitch> | <modeSign>',
      'اللحن | 4 | <pitch> | <modeSign>',
      'اللحن | 5 | <pitch> | <modeSign> | greek:λ/π',
      'اللحن | 6 | <pitch> | <modeSign> | greek:λ/π',
      'اللحن | 7 | <pitch> | <modeSign>',
      'اللحن | 8 | <pitch> | <modeSign> | greek:λ/π',
    ],
  ],
  [
    'arabic-ordinal-arabic-indic-digits',
    [
      'اللحن | ١ | <pitch> | <modeSign>',
      'اللحن | ٢ | <pitch> | <modeSign>',
      'اللحن | ٣ | <pitch> | <modeSign>',
      'اللحن | ٤ | <pitch> | <modeSign>',
      'اللحن | ٥ | <pitch> | <modeSign> | greek:λ/π',
      'اللحن | ٦ | <pitch> | <modeSign> | greek:λ/π',
      'اللحن | ٧ | <pitch> | <modeSign>',
      'اللحن | ٨ | <pitch> | <modeSign> | greek:λ/π',
    ],
  ],
  [
    'romanian-glas-number',
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
    'romanian-glas-roman-numeral',
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
    'romanian-glas-ordinal-number',
    [
      'Glasul | întâi. | <modeSign> | <pitch>',
      'Glasul | al 2-lea. | <modeSign> | <pitch>',
      'Glasul | al 3-lea. | <modeSign> | <pitch>',
      'Glasul | al 4-lea. | <modeSign> | <pitch>',
      'Glasul | al 5-lea. | greek:λ/π | <modeSign> | <pitch>',
      'Glasul | al 6-lea. | greek:λ/π | <modeSign> | <pitch>',
      'Glasul | al 7-lea. | <modeSign> | <pitch>',
      'Glasul | al 8-lea. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'romanian-glas-ordinal-roman-numeral',
    [
      'Glasul | întâi. | <modeSign> | <pitch>',
      'Glasul | al II-lea. | <modeSign> | <pitch>',
      'Glasul | al III-lea. | <modeSign> | <pitch>',
      'Glasul | al IV-lea. | <modeSign> | <pitch>',
      'Glasul | al V-lea. | greek:λ/π | <modeSign> | <pitch>',
      'Glasul | al VI-lea. | greek:λ/π | <modeSign> | <pitch>',
      'Glasul | al VII-lea. | <modeSign> | <pitch>',
      'Glasul | al VIII-lea. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'romanian-glas',
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
  [
    'indonesian-mode-names',
    [
      'Modus | Pertama. | <modeSign> | <pitch>',
      'Modus | Kedua. | <modeSign> | <pitch>',
      'Modus | Ketiga. | <modeSign> | <pitch>',
      'Modus | Keempat. | <modeSign> | <pitch>',
      'Plagal dari | Modus | Pertama. | greek:λ/π | <modeSign> | <pitch>',
      'Plagal dari | Modus | Kedua. | greek:λ/π | <modeSign> | <pitch>',
      'Modus | Berat. | <modeSign> | <pitch>',
      'Plagal dari | Modus | Keempat. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
];

type ExpectedModePronunciations = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

const greekAuthenticCounterpartOrdinalPronunciations: ExpectedModePronunciations =
  [
    'Ήχος Πρώτος',
    'Ήχος Δεύτερος',
    'Ήχος Τρίτος',
    'Ήχος Τέταρτος',
    'Ήχος Πλάγιος του Πρώτου',
    'Ήχος Πλάγιος του Δευτέρου',
    'Ήχος Βαρύς',
    'Ήχος Πλάγιος του Τετάρτου',
  ];

const englishAuthenticCounterpartOrdinalPronunciations: ExpectedModePronunciations =
  [
    'First Mode',
    'Second Mode',
    'Third Mode',
    'Fourth Mode',
    'Plagal of First Mode',
    'Plagal of Second Mode',
    'Grave Mode',
    'Plagal of Fourth Mode',
  ];

const englishAuthenticCounterpartCardinalPronunciations: ExpectedModePronunciations =
  [
    'Mode One',
    'Mode Two',
    'Mode Three',
    'Mode Four',
    'Plagal of Mode One',
    'Plagal of Mode Two',
    'Grave Mode',
    'Plagal of Mode Four',
  ];

const englishPlagalClassOrdinalPronunciations: ExpectedModePronunciations = [
  'First Mode',
  'Second Mode',
  'Third Mode',
  'Fourth Mode',
  'First Plagal Mode',
  'Second Plagal Mode',
  'Grave Mode',
  'Fourth Plagal Mode',
];

const englishAbsoluteOrdinalPronunciations: ExpectedModePronunciations = [
  'First Mode',
  'Second Mode',
  'Third Mode',
  'Fourth Mode',
  'Fifth Mode',
  'Sixth Mode',
  'Seventh Mode',
  'Eighth Mode',
];

const englishAbsoluteCardinalPronunciations: ExpectedModePronunciations = [
  'Mode One',
  'Mode Two',
  'Mode Three',
  'Mode Four',
  'Mode Five',
  'Mode Six',
  'Mode Seven',
  'Mode Eight',
];

const spanishAbsoluteCardinalPronunciations: ExpectedModePronunciations = [
  'Tono uno',
  'Tono dos',
  'Tono tres',
  'Tono cuatro',
  'Tono cinco',
  'Tono seis',
  'Tono siete',
  'Tono ocho',
];

const spanishPostnominalOrdinalPronunciations: ExpectedModePronunciations = [
  'Tono primero',
  'Tono segundo',
  'Tono tercero',
  'Tono cuarto',
  'Tono quinto',
  'Tono sexto',
  'Tono séptimo',
  'Tono octavo',
];

const spanishPrenominalOrdinalPronunciations: ExpectedModePronunciations = [
  'Primer tono',
  'Segundo tono',
  'Tercer tono',
  'Cuarto tono',
  'Quinto tono',
  'Sexto tono',
  'Séptimo tono',
  'Octavo tono',
];

const churchSlavonicAbsoluteOrdinalPronunciations: ExpectedModePronunciations =
  [
    'Гла́съ пе́рвый',
    'Гла́съ вторы́й',
    'Гла́съ тре́тїй',
    'Гла́съ четве́ртый',
    'Гла́съ пѧ́тый',
    'Гла́съ шесты́й',
    'Гла́съ седмы́й',
    'Гла́съ ѻ҆сьмы́й',
  ];

const russianAbsoluteOrdinalPronunciations: ExpectedModePronunciations = [
  'Глас первый',
  'Глас второй',
  'Глас третий',
  'Глас четвёртый',
  'Глас пятый',
  'Глас шестой',
  'Глас седьмой',
  'Глас восьмой',
];

const arabicAbsoluteOrdinalPronunciations: ExpectedModePronunciations = [
  'اللحن الأول',
  'اللحن الثاني',
  'اللحن الثالث',
  'اللحن الرابع',
  'اللحن الخامس',
  'اللحن السادس',
  'اللحن السابع',
  'اللحن الثامن',
];

const romanianAbsoluteCardinalPronunciations: ExpectedModePronunciations = [
  'Glas unu',
  'Glas doi',
  'Glas trei',
  'Glas patru',
  'Glas cinci',
  'Glas șase',
  'Glas șapte',
  'Glas opt',
];

const romanianAbsoluteOrdinalPronunciations: ExpectedModePronunciations = [
  'Glasul întâi',
  'Glasul al doilea',
  'Glasul al treilea',
  'Glasul al patrulea',
  'Glasul al cincilea',
  'Glasul al șaselea',
  'Glasul al șaptelea',
  'Glasul al optulea',
];

const romanianAuthenticCounterpartOrdinalPronunciations: ExpectedModePronunciations =
  [
    'Glasul întâi',
    'Glasul al doilea',
    'Glasul al treilea',
    'Glasul al patrulea',
    'Glasul lăturaș întâi',
    'Glasul lăturaș al doilea',
    'Glasul al șaptelea',
    'Glasul lăturaș al patrulea',
  ];

const indonesianAuthenticCounterpartOrdinalPronunciations: ExpectedModePronunciations =
  [
    'Modus Pertama',
    'Modus Kedua',
    'Modus Ketiga',
    'Modus Keempat',
    'Plagal dari Modus Pertama',
    'Plagal dari Modus Kedua',
    'Modus Berat',
    'Plagal dari Modus Keempat',
  ];

const expectedStartingNotePhrasesByLanguage: Record<
  InitialMartyriaLanguageId,
  ExpectedModePronunciations
> = {
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: [
    'εκ του Πα',
    'εκ του Δι',
    'εκ του Γα',
    'εκ του Δι',
    'εκ του Πα',
    'εκ του Πα',
    'εκ του Γα',
    'εκ του Νη',
  ],
  [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: [
    'from Pa',
    'from Di',
    'from Ga',
    'from Di',
    'from Pa',
    'from Pa',
    'from Ga',
    'from Ni',
  ],
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: [
    'desde Pa',
    'desde Di',
    'desde Ga',
    'desde Di',
    'desde Pa',
    'desde Pa',
    'desde Ga',
    'desde Ni',
  ],
  [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: [
    'ѿ Па',
    'ѿ Ди',
    'ѿ Га',
    'ѿ Ди',
    'ѿ Па',
    'ѿ Па',
    'ѿ Га',
    'ѿ Ни',
  ],
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: [
    'от Па',
    'от Ди',
    'от Га',
    'от Ди',
    'от Па',
    'от Па',
    'от Га',
    'от Ни',
  ],
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: [
    'من با',
    'من ذي',
    'من غا',
    'من ذي',
    'من با',
    'من با',
    'من غا',
    'من ني',
  ],
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: [
    'de la Pa',
    'de la Di',
    'de la Ga',
    'de la Di',
    'de la Pa',
    'de la Pa',
    'de la Ga',
    'de la Ni',
  ],
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian]: [
    'dari Pa',
    'dari Di',
    'dari Ga',
    'dari Di',
    'dari Pa',
    'dari Pa',
    'dari Ga',
    'dari Ni',
  ],
};

const expectedPronunciationsByStructure: [
  string,
  ExpectedModePronunciations,
][] = [
  ['traditional-greek', greekAuthenticCounterpartOrdinalPronunciations],
  ['greek-mode-names', greekAuthenticCounterpartOrdinalPronunciations],
  ['english-plagal-first', englishAuthenticCounterpartOrdinalPronunciations],
  ['english-mode-names', englishAuthenticCounterpartOrdinalPronunciations],
  [
    'english-authentic-counterpart-ordinal-digits-text',
    englishAuthenticCounterpartOrdinalPronunciations,
  ],
  [
    'english-authentic-counterpart-number-sign',
    englishAuthenticCounterpartCardinalPronunciations,
  ],
  [
    'english-authentic-counterpart-number-text',
    englishAuthenticCounterpartCardinalPronunciations,
  ],
  [
    'english-authentic-counterpart-roman-numeral-text',
    englishAuthenticCounterpartCardinalPronunciations,
  ],
  [
    'english-authentic-counterpart-number-word-text',
    englishAuthenticCounterpartCardinalPronunciations,
  ],
  ['english-sign-first', englishPlagalClassOrdinalPronunciations],
  [
    'english-plagal-class-ordinal-words-text',
    englishPlagalClassOrdinalPronunciations,
  ],
  [
    'english-plagal-class-ordinal-words',
    englishPlagalClassOrdinalPronunciations,
  ],
  ['english-ordinal-plagal-text', englishPlagalClassOrdinalPronunciations],
  ['english-ordinal-plagal', englishPlagalClassOrdinalPronunciations],
  ['english-ordinal', englishAbsoluteOrdinalPronunciations],
  ['english-mode-number', englishAbsoluteCardinalPronunciations],
  ['english-mode-roman-numeral', englishAbsoluteCardinalPronunciations],
  ['english-mode-number-word', englishAbsoluteCardinalPronunciations],
  ['english-full-name', englishAuthenticCounterpartOrdinalPronunciations],
  [
    'english-authentic-counterpart-ordinal-digits',
    englishAuthenticCounterpartOrdinalPronunciations,
  ],
  [
    'english-authentic-counterpart-number',
    englishAuthenticCounterpartCardinalPronunciations,
  ],
  [
    'english-authentic-counterpart-roman-numeral',
    englishAuthenticCounterpartCardinalPronunciations,
  ],
  [
    'english-authentic-counterpart-number-word',
    englishAuthenticCounterpartCardinalPronunciations,
  ],
  ['spanish-tono-number', spanishAbsoluteCardinalPronunciations],
  ['spanish-tono-roman-numeral', spanishPostnominalOrdinalPronunciations],
  ['spanish-tono-ordinal-number', spanishPostnominalOrdinalPronunciations],
  ['spanish-tono-ordinal', spanishPostnominalOrdinalPronunciations],
  ['spanish-ordinal-tono', spanishPrenominalOrdinalPronunciations],
  ['church-slavonic-glas-number', churchSlavonicAbsoluteOrdinalPronunciations],
  [
    'church-slavonic-glas-cyrillic-numeral',
    churchSlavonicAbsoluteOrdinalPronunciations,
  ],
  [
    'church-slavonic-glas-cyrillic-numeral-text',
    churchSlavonicAbsoluteOrdinalPronunciations,
  ],
  ['church-slavonic-glas-ordinal', churchSlavonicAbsoluteOrdinalPronunciations],
  [
    'church-slavonic-glas-ordinal-text',
    churchSlavonicAbsoluteOrdinalPronunciations,
  ],
  ['russian-glas-number', russianAbsoluteOrdinalPronunciations],
  ['russian-glas-ordinal', russianAbsoluteOrdinalPronunciations],
  ['russian-glas-ordinal-text', russianAbsoluteOrdinalPronunciations],
  ['arabic-ordinal', arabicAbsoluteOrdinalPronunciations],
  ['arabic-ordinal-text', arabicAbsoluteOrdinalPronunciations],
  ['arabic-ordinal-digits', arabicAbsoluteOrdinalPronunciations],
  ['arabic-ordinal-arabic-indic-digits', arabicAbsoluteOrdinalPronunciations],
  ['romanian-glas-number', romanianAbsoluteCardinalPronunciations],
  ['romanian-glas-roman-numeral', romanianAbsoluteCardinalPronunciations],
  ['romanian-glas-ordinal-number', romanianAbsoluteOrdinalPronunciations],
  [
    'romanian-glas-ordinal-roman-numeral',
    romanianAbsoluteOrdinalPronunciations,
  ],
  ['romanian-glas', romanianAuthenticCounterpartOrdinalPronunciations],
  [
    'indonesian-mode-names',
    indonesianAuthenticCounterpartOrdinalPronunciations,
  ],
];

describe('InitialMartyriaLexicon', () => {
  it('renders and pronounces every legal structure exposed by the browse view', () => {
    const legalKeys = new Set(
      getLegalInitialMartyriaStructures().map(getInitialMartyriaStructureKey),
    );
    const browseStructures = getBrowseInitialMartyriaStructures();

    // The browse view de-duplicates structures that render and read alike.
    // Its tiles must nevertheless cover every legal combination of axes.
    expect(new Set(browseStructures.keys())).toEqual(legalKeys);

    const corpus = [...browseStructures.values()].map((structure) => ({
      structure: describeStructure(structure),
      modes: Array.from({ length: 8 }, (_, index) => {
        const mode = index + 1;
        const resolution = resolve(styleFor(structure), elementForMode(mode));
        const runs = resolution.runs.map(encodeBrowseRun).join(' | ');
        return `${mode}: ${runs} = ${resolution.pronunciation}`;
      }),
    }));
    expect(new Set(corpus.map((entry) => entry.structure)).size).toBe(
      corpus.length,
    );
    expect(corpus).toMatchSnapshot();
  });

  it('renders the attested run sequence for every attested structure and mode', () => {
    expect(expectedRunsByStructure.map(([label]) => label)).toEqual(
      Object.keys(attestedStructures),
    );

    for (const [label, expectedByMode] of expectedRunsByStructure) {
      const style = styleFor(attestedStructures[label]);
      for (let mode = 1; mode <= 8; mode++) {
        const encoded = resolve(style, elementForMode(mode))
          .runs.map(encodeRun)
          .join(' | ');

        expect(`${label} mode ${mode}: ${encoded}`).toBe(
          `${label} mode ${mode}: ${expectedByMode[mode - 1]}`,
        );
      }
    }
  });

  it('pronounces every attested structure in every language for every mode', () => {
    expect(expectedPronunciationsByStructure.map(([label]) => label)).toEqual(
      Object.keys(attestedStructures),
    );

    for (const [label, expectedByMode] of expectedPronunciationsByStructure) {
      const structure = attestedStructures[label];
      const style = styleFor(structure);
      for (let mode = 1; mode <= 8; mode++) {
        const resolution = resolve(style, elementForMode(mode));
        const expectedStartingNote =
          expectedStartingNotePhrasesByLanguage[structure.languageId][mode - 1];

        expect(`${label} mode ${mode}: ${resolution.pronunciation}`).toBe(
          `${label} mode ${mode}: ${expectedByMode[mode - 1]} ${expectedStartingNote}`,
        );
      }
    }
  });

  it('pronounces the physical starting note in every language', () => {
    const element = elementForTemplate(506);
    const context = getInitialMartyriaContext(element);
    const expectedByStructure: [string, string][] = [
      ['greek-mode-names', 'Ήχος Πλάγιος του Πρώτου εκ του Κε'],
      ['english-mode-names', 'Plagal of First Mode from Ke'],
      ['spanish-tono-ordinal', 'Tono quinto desde Ke'],
      ['church-slavonic-glas-ordinal', 'Гла́съ пѧ́тый ѿ Ке'],
      ['russian-glas-ordinal', 'Глас пятый от Ке'],
      ['arabic-ordinal', 'اللحن الخامس من كه'],
      ['romanian-glas', 'Glasul lăturaș întâi de la Ke'],
    ];

    expect(context).toMatchObject({
      physicalNote: ScaleNote.Ke,
      pitchCluster: { primary: { note: ModeSign.Pa } },
    });

    for (const [label, expected] of expectedByStructure) {
      expect(
        resolve(styleFor(attestedStructures[label]), element).pronunciation,
      ).toBe(expected);
    }
  });

  it('preserves the physical starting note octave in the pronunciation', () => {
    const resolution = resolve(
      styleFor(attestedStructures['english-mode-names']),
      elementForTemplate(803),
    );

    expect(resolution.pronunciation).toBe("Plagal of Fourth Mode from Ni'");
  });

  it('uses the note names defined by each structure', () => {
    const resolveNoteText = (label: string) => {
      const startingPitch = resolve(
        styleFor(attestedStructures[label]),
        elementForMode(1),
      ).runs.find(
        (run): run is InitialMartyriaStartingNoteRun =>
          run.kind === 'startingPitch',
      )!;
      return startingPitch.noteText;
    };

    expect(resolveNoteText('spanish-tono-number')).toMatchObject({
      languageTag: 'el',
      names: {
        [ModeSign.Pa]: 'Πα',
        [ModeSign.Vou]: 'Βου',
        [ModeSign.Ga]: 'Γα',
      },
    });

    expect(resolveNoteText('church-slavonic-glas-number')).toMatchObject({
      languageTag: 'cu',
      names: {
        [ModeSign.Pa]: 'Па',
        [ModeSign.Vou]: 'Ву',
        [ModeSign.Ga]: 'Га',
      },
    });

    expect(resolveNoteText('russian-glas-number')).toMatchObject({
      languageTag: 'ru',
      names: {
        [ModeSign.Pa]: 'Па',
        [ModeSign.Vou]: 'Ву',
        [ModeSign.Ga]: 'Га',
      },
    });

    const romanianTransliterated = resolve(
      styleFor({
        ...attestedStructures['romanian-glas-number'],
        transliterateNoteNames: true,
      }),
      elementForMode(1),
    ).runs.find(
      (run): run is InitialMartyriaStartingNoteRun =>
        run.kind === 'startingPitch',
    )!.noteText;
    expect(romanianTransliterated).toMatchObject({
      languageTag: 'ro',
      names: {
        [ModeSign.Pa]: 'Pa',
        [ModeSign.Vou]: 'Vu',
        [ModeSign.Ga]: 'Ga',
      },
    });

    const arabicStyle = getBuiltInInitialMartyriaStyle(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ArabicOrdinal,
    );

    expect(arabicStyle).toMatchObject({
      structure: { flowDirection: 'rtl' },
      paragraphStyleOverrides: { fontFamily: 'Noto Naskh Arabic' },
      greekFontFamily: 'GFS Didot',
    });
    expect(resolveNoteText('arabic-ordinal')).toMatchObject({
      languageTag: 'el',
      direction: 'ltr',
      names: {
        [ModeSign.Ni]: 'Νη',
        [ModeSign.Pa]: 'Πα',
        [ModeSign.Vou]: 'Βου',
        [ModeSign.Ga]: 'Γα',
        [ModeSign.Thi]: 'Δι',
        [ModeSign.Ke]: 'Κε',
        [ModeSign.Zo]: 'Ζω',
      },
    });
  });

  it('defines Greek mode names without a mode-sign glyph', () => {
    const style = styleFor(attestedStructures['greek-mode-names']);
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
      const runs = resolve(style, elementForMode(mode)).runs;

      expect(textOf(runs)).toEqual(expected);
      expect(runs.some((run) => run.kind === 'glyph')).toBe(false);
      expect(runs.some((run) => run.kind === 'startingPitch')).toBe(true);
    }
  });

  it('defines English mode names without a mode-sign glyph', () => {
    const style = styleFor(attestedStructures['english-mode-names']);
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
      const runs = resolve(style, elementForMode(mode)).runs;
      const startingPitch = runs.find((run) => run.kind === 'startingPitch');

      expect(textOf(runs)).toEqual(expected);
      expect(runs.some((run) => run.kind === 'glyph')).toBe(false);
      expect(startingPitch?.kind).toBe('startingPitch');
      if (startingPitch?.kind === 'startingPitch') {
        expect(startingPitch.noteText.names[ModeSign.Pa]).toBe('Πα');
      }
    }
  });
});
