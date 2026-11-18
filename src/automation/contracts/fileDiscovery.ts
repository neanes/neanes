import { z } from 'zod';

export const fileDiscoveryQuerySchema = z.strictObject({
  folderPath: z
    .string()
    .min(1)
    .max(4096)
    .describe('Absolute folder path on the Neanes host.'),
  recursive: z.boolean().default(false),
  offset: z.number().int().min(0).max(10000).default(0),
  limit: z.number().int().min(1).max(100).default(100),
});
export type FileDiscoveryQuery = z.output<typeof fileDiscoveryQuerySchema>;

export const fileDiscoveryResultSchema = z.strictObject({
  files: z.array(z.string()),
  nextOffset: z.number().int().nonnegative().nullable(),
});
export type FileDiscoveryResult = z.output<typeof fileDiscoveryResultSchema>;
