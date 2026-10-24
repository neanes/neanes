import { z } from 'zod';

import { searchableTextFields } from '@/automation/documents/textSearch';
import { ElementType } from '@/models/Element';
import { normalizeSearchText } from '@/utils/searchNormalization';

import { elementCollectionSchema } from './elementSchemas';
import { elementSearchShape } from './elementSearchSchema';

export const textSearchShape = {
  query: z
    .string()
    .min(1)
    .max(256)
    .refine(
      (value) => normalizeSearchText(value, { lyrics: true }).length > 0,
      'Query must contain searchable text.',
    ),
  caseSensitive: z.boolean().default(false),
  fields: z
    .array(z.enum(searchableTextFields))
    .min(1)
    .max(searchableTextFields.length)
    .optional(),
  scope: elementSearchShape.scope,
  offset: elementSearchShape.offset,
  limit: elementSearchShape.limit,
};
export const textSearchResultShape = {
  offset: z.number().int().nonnegative(),
  nextOffset: z.number().int().nonnegative().nullable(),
  matches: z.array(
    z.strictObject({
      elementRef: z.string().uuid(),
      collection: elementCollectionSchema,
      snippet: z.string(),
      matchStart: z.number().int().nonnegative(),
      matchEnd: z.number().int().positive(),
      elements: z
        .array(
          z.strictObject({
            elementRef: z.string().uuid(),
            elementType: z.enum(ElementType),
            index: z.number().int().nonnegative(),
            field: z.enum(searchableTextFields),
          }),
        )
        .min(1),
    }),
  ),
};
export type TextSearchQuery = z.output<z.ZodObject<typeof textSearchShape>>;
