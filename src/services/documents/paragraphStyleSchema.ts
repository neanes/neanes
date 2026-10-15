import { z } from 'zod';

// Values are interpolated into stylesheet declarations and selectors.
const styleId = z.string().regex(/^[A-Za-z0-9_-]+$/);
const cssValue = z
  .string()
  .trim()
  .min(1)
  .regex(/^[^;{}<>]+$/);

// Dimensions use CSS pixels; lineHeight is a unitless multiplier.
export const paragraphStyleOverridesSchema = z.strictObject({
  alignment: z.enum(['left', 'right', 'center', 'justify']).optional(),
  fontFamily: cssValue.optional(),
  fontSize: z.number().positive().optional(),
  fontStyle: cssValue.optional(),
  color: cssValue.optional(),
  strokeWidth: z.number().nonnegative().optional(),
  strokeColor: cssValue.optional(),
  lineHeight: z.number().positive().nullable().optional(),
  textDecoration: z.literal('underline').nullable().optional(),
  fontVariantCaps: cssValue.nullable().optional(),
  fontVariantNumeric: cssValue.nullable().optional(),
  fontVariantLigatures: cssValue.nullable().optional(),
  fontVariantAlternates: cssValue.nullable().optional(),
});

export const paragraphStyleDefinitionSchema = z.strictObject({
  id: styleId,
  // Only custom styles have a writable displayName. Built-in names are metadata.
  displayName: z.string().trim().min(1).optional(),
  parentStyleId: styleId.nullable(),
  overrides: paragraphStyleOverridesSchema,
});

export const paragraphStyleChangeSchema = z.discriminatedUnion('action', [
  z.strictObject({
    action: z.literal('create'),
    style: paragraphStyleDefinitionSchema,
  }),
  z.strictObject({
    action: z.literal('replace'),
    style: paragraphStyleDefinitionSchema,
  }),
  z.strictObject({ action: z.literal('delete'), id: styleId }),
]);
export type ParagraphStyleDefinition = z.infer<
  typeof paragraphStyleDefinitionSchema
>;
export type ParagraphStyleChange = z.infer<typeof paragraphStyleChangeSchema>;
