import { z } from 'zod';

import englishModel from '@/i18n/en/model.json';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { Scale, ScaleNote } from '@/models/Scales';

export const modeKeyTemplatesQuerySchema = z.strictObject({
  mode: z.number().int().min(1).max(8).optional(),
  templateIds: z.array(z.number().int().nonnegative()).min(1).optional(),
});

export const modeKeyTemplatesResultSchema = z.strictObject({
  templates: z.array(
    z.strictObject({
      templateId: z.number().int().nonnegative(),
      mode: z.number().int().min(1).max(8),
      description: z.string(),
      scale: z.enum(Scale),
      scaleNote: z.enum(ScaleNote),
      supportsOptionalDiatonicFthora: z.boolean(),
    }),
  ),
});

export function getModeKeyTemplates(
  query: z.infer<typeof modeKeyTemplatesQuerySchema>,
) {
  return {
    templates: modeKeyTemplates
      .filter(
        (template) =>
          (query.mode === undefined || template.mode === query.mode) &&
          (query.templateIds === undefined ||
            query.templateIds.includes(template.id)),
      )
      .map((template) => ({
        templateId: template.id,
        mode: template.mode,
        // Stable English catalog descriptions, independent of UI language.
        description: template.description({ model: englishModel }),
        scale: template.scale,
        scaleNote: template.scaleNote,
        supportsOptionalDiatonicFthora:
          template.optionalFthoras?.fthoraAboveNote !== undefined,
      })),
  };
}

export const modeKeyTemplateFields = [
  'templateId',
  'mode',
  'scale',
  'scaleNote',
  'fthora',
  'martyria',
  'fthoraAboveNote',
  'fthoraAboveNote2',
  'fthoraAboveQuantitativeNeumeRight',
  'note',
  'note2',
  'quantitativeNeumeAboveNote',
  'quantitativeNeumeAboveNote2',
  'quantitativeNeumeRight',
] as const;

export function modeKeyEditIssue(
  properties: Record<string, unknown>,
  creating: boolean,
  reset: string[] = [],
): string | undefined {
  if (
    reset.some((key) =>
      ['templateId', 'useOptionalDiatonicFthoras'].includes(key),
    )
  ) {
    return 'Apply a template with templateId and useOptionalDiatonicFthoras instead of resetting them.';
  }
  const applying =
    creating ||
    Object.hasOwn(properties, 'templateId') ||
    Object.hasOwn(properties, 'useOptionalDiatonicFthoras');
  if (!applying) {
    return;
  }
  if (
    !modeKeyTemplates.some(
      (template) => template.id === properties.templateId,
    ) ||
    typeof properties.useOptionalDiatonicFthoras !== 'boolean'
  ) {
    return 'ModeKey creation/replacement or template application requires a catalog templateId and an explicit useOptionalDiatonicFthoras boolean. Use get_mode_key_templates.';
  }
  if (
    modeKeyTemplateFields.some(
      (key) =>
        key !== 'templateId' &&
        (Object.hasOwn(properties, key) || reset.includes(key)),
    )
  ) {
    return 'Template application cannot include or reset template-owned notation or scale properties. Apply custom notation in a separate update.';
  }
}
