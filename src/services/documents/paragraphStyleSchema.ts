import { z } from 'zod';

// Values are interpolated into stylesheet declarations and selectors.
export const paragraphStyleIdSchema = z.string().regex(/^[A-Za-z0-9_-]+$/);
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
  id: paragraphStyleIdSchema,
  // Only custom styles have a writable displayName. Built-in names are metadata.
  displayName: z.string().trim().min(1).optional(),
  parentStyleId: paragraphStyleIdSchema.nullable(),
  overrides: paragraphStyleOverridesSchema,
});

export type ParagraphStyleDefinition = z.infer<
  typeof paragraphStyleDefinitionSchema
>;
