import { z } from 'zod';

export const contentChunkQueryShape = {
  offset: z.number().int().nonnegative().default(0),
  // Even fully escaped chunks fit below the global JSON response budget.
  limit: z.number().int().min(2).max(8000).default(8000),
};

export const contentChunkPageShape = {
  offset: z.number().int().nonnegative(),
  nextOffset: z.number().int().nonnegative().nullable(),
  totalLength: z.number().int().nonnegative(),
};
