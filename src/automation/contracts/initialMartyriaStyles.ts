import { z } from 'zod';

import {
  INITIAL_MARTYRIA_LABEL_VARIANTS,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_LETTERINGS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMBERING_SYSTEMS,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
} from '@/models/InitialMartyriaStyle';

const structureBase = {
  languageId: z.enum(INITIAL_MARTYRIA_LANGUAGE_IDS),
  labelVariant: z.enum(INITIAL_MARTYRIA_LABEL_VARIANTS).optional(),
  numeralKind: z.enum(INITIAL_MARTYRIA_NUMERAL_KINDS),
  numeralQualifier: z.enum(INITIAL_MARTYRIA_NUMERAL_QUALIFIERS),
  modeNamingScheme: z.enum(INITIAL_MARTYRIA_MODE_NAMING_SCHEMES),
  transliterateNoteNames: z.boolean(),
  plagalAbbreviationWithModeSign: z.boolean().optional(),
};

const structure = z.discriminatedUnion('modeIdentificationMethod', [
  z.strictObject({
    ...structureBase,
    modeIdentificationMethod: z.literal(
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    ),
  }),
  z.strictObject({
    ...structureBase,
    modeIdentificationMethod: z.enum([
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    ]),
    numeralStyle: z.enum(INITIAL_MARTYRIA_NUMERAL_STYLES),
    numberingSystem: z.enum(INITIAL_MARTYRIA_NUMBERING_SYSTEMS).optional(),
  }),
]);

const styleId = z.string().min(1);
export const initialMartyriaStyleSchema = z.strictObject({
  id: styleId,
  displayName: z.string().trim().min(1),
  structure,
  lettering: z.enum(INITIAL_MARTYRIA_LETTERINGS),
  paragraphStyleId: z.string().min(1),
  greekParagraphStyleId: z.string().min(1),
  useOrdinalForms: z.boolean(),
});

export const initialMartyriaStyleChangesSchema = z.strictObject({
  upsert: z.array(initialMartyriaStyleSchema).optional(),
  remove: z
    .array(z.strictObject({ id: styleId, replacementId: styleId }))
    .optional(),
  defaultStyleId: styleId.optional(),
});
export type InitialMartyriaStyleChanges = z.infer<
  typeof initialMartyriaStyleChangesSchema
>;
