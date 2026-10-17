import { z } from 'zod';

import { ElementType, TempoElement } from '@/models/Element';
import * as Neumes from '@/models/Neumes';
import {
  elementPropertyNames,
  headerFooterVariants,
} from '@/services/documents/elementDiscovery';
import { elementEditPropertySchemas } from '@/services/documents/elementEditSchema';
import { elementPropertySchemas } from '@/services/documents/elementProperties';

import { compactJsonSchema } from './jsonSchema';

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
  properties: z
    .array(
      z
        .string()
        .refine(
          (name) => elementPropertyNames.has(name),
          'Unknown element property. Use get_element_catalog for property names.',
        ),
    )
    .optional(),
  includeContent: z.boolean().default(true),
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
    properties: elementPropertySchemas[type].partial(),
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

export const elementCatalogQuerySchema = z.strictObject({
  elementTypes: z.array(z.enum(ElementType)).min(1).optional(),
  properties: z.array(z.string().min(1)).min(1).optional(),
  view: z.enum(['read', 'edit', 'both']).default('both'),
  includeProperties: z.boolean().default(false),
  includeNeumes: z.boolean().default(false),
});

export function getElementCatalog(
  options: z.input<typeof elementCatalogQuerySchema> = {},
) {
  const query = elementCatalogQuerySchema.parse(options);
  const includeProperties =
    query.includeProperties ||
    query.elementTypes !== undefined ||
    query.properties !== undefined;
  const schemas = (type: ElementType) => {
    const read = elementPropertySchemas[type];
    const names = Object.keys(read.shape).filter(
      (key) => query.properties === undefined || query.properties.includes(key),
    );
    const pick = (schema: z.ZodObject) =>
      z.strictObject(
        Object.fromEntries(names.map((key) => [key, schema.shape[key]])),
      );
    return {
      ...(query.view !== 'edit'
        ? { properties: compactJsonSchema(pick(read)) }
        : {}),
      ...(query.view !== 'read'
        ? {
            editProperties:
              type === ElementType.Empty
                ? null
                : compactJsonSchema(
                    pick(elementEditPropertySchemas[type]),
                    'input',
                  ),
          }
        : {}),
    };
  };
  return {
    readOnly: true as const,
    dimensions: 'css-px' as const,
    lineHeight: 'multiplier' as const,
    tempoBpmDefaults: Object.fromEntries(TempoElement.tempoToBpmMap),
    elementTypes: (query.elementTypes ?? Object.values(ElementType))
      .filter(
        (type) =>
          query.properties === undefined ||
          query.properties.some((key) =>
            Object.hasOwn(elementPropertySchemas[type].shape, key),
          ),
      )
      .map((elementType) => ({
        elementType,
        ...(includeProperties ? schemas(elementType) : {}),
        childCollections:
          elementType === ElementType.Note
            ? ['annotations', 'alternateLines']
            : elementType === ElementType.AlternateLine
              ? ['elements']
              : [],
      })),
    ...(query.includeNeumes
      ? {
          neumes: Object.fromEntries(
            Object.entries(Neumes)
              .filter(
                ([, value]) =>
                  !Array.isArray(value) && typeof value === 'object',
              )
              .map(([name, value]) => [name, Object.values(value)]),
          ),
        }
      : {}),
    headerFooterVariants: [...headerFooterVariants],
  };
}
export const elementCatalogSchema = z.strictObject({
  readOnly: z.literal(true),
  dimensions: z.literal('css-px'),
  lineHeight: z.literal('multiplier'),
  tempoBpmDefaults: z.record(z.enum(Neumes.TempoSign), z.number().positive()),
  elementTypes: z.array(
    z.strictObject({
      elementType: z.enum(ElementType),
      properties: z.record(z.string(), z.json()).optional(),
      editProperties: z.record(z.string(), z.json()).nullable().optional(),
      childCollections: z.array(
        z.enum(['annotations', 'alternateLines', 'elements']),
      ),
    }),
  ),
  neumes: z.record(z.string(), z.array(z.string())).optional(),
  headerFooterVariants: z.array(z.enum(headerFooterVariants)),
});
