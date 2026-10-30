import { z } from 'zod';

export const staffCollectionSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('staff') }),
  z.strictObject({
    kind: z.literal('footnote'),
    footnoteId: z.string().uuid(),
  }),
]);
