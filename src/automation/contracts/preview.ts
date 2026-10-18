import { z } from 'zod';

export const PREVIEW_MAX_EDGE = 2048;
export const PREVIEW_MAX_BYTES = 4 * 1024 * 1024;
export const previewImageSchema = z.strictObject({
  imageData: z
    .string()
    .min(1)
    .max(4 * Math.ceil(PREVIEW_MAX_BYTES / 3))
    .regex(/^[A-Za-z0-9+/]+={0,2}$/),
  width: z.number().int().positive().max(PREVIEW_MAX_EDGE),
  height: z.number().int().positive().max(PREVIEW_MAX_EDGE),
});
export type PreviewImage = z.output<typeof previewImageSchema>;
