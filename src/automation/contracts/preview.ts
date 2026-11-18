import { z } from 'zod';

export const PREVIEW_MAX_EDGE = 2048;
export const PREVIEW_MAX_BYTES = 4 * 1024 * 1024;
export const previewImageSchema = z.strictObject({
  outputFilePath: z.string().min(1),
  width: z.number().int().positive().max(PREVIEW_MAX_EDGE),
  height: z.number().int().positive().max(PREVIEW_MAX_EDGE),
});
export type PreviewImage = z.output<typeof previewImageSchema>;
export const previewPageResultSchema = previewImageSchema.extend({
  pageCount: z.number().int().positive(),
});
export type PreviewPageResult = z.output<typeof previewPageResultSchema>;
