import { z } from 'zod';

import { ElementType } from '@/models/Element';

import { paragraphStyleOverridesSchema } from '../../services/documents/paragraphStyleSchema';
import { headerFooterVariants } from '../documents/elementDiscovery';
import { elementPropertySchemas } from './elementPropertySchemas';
import {
  literalLyricsDescription,
  lyricParserDescription,
} from './lyricSyntax';
import { modeKeyEditIssue } from './modeKeyTemplates';

const editReferenceSchema = z
  .union([
    z.string().uuid(),
    z.string().regex(/^@[A-Za-z][A-Za-z0-9_-]{0,63}$/),
  ])
  .describe(
    'An elementRef from discovery, or @clientId introduced earlier in this batch.',
  );
const clientId = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/);
const index = z.number().int().nonnegative();
const editCollectionSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('staff') }),
  z.strictObject({
    kind: z.enum(['headers', 'footers']),
    variant: z.enum(headerFooterVariants),
  }),
  z.strictObject({
    kind: z.literal('children'),
    parentRef: editReferenceSchema,
    collection: z.enum(['annotations', 'alternateLines', 'elements']),
  }),
]);

// Inspection fields define the allowed vocabulary, but edits need stricter
// value constraints and explicit nulls to clear nullable live-model fields.
function editPropertySchema(type: ElementType) {
  const shape: Record<string, z.ZodType> = {};
  for (const [key, inspected] of Object.entries(
    elementPropertySchemas[type].shape,
  )) {
    if (
      type === ElementType.Note &&
      ['scaleNotes', 'scaleNotesVirtual'].includes(key)
    ) {
      continue;
    }
    let value: z.ZodType = inspected;
    const optional = inspected.isOptional();
    if (optional) {
      value = (inspected as z.ZodOptional<z.ZodType>).unwrap();
    }
    const styleKey = key.startsWith('lyrics')
      ? key.slice(6, 7).toLowerCase() + key.slice(7)
      : key;
    const style =
      paragraphStyleOverridesSchema.shape[
        styleKey as keyof typeof paragraphStyleOverridesSchema.shape
      ];
    if (style && !['alignment', 'textDecoration'].includes(styleKey)) {
      value = style.unwrap();
    }
    if (
      [
        'fthora',
        'accidental',
        'gorgonNeume',
        'secondaryFthora',
        'secondaryAccidental',
        'secondaryGorgonNeume',
        'tertiaryFthora',
        'tertiaryAccidental',
      ].includes(key)
    ) {
      const role = key.startsWith('secondary')
        ? 'Secondary'
        : key.startsWith('tertiary')
          ? 'Tertiary'
          : null;
      const inspectedSchema = inspected as z.ZodOptional<
        z.ZodEnum<Record<string, string>>
      >;
      const choices = inspectedSchema
        .unwrap()
        .options.filter((option) =>
          role === null
            ? !option.endsWith('Secondary') && !option.endsWith('Tertiary')
            : option.endsWith(role),
        );
      value = z.enum(choices as [string, ...string[]]);
    }
    if (key === 'lyricsTextDecoration') {
      value = z.enum(['underline', 'none']);
    }
    if (key.endsWith('ParagraphStyleId') || key === 'paragraphStyleId') {
      value = z.string().min(1);
    }
    if (
      [
        'height',
        'imageHeight',
        'imageWidth',
        'fontSize',
        'lyricsFontSize',
        'customWidth',
        'customHeight',
        'bpm',
        'modeChangeBpm',
      ].includes(key)
    ) {
      value = z.number().positive();
    }
    if (key === 'mode') {
      value = z.number().int().min(1).max(8);
    }
    if (key === 'lineSpan') {
      value = z.number().int().min(1);
    }
    if (key === 'data') {
      value = z
        .string()
        .regex(
          /^data:image\/(?:png|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/,
        );
    }
    if (key === 'templateId') {
      value = z
        .number()
        .int()
        .nonnegative()
        .describe(
          'Apply a catalog template together with useOptionalDiatonicFthoras. Discover IDs with get_mode_key_templates.',
        );
    }
    if (optional && key !== 'templateId') {
      value = value.nullable();
    }
    if (
      (type === ElementType.Tempo && ['neume', 'bpm'].includes(key)) ||
      ([ElementType.Martyria, ElementType.ModeKey].includes(type) &&
        ['tempo', 'tempoLeft', 'tempoRight', 'bpm'].includes(key))
    ) {
      value = value.describe(
        'On creation/replacement, an omitted bpm defaults from the selected tempo sign using get_element_catalog.tempoBpmDefaults. Explicit bpm overrides that default. Partial updates preserve omitted bpm even when the sign changes.',
      );
    }
    if (
      type === ElementType.Martyria &&
      ['tempo', 'tempoLeft', 'tempoRight'].includes(key)
    ) {
      value = value.describe(
        'Martyria tempo, tempoLeft, and tempoRight are mutually exclusive in the final transaction state. Omitted fields stay unchanged; explicitly clear the other fields with null or reset when switching signs. On creation/replacement omitted bpm defaults from the selected sign using get_element_catalog.tempoBpmDefaults; partial updates preserve omitted bpm.',
      );
    }
    if (key === 'lyrics') {
      value = value.describe(literalLyricsDescription);
    }
    if (['isMelisma', 'isMelismaStart', 'isHyphen'].includes(key)) {
      value = value.describe(
        'A literal lyric flag; not inferred from direct lyrics updates. ' +
          literalLyricsDescription,
      );
    }
    if (key === 'acceptsLyrics') {
      value = value.describe(lyricParserDescription);
    }
    if (
      [
        'fthora',
        'secondaryFthora',
        'tertiaryFthora',
        'quantitativeNeumeFthora',
      ].includes(key)
    ) {
      value = value.describe(
        'On creation or an actual fthora change, an omitted corresponding chromaticFthoraNote uses the UI default. Resending an unchanged fthora preserves its omitted interpretation. Supply the interpretation explicitly to override that default.',
      );
    }
    shape[key] = value.optional();
  }
  if (type === ElementType.ModeKey) {
    shape.useOptionalDiatonicFthoras = z
      .boolean()
      .optional()
      .describe(
        'Operation input, not persisted. Required with templateId. Adds optional diatonic fthoras when supported; false preserves built-in fthoras. Does not change page setup.',
      );
  }
  return z.strictObject(shape);
}
export const elementEditPropertySchemas = Object.fromEntries(
  Object.values(ElementType).map((type) => [type, editPropertySchema(type)]),
) as Record<ElementType, z.ZodObject<Record<string, z.ZodType>>>;

const propertyValues = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .default({})
  .describe(
    'Typed property values are fully validated for elementType at runtime. Query get_element_catalog with elementTypes/properties for permitted names and constraints. ' +
      literalLyricsDescription,
  );

function validateProperties(
  type: ElementType,
  values: Record<string, unknown>,
  ctx: z.RefinementCtx,
  creating = false,
  reset: string[] = [],
) {
  if (type === ElementType.ModeKey) {
    const issue = modeKeyEditIssue(values, creating, reset);
    if (issue) {
      ctx.addIssue({ code: 'custom', path: ['properties'], message: issue });
    }
  }
  const result = elementEditPropertySchemas[type].safeParse(values);
  if (result.success) {
    // Keep normalization at the boundary so planners can use validated values.
    Object.assign(values, result.data);
  } else {
    for (const issue of result.error.issues) {
      ctx.addIssue({ ...issue, path: ['properties', ...issue.path] });
    }
  }
}
// Keep full type-specific validation without expanding every element/property
// enum into the tools/list prompt. Detailed schemas are available on demand.
const elementDefinitionSchema = z
  .strictObject({
    elementType: z.enum(ElementType).exclude(['Empty']),
    properties: propertyValues,
    clientId: clientId.optional(),
  })
  .superRefine((element, ctx) =>
    validateProperties(element.elementType, element.properties, ctx, true),
  );
const elementEditActionSchema = z.discriminatedUnion('action', [
  z.strictObject({
    action: z.literal('insert'),
    collection: editCollectionSchema.default({ kind: 'staff' }),
    index: index.optional(),
    elements: z.array(elementDefinitionSchema).min(1).max(1000),
  }),
  z
    .strictObject({
      action: z.literal('update'),
      elementRef: editReferenceSchema,
      elementType: z.enum(ElementType).exclude(['Empty']),
      properties: propertyValues,
      reset: z.array(z.string()).default([]),
    })
    .superRefine((element, ctx) =>
      validateProperties(
        element.elementType,
        element.properties,
        ctx,
        false,
        element.reset,
      ),
    ),
  z.strictObject({
    action: z.literal('replace'),
    elementRef: editReferenceSchema,
    element: elementDefinitionSchema,
  }),
  z.strictObject({
    action: z.literal('remove'),
    elementRef: editReferenceSchema,
  }),
  z.strictObject({
    action: z.literal('remove_range'),
    collection: editCollectionSchema.default({ kind: 'staff' }),
    start: index,
    end: index,
  }),
  z.strictObject({
    action: z.literal('set_staff_lyrics'),
    text: z.string().describe(lyricParserDescription),
    locked: z.boolean(),
  }),
  z.strictObject({
    action: z.literal('assign_lyrics'),
    collection: editCollectionSchema.default({ kind: 'staff' }),
    start: index.default(0),
    end: index.optional(),
    text: z.string().describe(lyricParserDescription),
  }),
]);
export const elementEditBatchSchema = z
  .array(elementEditActionSchema)
  .min(1)
  .max(1000);
export type ElementDefinition = z.infer<typeof elementDefinitionSchema>;
export type ElementEditBatch = z.infer<typeof elementEditBatchSchema>;
