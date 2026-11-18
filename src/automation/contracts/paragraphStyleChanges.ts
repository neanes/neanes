import { z } from 'zod';

import {
  paragraphStyleDefinitionSchema,
  paragraphStyleIdSchema,
  paragraphStyleOverridesSchema,
} from '@/services/documents/paragraphStyleSchema';

export const paragraphStyleUpdateSchema = z
  .strictObject({
    action: z.literal('update'),
    id: paragraphStyleIdSchema,
    changes: paragraphStyleDefinitionSchema
      .omit({ id: true })
      .partial()
      .optional(),
    resetOverrides: z
      .array(paragraphStyleOverridesSchema.keyof())
      .describe(
        'Remove these overrides to resume inheritance. Cannot also set them in changes.overrides.',
      )
      .optional(),
  })
  .refine(
    (change) =>
      !change.resetOverrides?.some((key) =>
        Object.hasOwn(change.changes?.overrides ?? {}, key),
      ),
    {
      message: 'An override cannot be both set and reset.',
      path: ['resetOverrides'],
    },
  );

export const paragraphStyleChangeSchema = z.discriminatedUnion('action', [
  z.strictObject({
    action: z.enum(['create', 'replace']),
    style: paragraphStyleDefinitionSchema,
  }),
  paragraphStyleUpdateSchema,
  z.strictObject({ action: z.literal('delete'), id: paragraphStyleIdSchema }),
]);
export type ParagraphStyleChange = z.infer<typeof paragraphStyleChangeSchema>;
