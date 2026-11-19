import { describe, expect, it } from 'vitest';

import {
  builtInInitialMartyriaStyles,
  getDefaultBuiltInInitialMartyriaStyle,
} from '@/models/InitialMartyriaBuiltInStyles';
import {
  enumerateInitialMartyriaStructures,
  getInitialMartyriaStructureKey,
  initialMartyriaModeIdentificationMethods,
  normalizeInitialMartyriaStructure,
} from '@/models/InitialMartyriaGrammar';
import { usesGreekScript } from '@/models/InitialMartyriaLexicon';
import { getInitialMartyriaStructureStrips } from '@/models/InitialMartyriaStructureStrips';
import {
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaStructure,
} from '@/models/InitialMartyriaStyle';

import { attestedStructures } from './InitialMartyriaStyle.testData';

/*
 * Every structure one step away: the tiles of every strip, plus the
 * transliteration checkbox that sits beneath them.
 */
function stepsFrom(structure: InitialMartyriaStructure) {
  const steps = getInitialMartyriaStructureStrips(structure).flatMap((strip) =>
    strip.variations.map((variation) => variation.structure),
  );

  if (!usesGreekScript(structure.languageId)) {
    steps.push(
      normalizeInitialMartyriaStructure({
        ...structure,
        transliterateNoteNames: !structure.transliterateNoteNames,
      }),
    );
  }

  return steps;
}

/** Every structure the dialog can be walked to, from the styles it offers. */
function getReachableStructureKeys(languageId: InitialMartyriaLanguageId) {
  const reached = new Set<string>();
  const queue = [
    getDefaultBuiltInInitialMartyriaStyle(languageId).structure,
    ...builtInInitialMartyriaStyles
      .filter((style) => style.structure.languageId === languageId)
      .map((style) => style.structure),
  ];

  for (const structure of queue) {
    reached.add(getInitialMartyriaStructureKey(structure));
  }

  while (queue.length > 0) {
    for (const step of stepsFrom(queue.shift()!)) {
      const key = getInitialMartyriaStructureKey(step);

      if (!reached.has(key)) {
        reached.add(key);
        queue.push(step);
      }
    }
  }

  return reached;
}

/** Every structure the language's grammar allows, by what it renders. */
function getLegalStructureKeys(languageId: InitialMartyriaLanguageId) {
  const legal = new Set<string>();

  for (const modeIdentificationMethod of initialMartyriaModeIdentificationMethods) {
    for (const transliterateNoteNames of [false, true]) {
      for (const { key } of enumerateInitialMartyriaStructures({
        languageId,
        modeIdentificationMethod,
        transliterateNoteNames,
      })) {
        legal.add(key);
      }
    }
  }

  return legal;
}

describe('InitialMartyriaStructureStrips', () => {
  /*
   * The strips are the only way to move between structures, so a structure
   * no sequence of them reaches is one the app can render but no user can
   * ask for. The Arabic-Indic digits were exactly that until the digit form
   * strip was added.
   */
  it('reaches every legal structure of every language', () => {
    const unreachable = Object.fromEntries(
      initialMartyriaLanguageIds
        .map((languageId) => {
          const reachable = getReachableStructureKeys(languageId);

          return [
            languageId,
            [...getLegalStructureKeys(languageId)].filter(
              (key) => !reachable.has(key),
            ).length,
          ] as const;
        })
        .filter(([, count]) => count > 0),
    );

    expect(unreachable).toEqual({});
  });

  /*
   * Romanian prints cardinals only in text and reads ordinals only for a
   * sign. A number form tile that switched the method would make the two
   * rows rewrite each other, so only the mode identification row may.
   */
  it('changes the mode identification only from its own strip', () => {
    for (const languageId of initialMartyriaLanguageIds) {
      for (const {
        structure,
      } of initialMartyriaModeIdentificationMethods.flatMap(
        (modeIdentificationMethod) =>
          enumerateInitialMartyriaStructures({
            languageId,
            modeIdentificationMethod,
            transliterateNoteNames: false,
          }),
      )) {
        for (const strip of getInitialMartyriaStructureStrips(structure).filter(
          (strip) => strip.key !== 'modeIdentificationMethod',
        )) {
          for (const variation of strip.variations) {
            expect(
              `${languageId} ${strip.key}: ${variation.structure.modeIdentificationMethod}`,
            ).toBe(
              `${languageId} ${strip.key}: ${structure.modeIdentificationMethod}`,
            );
          }
        }
      }
    }
  });

  it.each(['church-slavonic-glas-ordinal', 'russian-glas-ordinal'] as const)(
    'only offers a sign after Glas for %s',
    (style) => {
      const strips = getInitialMartyriaStructureStrips({
        ...attestedStructures[style],
        numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      });
      const signOnly = strips
        .find((strip) => strip.key === 'modeIdentificationMethod')!
        .variations.find(
          (variation) =>
            variation.value ===
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
        )!.structure;

      expect(signOnly.numeralQualifier).toBe(
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      );
      expect(getInitialMartyriaStructureStrips(signOnly)).not.toContainEqual(
        expect.objectContaining({ key: 'numeralQualifier' }),
      );
    },
  );

  it('offers no strip that has nothing to choose between', () => {
    for (const style of builtInInitialMartyriaStyles) {
      for (const strip of getInitialMartyriaStructureStrips(style.structure)) {
        expect(strip.variations.length).toBeGreaterThan(1);
      }
    }
  });
});
