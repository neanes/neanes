import { describe, expect, it } from 'vitest';

import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  getBuiltInInitialMartyriaStyle,
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
import { getInitialMartyriaLabelVariants } from '@/models/InitialMartyriaLexicon';
import { initialMartyriaPlagalAbbreviationWithModeSignIsOptional } from '@/models/InitialMartyriaRenderingConventions';
import { getInitialMartyriaContext } from '@/models/InitialMartyriaResolver';
import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_NUMBERING_SYSTEMS,
  initialMartyriaLanguageIds,
  type InitialMartyriaStartingNoteRun,
  type InitialMartyriaStructure,
} from '@/models/InitialMartyriaStyle';
import { ModeSign } from '@/models/Neumes';
import { BUILT_IN_PARAGRAPH_STYLE_IDS } from '@/models/ParagraphStyle';
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

/*
 * The label variants and plagal abbreviation choices of every language:
 * absent (the language's usual practice) first, then each explicit choice
 * where the language offers it.
 */
function getLanguageChoices() {
  return initialMartyriaLanguageIds.flatMap((languageId) =>
    [undefined, ...getInitialMartyriaLabelVariants(languageId)].flatMap(
      (labelVariant) =>
        (initialMartyriaPlagalAbbreviationWithModeSignIsOptional({
          languageId,
          labelVariant,
        })
          ? [undefined, true, false]
          : [undefined]
        ).map((plagalAbbreviationWithModeSign) => ({
          languageId,
          labelVariant,
          plagalAbbreviationWithModeSign,
        })),
    ),
  );
}

function getLegalInitialMartyriaStructures() {
  const structures: InitialMartyriaStructure[] = [];

  for (const choices of getLanguageChoices()) {
    for (const modeIdentificationMethod of initialMartyriaModeIdentificationMethods) {
      if (
        modeIdentificationMethod ===
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSignAlone
      ) {
        // No word for the mode, so no label variant either.
        if (choices.labelVariant == null) {
          for (const transliterateNoteNames of [false, true]) {
            structures.push({
              languageId: choices.languageId,
              plagalAbbreviationWithModeSign:
                choices.plagalAbbreviationWithModeSign,
              transliterateNoteNames,
              modeIdentificationMethod,
            });
          }
        }
        continue;
      }
      for (const form of initialMartyriaNumeralForms) {
        for (const numberingSystem of [
          undefined,
          ...Object.values(INITIAL_MARTYRIA_NUMBERING_SYSTEMS),
        ]) {
          for (const numeralQualifier of initialMartyriaNumeralQualifiers) {
            for (const modeNamingScheme of initialMartyriaModeNamingSchemes) {
              for (const transliterateNoteNames of [false, true]) {
                const common = {
                  ...choices,
                  numeralKind: form.numeralKind,
                  numeralQualifier,
                  modeNamingScheme,
                  transliterateNoteNames,
                };
                const structure: InitialMartyriaStructure =
                  modeIdentificationMethod === 'mode-sign'
                    ? { ...common, modeIdentificationMethod }
                    : {
                        ...common,
                        modeIdentificationMethod,
                        numeralStyle: form.numeralStyle,
                        numberingSystem,
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

function getUniqueLegalInitialMartyriaStructures() {
  const structuresByKey = new Map<string, InitialMartyriaStructure>();

  for (const choices of getLanguageChoices()) {
    for (const modeIdentificationMethod of initialMartyriaModeIdentificationMethods) {
      for (const transliterateNoteNames of [false, true]) {
        const variations = enumerateInitialMartyriaStructures({
          ...choices,
          modeIdentificationMethod,
          transliterateNoteNames,
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
  const plagalSign =
    structure.plagalAbbreviationWithModeSign == null
      ? undefined
      : structure.plagalAbbreviationWithModeSign
        ? 'plagal-sign'
        : 'no-plagal-sign';
  if (
    structure.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSignAlone
  ) {
    return [
      structure.languageId,
      structure.modeIdentificationMethod,
      structure.transliterateNoteNames ? 'transliterated' : 'original',
      plagalSign,
    ]
      .filter((part) => part != null)
      .join('/');
  }
  const numeralStyle =
    structure.modeIdentificationMethod === 'mode-sign'
      ? []
      : [structure.numeralStyle];
  const numberingSystem =
    structure.modeIdentificationMethod === 'mode-sign'
      ? []
      : [structure.numberingSystem];
  return [
    structure.languageId,
    structure.labelVariant,
    structure.modeIdentificationMethod,
    ...numeralStyle,
    structure.numeralKind,
    ...numberingSystem,
    structure.numeralQualifier,
    structure.modeNamingScheme,
    structure.transliterateNoteNames ? 'transliterated' : 'original',
    plagalSign,
  ]
    .filter((part) => part != null)
    .join('/');
}

function getAttestedStructure(label: string): InitialMartyriaStructure {
  return attestedStructures[label as keyof typeof attestedStructures];
}

function encodeCorpusRun(run: ReturnType<typeof resolve>['runs'][number]) {
  if (run.kind !== 'startingPitch') {
    return encodeRun(run);
  }
  const note = run.cluster.primary?.note;
  return note == null ? '<pitch>' : `<pitch:${run.noteText!.names[note]}>`;
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
      'Tono | 5. | <modeSign> | <pitch>',
      'Tono | 6. | <modeSign> | <pitch>',
      'Tono | 7. | <modeSign> | <pitch>',
      'Tono | 8. | <modeSign> | <pitch>',
    ],
  ],
  [
    'spanish-tono-roman-numeral',
    [
      'Tono | I. | <modeSign> | <pitch>',
      'Tono | II. | <modeSign> | <pitch>',
      'Tono | III. | <modeSign> | <pitch>',
      'Tono | IV. | <modeSign> | <pitch>',
      'Tono | V. | <modeSign> | <pitch>',
      'Tono | VI. | <modeSign> | <pitch>',
      'Tono | VII. | <modeSign> | <pitch>',
      'Tono | VIII. | <modeSign> | <pitch>',
    ],
  ],
  [
    'spanish-tono-ordinal',
    [
      'Tono | primero. | <modeSign> | <pitch>',
      'Tono | segundo. | <modeSign> | <pitch>',
      'Tono | tercero. | <modeSign> | <pitch>',
      'Tono | cuarto. | <modeSign> | <pitch>',
      'Tono | quinto. | <modeSign> | <pitch>',
      'Tono | sexto. | <modeSign> | <pitch>',
      'Tono | séptimo. | <modeSign> | <pitch>',
      'Tono | octavo. | <modeSign> | <pitch>',
    ],
  ],
  [
    'spanish-ordinal-tono',
    [
      'Primer | tono. | <modeSign> | <pitch>',
      'Segundo | tono. | <modeSign> | <pitch>',
      'Tercer | tono. | <modeSign> | <pitch>',
      'Cuarto | tono. | <modeSign> | <pitch>',
      'Quinto | tono. | <modeSign> | <pitch>',
      'Sexto | tono. | <modeSign> | <pitch>',
      'Séptimo | tono. | <modeSign> | <pitch>',
      'Octavo | tono. | <modeSign> | <pitch>',
    ],
  ],
  [
    'church-slavonic-glas-number',
    [
      'Гла́съ | 1. | <modeSign> | <pitch>',
      'Гла́съ | 2. | <modeSign> | <pitch>',
      'Гла́съ | 3. | <modeSign> | <pitch>',
      'Гла́съ | 4. | <modeSign> | <pitch>',
      'Гла́съ | 5. | <modeSign> | <pitch>',
      'Гла́съ | 6. | <modeSign> | <pitch>',
      'Гла́съ | 7. | <modeSign> | <pitch>',
      'Гла́съ | 8. | <modeSign> | <pitch>',
    ],
  ],
  [
    'church-slavonic-glas-cyrillic-numeral',
    [
      'Гла́съ | а҃. | <modeSign> | <pitch>',
      'Гла́съ | в҃. | <modeSign> | <pitch>',
      'Гла́съ | г҃. | <modeSign> | <pitch>',
      'Гла́съ | д҃. | <modeSign> | <pitch>',
      'Гла́съ | є҃. | <modeSign> | <pitch>',
      'Гла́съ | ѕ҃. | <modeSign> | <pitch>',
      'Гла́съ | з҃. | <modeSign> | <pitch>',
      'Гла́съ | и҃. | <modeSign> | <pitch>',
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
      'Гла́съ | пѧ́тый. | <modeSign> | <pitch>',
      'Гла́съ | шесты́й. | <modeSign> | <pitch>',
      'Гла́съ | седмы́й. | <modeSign> | <pitch>',
      'Гла́съ | ѻ҆сьмы́й. | <modeSign> | <pitch>',
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
      'Глас | 5. | <modeSign> | <pitch>',
      'Глас | 6. | <modeSign> | <pitch>',
      'Глас | 7. | <modeSign> | <pitch>',
      'Глас | 8. | <modeSign> | <pitch>',
    ],
  ],
  [
    'russian-glas-ordinal',
    [
      'Глас | первый. | <modeSign> | <pitch>',
      'Глас | второй. | <modeSign> | <pitch>',
      'Глас | третий. | <modeSign> | <pitch>',
      'Глас | четвёртый. | <modeSign> | <pitch>',
      'Глас | пятый. | <modeSign> | <pitch>',
      'Глас | шестой. | <modeSign> | <pitch>',
      'Глас | седьмой. | <modeSign> | <pitch>',
      'Глас | восьмой. | <modeSign> | <pitch>',
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
      'Glas | 1 | <modeSign> | <pitch>',
      'Glas | 2 | <modeSign> | <pitch>',
      'Glas | 3 | <modeSign> | <pitch>',
      'Glas | 4 | <modeSign> | <pitch>',
      'Glas | 5 | greek:λ/π | <modeSign> | <pitch>',
      'Glas | 6 | greek:λ/π | <modeSign> | <pitch>',
      'Glas | 7 | <modeSign> | <pitch>',
      'Glas | 8 | greek:λ/π | <modeSign> | <pitch>',
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
  [
    'english-mode-before-sign',
    [
      'Mode | <modeSign> | <pitch>',
      'Mode | <modeSign> | <pitch>',
      'Mode | <modeSign> | <pitch>',
      'Mode | <modeSign> | <pitch>',
      'Mode | greek:λ/π | <modeSign> | <pitch>',
      'Mode | greek:λ/π | <modeSign> | <pitch>',
      'Mode | <modeSign> | <pitch>',
      'Mode | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-plagal-first-without-plagal-sign',
    [
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
    ],
  ],
  [
    'english-tone-number-text',
    [
      'Tone | 1. | <pitch>',
      'Tone | 2. | <pitch>',
      'Tone | 3. | <pitch>',
      'Tone | 4. | <pitch>',
      'Tone | 5. | <pitch>',
      'Tone | 6. | <pitch>',
      'Tone | 7. | <pitch>',
      'Tone | 8. | <pitch>',
    ],
  ],
  [
    'english-ordinal-tone-text',
    [
      'First | Tone. | <pitch>',
      'Second | Tone. | <pitch>',
      'Third | Tone. | <pitch>',
      'Fourth | Tone. | <pitch>',
      'Fifth | Tone. | <pitch>',
      'Sixth | Tone. | <pitch>',
      'Seventh | Tone. | <pitch>',
      'Eighth | Tone. | <pitch>',
    ],
  ],
  [
    'english-tone-number',
    [
      'Tone | 1. | <modeSign> | <pitch>',
      'Tone | 2. | <modeSign> | <pitch>',
      'Tone | 3. | <modeSign> | <pitch>',
      'Tone | 4. | <modeSign> | <pitch>',
      'Tone | 5. | greek:λ/π | <modeSign> | <pitch>',
      'Tone | 6. | greek:λ/π | <modeSign> | <pitch>',
      'Tone | 7. | <modeSign> | <pitch>',
      'Tone | 8. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-tone-before-sign',
    [
      'Tone | <modeSign> | <pitch>',
      'Tone | <modeSign> | <pitch>',
      'Tone | <modeSign> | <pitch>',
      'Tone | <modeSign> | <pitch>',
      'Tone | greek:λ/π | <modeSign> | <pitch>',
      'Tone | greek:λ/π | <modeSign> | <pitch>',
      'Tone | <modeSign> | <pitch>',
      'Tone | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'spanish-tono-number-with-plagal-sign',
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
    'spanish-tono-sign-with-plagal-sign',
    [
      'Tono | <modeSign> | <pitch>',
      'Tono | <modeSign> | <pitch>',
      'Tono | <modeSign> | <pitch>',
      'Tono | <modeSign> | <pitch>',
      'Tono | greek:λ/π | <modeSign> | <pitch>',
      'Tono | greek:λ/π | <modeSign> | <pitch>',
      'Tono | <modeSign> | <pitch>',
      'Tono | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'greek-mode-sign-alone',
    [
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      'greek:λ/π | <modeSign> | <pitch>',
      'greek:λ/π | <modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      'greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-mode-sign-alone',
    [
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      'greek:λ/π | <modeSign> | <pitch>',
      'greek:λ/π | <modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      'greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'spanish-mode-sign-alone',
    [
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
    ],
  ],
  [
    'spanish-mode-sign-alone-with-plagal-sign',
    [
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      'greek:λ/π | <modeSign> | <pitch>',
      'greek:λ/π | <modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      'greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'russian-mode-sign-alone',
    [
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
      '<modeSign> | <pitch>',
    ],
  ],
  [
    'arabic-mode-sign-alone',
    [
      '<pitch> | <modeSign>',
      '<pitch> | <modeSign>',
      '<pitch> | <modeSign>',
      '<pitch> | <modeSign>',
      '<pitch> | <modeSign> | greek:λ/π',
      '<pitch> | <modeSign> | greek:λ/π',
      '<pitch> | <modeSign>',
      '<pitch> | <modeSign> | greek:λ/π',
    ],
  ],
];

describe('InitialMartyriaLexicon', () => {
  it.each([
    ['Spanish', INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish],
    ['Church Slavonic', INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic],
    ['Russian', INITIAL_MARTYRIA_LANGUAGE_IDS.Russian],
  ])(
    'omits the plagal abbreviation by default in every %s structure',
    (_, languageId) => {
      const structures = getLegalInitialMartyriaStructures().filter(
        (structure) =>
          structure.languageId === languageId &&
          structure.plagalAbbreviationWithModeSign !== true,
      );

      for (const structure of structures) {
        const style = styleFor(structure);
        for (const mode of [5, 6, 8]) {
          const { runs } = resolve(style, elementForMode(mode));
          expect(
            runs,
            `${describeStructure(structure)} mode ${mode}`,
          ).not.toContainEqual(
            expect.objectContaining({ semantic: 'plagalAbbreviation' }),
          );
        }
      }
    },
  );

  it('lists every legal structure as a row of the styles dialog', () => {
    // The styles dialog shows the enumerated structures as its wording list
    // and its per-row options only on the row matching the style, so every
    // style a user can have must match one of them.
    for (const structure of getLegalInitialMartyriaStructures()) {
      const rowKeys = enumerateInitialMartyriaStructures(structure).map(
        (row) => row.key,
      );
      expect(rowKeys, describeStructure(structure)).toContain(
        getInitialMartyriaStructureKey(structure),
      );
    }
  });

  it('renders every legal structure', () => {
    const legalKeys = new Set(
      getLegalInitialMartyriaStructures().map(getInitialMartyriaStructureKey),
    );
    const uniqueStructures = getUniqueLegalInitialMartyriaStructures();

    // Structures that render alike are represented once, while the
    // corpus still covers every legal combination of axes.
    expect(new Set(uniqueStructures.keys())).toEqual(legalKeys);

    const corpus = [...uniqueStructures.values()].map((structure) => ({
      structure: describeStructure(structure),
      modes: Array.from({ length: 8 }, (_, index) => {
        const mode = index + 1;
        const resolution = resolve(styleFor(structure), elementForMode(mode));
        const runs = resolution.runs.map(encodeCorpusRun).join(' | ');
        return `${mode}: ${runs}`;
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
      const style = styleFor(getAttestedStructure(label));
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

  it('reads the physical starting note from the element', () => {
    const context = getInitialMartyriaContext(elementForTemplate(506));

    expect(context).toMatchObject({
      physicalNote: ScaleNote.Ke,
      pitchCluster: { primary: { note: ModeSign.Pa } },
    });
  });

  it('uses the note names defined by each structure', () => {
    const resolveNoteText = (label: string) => {
      const startingPitch = resolve(
        styleFor(getAttestedStructure(label)),
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
      paragraphStyleId: BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
      greekParagraphStyleId: BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyriaGreek,
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
        expect(startingPitch.noteText!.names[ModeSign.Pa]).toBe('Πα');
      }
    }
  });
});
