import { z } from 'zod';

import { elementEditPropertySchemas } from '@/automation/contracts/elementEditSchema';
import { elementPropertySchemas } from '@/automation/contracts/elementPropertySchemas';
import {
  elementPropertyNames,
  headerFooterVariants,
} from '@/automation/documents/elementDiscovery';
import { ElementType, TempoElement } from '@/models/Element';
import {
  getPrimaryNeume,
  getSecondaryNeume,
  getTertiaryNeume,
} from '@/models/NeumeReplacements';
import * as Neumes from '@/models/Neumes';

import { elementContentPropertySchema } from './elementContentSchema';
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
  includeContent: z.boolean().default(false),
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
    omittedContent: z.array(elementContentPropertySchema).optional(),
    children: z.partialRecord(
      z.enum(['annotations', 'alternateLines', 'elements']),
      index,
    ),
  });
}
export const discoveredElementSchema = z.discriminatedUnion('elementType', [
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
]);
export const elementPageShape = {
  collection: elementCollectionSchema,
  collectionSize: index,
  start: index,
  end: index,
  offset: index,
  nextOffset: index.nullable(),
  elements: z.array(discoveredElementSchema),
};

export const elementCatalogQuerySchema = z.strictObject({
  elementTypes: z.array(z.enum(ElementType)).min(1).optional(),
  properties: z.array(z.string().min(1)).min(1).optional(),
  view: z.enum(['names', 'read', 'edit', 'both']).default('both'),
  includeProperties: z.boolean().default(false),
  includeNeumes: z.boolean().default(false),
  includeNeumeComponents: z
    .boolean()
    .default(false)
    .describe(
      'Include compound quantitative-neume mappings to primary/secondary/tertiary mark targets. Missing secondary/tertiary roles are unsupported; unlisted neumes have only a primary target.',
    ),
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
    const names = [
      ...new Set([
        ...Object.keys(read.shape),
        ...(query.view !== 'read'
          ? Object.keys(elementEditPropertySchemas[type].shape)
          : []),
      ]),
    ].filter(
      (key) => query.properties === undefined || query.properties.includes(key),
    );
    const pick = (schema: z.ZodObject) =>
      z.strictObject(
        Object.fromEntries(
          names
            .filter((key) => Object.hasOwn(schema.shape, key))
            .map((key) => [key, schema.shape[key]]),
        ),
      );
    return {
      ...(query.view === 'names' ? { propertyNames: names } : {}),
      ...(query.view === 'read' || query.view === 'both'
        ? { properties: compactJsonSchema(pick(read)) }
        : {}),
      ...(query.view === 'edit' || query.view === 'both'
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
          query.properties.some(
            (key) =>
              Object.hasOwn(elementPropertySchemas[type].shape, key) ||
              (query.view !== 'read' &&
                Object.hasOwn(elementEditPropertySchemas[type].shape, key)),
          ),
      )
      .map((elementType) => ({
        elementType,
        ...(includeProperties || query.view === 'names'
          ? schemas(elementType)
          : {}),
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
    ...(query.includeNeumeComponents
      ? {
          neumeComponents: Object.fromEntries(
            Object.values(Neumes.QuantitativeNeume).flatMap((neume) => {
              const secondary = getSecondaryNeume(neume);
              if (secondary === null) {
                return [];
              }
              const tertiary = getTertiaryNeume(neume);
              return [
                [
                  neume,
                  {
                    primary: getPrimaryNeume(neume) ?? neume,
                    secondary,
                    ...(tertiary === null ? {} : { tertiary }),
                  },
                ],
              ];
            }),
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
      propertyNames: z.array(z.string()).optional(),
      properties: z.record(z.string(), z.json()).optional(),
      editProperties: z.record(z.string(), z.json()).nullable().optional(),
      childCollections: z.array(
        z.enum(['annotations', 'alternateLines', 'elements']),
      ),
    }),
  ),
  neumes: z.record(z.string(), z.array(z.string())).optional(),
  neumeComponents: z
    .partialRecord(
      z.enum(Neumes.QuantitativeNeume),
      z.strictObject({
        primary: z.enum(Neumes.QuantitativeNeume),
        secondary: z.enum(Neumes.QuantitativeNeume),
        tertiary: z.enum(Neumes.QuantitativeNeume).optional(),
      }),
    )
    .optional(),
  headerFooterVariants: z.array(z.enum(headerFooterVariants)),
});
