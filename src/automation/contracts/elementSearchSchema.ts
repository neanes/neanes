import { z } from 'zod';

import { ElementType } from '@/models/Element';

import { elementPredicateSchema } from './elementPredicates';
import {
  discoveredElementSchema,
  elementCollectionSchema,
  elementQueryShape,
} from './elementSchemas';

const index = z.number().int().nonnegative();
export const elementSearchShape = {
  scope: z
    .discriminatedUnion('kind', [
      z.strictObject({ kind: z.literal('document') }),
      z.strictObject({
        kind: z.literal('collection'),
        collection: elementCollectionSchema,
        includeDescendants: z.boolean().default(false),
      }),
    ])
    .default({ kind: 'document' }),
  elementTypes: z.array(z.enum(ElementType)).min(1).max(11).optional(),
  where: elementPredicateSchema.optional(),
  properties: elementQueryShape.properties.default([]),
  includeContent: z.boolean().default(false),
  offset: index.default(0),
  limit: z.number().int().min(1).max(1000).default(100),
};
export const elementLookupShape = {
  elementRef: z.string().uuid(),
  before: z.number().int().min(0).max(499).default(0),
  after: z.number().int().min(0).max(499).default(0),
  properties: elementQueryShape.properties,
  includeContent: z.boolean().default(false),
};
export const elementSearchResultShape = {
  offset: index,
  nextOffset: index.nullable(),
  elements: z.array(
    z.discriminatedUnion('elementType', [
      discoveredElementSchema.options[0].extend({
        collection: elementCollectionSchema,
      }),
      ...discoveredElementSchema.options
        .slice(1)
        .map((schema) =>
          schema.extend({ collection: elementCollectionSchema }),
        ),
    ]),
  ),
};
export const elementLookupResultShape = {
  elementRef: z.string().uuid(),
  collection: elementCollectionSchema,
  collectionSize: index,
  start: index,
  end: index,
  elements: z.array(discoveredElementSchema),
};
export type ElementSearchQuery = z.output<
  z.ZodObject<typeof elementSearchShape>
>;
export type ElementLookupQuery = z.output<
  z.ZodObject<typeof elementLookupShape>
>;
