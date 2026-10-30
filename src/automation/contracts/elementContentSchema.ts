import { z } from 'zod';

import {
  contentChunkPageShape,
  contentChunkQueryShape,
} from './contentChunkSchema';

export const elementContentPropertySchema = z.enum([
  'content',
  'contentBottom',
  'contentLeft',
  'contentCenter',
  'contentRight',
  'text',
]);

export const elementContentQueryShape = {
  elementRef: z.string().uuid(),
  property: elementContentPropertySchema,
  ...contentChunkQueryShape,
};

export const elementContentResultShape = {
  elementRef: z.string().uuid(),
  property: elementContentPropertySchema,
  ...contentChunkPageShape,
  content: z.string(),
};

export type ElementContentQuery = z.output<
  z.ZodObject<typeof elementContentQueryShape>
>;
