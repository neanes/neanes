import { z } from 'zod';

import {
  paragraphStyleDefinitionSchema,
  paragraphStyleIdSchema,
} from '@/services/documents/paragraphStyleSchema';

export const paragraphStyleChangeSchema = z.discriminatedUnion('action', [
  z.strictObject({
    action: z.literal('create'),
    style: paragraphStyleDefinitionSchema,
  }),
  z.strictObject({
    action: z.literal('replace'),
    style: paragraphStyleDefinitionSchema,
  }),
  z.strictObject({ action: z.literal('delete'), id: paragraphStyleIdSchema }),
]);
export type ParagraphStyleChange = z.infer<typeof paragraphStyleChangeSchema>;
