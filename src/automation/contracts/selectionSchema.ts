import { z } from 'zod';

import { ElementType } from '@/models/Element';

import { elementCollectionSchema } from './elementSchemas';

const index = z.number().int().nonnegative();
export const selectedElementSchema = z.strictObject({
  elementRef: z.string().uuid(),
  elementType: z.enum(ElementType),
  collection: elementCollectionSchema,
  index,
});
export const selectionSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.enum([
      'element',
      'lyrics',
      'annotation',
      'alternateLine',
      'headerFooter',
    ]),
    target: selectedElementSchema,
  }),
  z.strictObject({
    kind: z.literal('range'),
    collection: z.strictObject({ kind: z.literal('staff') }),
    start: index,
    end: index,
    anchorRef: z.string().uuid(),
    focusRef: z.string().uuid(),
  }),
]);
export const selectionResultShape = {
  status: z.enum(['active', 'remembered', 'unavailable']),
  selection: selectionSchema.nullable(),
};
export type SelectionResult = {
  status: z.infer<typeof selectionResultShape.status>;
  selection: z.infer<typeof selectionSchema> | null;
};
