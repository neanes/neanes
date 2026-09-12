import {
  getInitialMartyriaStructureVariations,
  initialMartyriaModeIdentificationMethods,
  initialMartyriaModeNamingSchemes,
  initialMartyriaNumberingSystems,
  type InitialMartyriaNumeralForm,
  initialMartyriaNumeralForms,
  initialMartyriaNumeralKinds,
  initialMartyriaNumeralQualifiers,
  type InitialMartyriaStructureVariation,
} from '@/models/InitialMartyriaGrammar';
import {
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaModeIdentificationMethod,
  type InitialMartyriaModeNamingScheme,
  type InitialMartyriaNumberingSystem,
  type InitialMartyriaNumeralKind,
  type InitialMartyriaNumeralQualifier,
  type InitialMartyriaStructure,
  withInitialMartyriaModeIdentificationMethod,
  withInitialMartyriaNumeralForm,
} from '@/models/InitialMartyriaStyle';

/**
 * One structural axis offered as a row of alternatives, each carrying the
 * structure it produces. The axis a row varies decides the type of the value
 * its alternatives are named by.
 */
export type InitialMartyriaStructureStrip =
  | {
      key: 'modeIdentificationMethod';
      variations: InitialMartyriaStructureVariation<InitialMartyriaModeIdentificationMethod>[];
    }
  | {
      key: 'numeralKind';
      variations: InitialMartyriaStructureVariation<InitialMartyriaNumeralKind>[];
    }
  | {
      key: 'numeralForm';
      variations: InitialMartyriaStructureVariation<InitialMartyriaNumeralForm>[];
    }
  | {
      key: 'numberingSystem';
      variations: InitialMartyriaStructureVariation<
        InitialMartyriaNumberingSystem | undefined
      >[];
    }
  | {
      key: 'numeralQualifier';
      variations: InitialMartyriaStructureVariation<InitialMartyriaNumeralQualifier>[];
    }
  | {
      key: 'modeNamingScheme';
      variations: InitialMartyriaStructureVariation<InitialMartyriaModeNamingScheme>[];
    };

/**
 * Every way the styles dialog lets a structure be changed, one row per axis.
 *
 * The rows are the only path between structures, so together they have to
 * reach every structure the grammar allows. A row whose axis has a single
 * possible value offers no alternative and is left out.
 */
export function getInitialMartyriaStructureStrips(
  structure: InitialMartyriaStructure,
): InitialMartyriaStructureStrip[] {
  const strips: InitialMartyriaStructureStrip[] = [
    {
      key: 'modeIdentificationMethod',
      variations: getInitialMartyriaStructureVariations(
        structure,
        initialMartyriaModeIdentificationMethods,
        withInitialMartyriaModeIdentificationMethod,
      ),
    },
  ];

  if (
    structure.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
  ) {
    // A sign prints no number, so only its spoken reading varies.
    strips.push({
      key: 'numeralKind',
      variations: getInitialMartyriaStructureVariations(
        structure,
        initialMartyriaNumeralKinds,
        (current, numeralKind) => ({ ...current, numeralKind }),
      ),
    });
  } else {
    strips.push({
      key: 'numeralForm',
      variations: getInitialMartyriaStructureVariations(
        structure,
        initialMartyriaNumeralForms,
        withInitialMartyriaNumeralForm,
      ),
    });

    /*
     * The repertoire is a choice about digits, so the row belongs to a
     * structure that prints them: asking for another repertoire of a name
     * written in words would answer by rewriting it in digits.
     */
    if (structure.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits) {
      strips.push({
        key: 'numberingSystem',
        variations: getInitialMartyriaStructureVariations(
          structure,
          initialMartyriaNumberingSystems,
          (current, numberingSystem) => ({ ...current, numberingSystem }),
        ),
      });
    }
  }

  strips.push(
    {
      key: 'numeralQualifier',
      variations: getInitialMartyriaStructureVariations(
        structure,
        initialMartyriaNumeralQualifiers,
        (current, numeralQualifier) => ({ ...current, numeralQualifier }),
      ),
    },
    {
      key: 'modeNamingScheme',
      variations: getInitialMartyriaStructureVariations(
        structure,
        initialMartyriaModeNamingSchemes,
        (current, modeNamingScheme) => ({ ...current, modeNamingScheme }),
      ),
    },
  );

  return strips.filter((strip) => strip.variations.length > 1);
}
