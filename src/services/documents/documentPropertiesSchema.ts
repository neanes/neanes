import { z } from 'zod';

export const documentPropertiesSchema = z.strictObject({
  title: z.string(),
  author: z.string(),
});
