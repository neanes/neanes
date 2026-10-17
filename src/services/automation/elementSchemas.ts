import { z } from 'zod';

import { ElementType } from '@/models/Element';
import * as Neumes from '@/models/Neumes';
import { headerFooterVariants } from '@/services/documents/elementDiscovery';
import { elementPropertySchemas } from '@/services/documents/elementProperties';

const index = z.number().int().nonnegative();
export const elementCollectionSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('staff') }),
  z.strictObject({
    kind: z.enum(['headers', 'footers']),
    variant: z.enum(headerFooterVariants),
  }),
  z.strictObject({
    kind: z.literal('children'),
    parentRef: z.string().uuid(),
    collection: z.enum(['annotations', 'alternateLines', 'elements']),
  }),
]);
export const elementQueryShape = {
  collection: elementCollectionSchema.default({ kind: 'staff' }),
  start: index.default(0),
  end: index.optional(),
  offset: index.default(0),
  limit: z.number().int().min(1).max(1000).default(100),
};
function elementResult<T extends ElementType>(type: T) {
  return z.strictObject({
    elementRef: z.string().uuid(),
    elementType: z.literal(type),
    index,
    properties: elementPropertySchemas[type],
    children: z.partialRecord(
      z.enum(['annotations', 'alternateLines', 'elements']),
      index,
    ),
  });
}
export const elementPageShape = {
  collection: elementCollectionSchema,
  collectionSize: index,
  start: index,
  end: index,
  offset: index,
  nextOffset: index.nullable(),
  elements: z.array(
    z.discriminatedUnion('elementType', [
      elementResult(ElementType.Note),
      elementResult(ElementType.Martyria),
      elementResult(ElementType.Tempo),
      elementResult(ElementType.Empty),
      elementResult(ElementType.TextBox),
      elementResult(ElementType.RichTextBox),
      elementResult(ElementType.DropCap),
      elementResult(ElementType.ModeKey),
      elementResult(ElementType.ImageBox),
      elementResult(ElementType.Annotation),
      elementResult(ElementType.AlternateLine),
    ]),
  ),
};

export function getElementCatalog() {
  return {
    readOnly: true as const,
    dimensions: 'css-px' as const,
    lineHeight: 'multiplier' as const,
    elementTypes: Object.values(ElementType).map((elementType) => ({
      elementType,
      properties: z.toJSONSchema(elementPropertySchemas[elementType]),
      childCollections:
        elementType === ElementType.Note
          ? ['annotations', 'alternateLines']
          : elementType === ElementType.AlternateLine
            ? ['elements']
            : [],
    })),
    neumes: Object.fromEntries(
      Object.entries(Neumes)
        .filter(
          ([, value]) => !Array.isArray(value) && typeof value === 'object',
        )
        .map(([name, value]) => [name, Object.values(value)]),
    ),
    headerFooterVariants: [...headerFooterVariants],
  };
}
export const elementCatalogSchema = z.strictObject({
  readOnly: z.literal(true),
  dimensions: z.literal('css-px'),
  lineHeight: z.literal('multiplier'),
  elementTypes: z.array(
    z.strictObject({
      elementType: z.enum(ElementType),
      properties: z.record(z.string(), z.json()),
      childCollections: z.array(
        z.enum(['annotations', 'alternateLines', 'elements']),
      ),
    }),
  ),
  neumes: z.record(z.string(), z.array(z.string())),
  headerFooterVariants: z.array(z.enum(headerFooterVariants)),
});
