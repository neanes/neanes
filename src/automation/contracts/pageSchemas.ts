import { z } from 'zod';

import { elementSearchShape } from './elementSearchSchema';
import { selectedElementSchema } from './selectionSchema';

const index = z.number().int().nonnegative();
export const layoutReadShape = {
  expectedLayoutId: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  offset: index.default(0),
  limit: z.number().int().min(1).max(1000).default(100),
};
export const pageElementQueryShape = {
  ...layoutReadShape,
  pageNumber: z.number().int().positive(),
  regions: z
    .array(z.enum(['staff', 'header', 'footer', 'footnote']))
    .min(1)
    .max(4)
    .default(['staff', 'header', 'footer', 'footnote']),
  elementTypes: elementSearchShape.elementTypes,
  where: elementSearchShape.where,
};
const layoutResultShape = {
  layoutId: z.string().regex(/^[a-f0-9]{64}$/),
  pageCount: index,
  offset: index,
  nextOffset: index.nullable(),
};
const pageSummarySchema = z.strictObject({
  pageNumber: z.number().int().positive(),
  displayedPageNumber: z.number().int(),
  lineCount: index,
  occurrenceCount: index,
});
export const pageListResultShape = {
  ...layoutResultShape,
  pages: z.array(pageSummarySchema),
};
export const pageElementsResultShape = {
  ...layoutResultShape,
  page: pageSummarySchema,
  occurrences: z.array(
    selectedElementSchema.extend({
      region: z.enum(['staff', 'header', 'footer', 'footnote']),
      lineIndex: index.optional(),
    }),
  ),
};
export type PageElementQuery = z.output<
  z.ZodObject<typeof pageElementQueryShape>
>;
