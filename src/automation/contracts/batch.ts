import { z } from 'zod';

import { documentPropertiesSchema } from '@/services/documents/documentPropertiesSchema';
import {
  headerFooterChangesSchema,
  pageSetupChangesSchema,
} from '@/services/documents/pageSetupSchema';

import { automationErrorSchema } from './errors';
import { paragraphStyleChangeSchema } from './paragraphStyleChanges';

export const batchEditsSchema = z.strictObject({
  paragraphStyles: z.array(paragraphStyleChangeSchema).min(1).optional(),
  pageSetup: pageSetupChangesSchema.optional(),
  headerFooter: headerFooterChangesSchema.optional(),
  documentProperties: documentPropertiesSchema.partial().optional(),
});
const batchPath = z.string().min(1).max(4096);
export const batchFileSchema = z.strictObject({
  filePath: batchPath,
  outputFilePath: batchPath
    .describe('Score destination; required only for save:copy.')
    .optional(),
  pdfFilePath: batchPath
    .describe('Export PDF with or without edits, independently of saving.')
    .optional(),
  edits: batchEditsSchema.optional(),
});
export const batchQuerySchema = z
  .strictObject({
    files: z.array(batchFileSchema).min(1).max(100),
    edits: batchEditsSchema.optional(),
    save: z
      .enum(['inPlace', 'copy', 'none'])
      .describe(
        'inPlace saves changed sources; copy saves to each outputFilePath; none leaves sources unchanged, including during PDF export.',
      )
      .default('inPlace'),
    overwrite: z.boolean().default(false),
    dryRun: z
      .boolean()
      .describe(
        'Validate edits and measure text without writing scores or rendering PDFs.',
      )
      .default(false),
    verifySaved: z
      .boolean()
      .describe(
        'Reread saved scores and compare normalized content; requires saving.',
      )
      .default(false),
    onError: z.enum(['stop', 'continue']).default('stop'),
    startIndex: z.number().int().nonnegative().default(0),
  })
  .superRefine((query, ctx) => {
    if (query.startIndex >= query.files.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['startIndex'],
        message: 'startIndex must address a file in the manifest.',
      });
    }
    if (query.verifySaved && query.save === 'none') {
      ctx.addIssue({
        code: 'custom',
        path: ['verifySaved'],
        message: 'Saved-file verification requires saving.',
      });
    }
    query.files.forEach((file, index) => {
      if ((query.save === 'copy') !== (file.outputFilePath !== undefined)) {
        ctx.addIssue({
          code: 'custom',
          path: ['files', index, 'outputFilePath'],
          message: 'outputFilePath is required only with save:copy.',
        });
      }
    });
  });
export type BatchQuery = z.output<typeof batchQuerySchema>;
export type BatchEdits = z.output<typeof batchEditsSchema>;
export type BatchFile = z.output<typeof batchFileSchema>;

export const batchFileResultSchema = z.strictObject({
  index: z.number().int().nonnegative(),
  filePath: z.string(),
  status: z.enum(['completed', 'unchanged', 'dryRun', 'failed']),
  changed: z.boolean().optional(),
  savedFilePath: z.string().optional(),
  pdfFilePath: z.string().optional(),
  verified: z.boolean().optional(),
  error: automationErrorSchema.pick({ code: true, message: true }).optional(),
});
export const batchResultSchema = z.strictObject({
  results: z.array(batchFileResultSchema),
  nextIndex: z.number().int().nonnegative().nullable(),
  stopReason: z.enum([
    'complete',
    'error',
    'timeBudget',
    'responseBudget',
    'cancelled',
  ]),
});
export type BatchFileResult = z.output<typeof batchFileResultSchema>;
export type BatchResult = z.output<typeof batchResultSchema>;

// The single-document settings tools already publish every field constraint.
// Publish writable names here; reuse the existing tools for value constraints.
const publishedSettingValue = z.union([z.string(), z.number(), z.boolean()]);
const publishedEdits = batchEditsSchema.extend({
  pageSetup: z
    .partialRecord(pageSetupChangesSchema.keyof(), publishedSettingValue)
    .describe(
      'Sparse settings; value constraints are in update_page_setup.changes.',
    )
    .optional(),
  headerFooter: z
    .partialRecord(headerFooterChangesSchema.keyof(), publishedSettingValue)
    .describe(
      'Sparse settings; value constraints are in update_header_footer_settings.changes.',
    )
    .optional(),
});
export const publishedBatchQuerySchema = z.strictObject({
  ...batchQuerySchema.shape,
  edits: publishedEdits.optional(),
  files: z
    .array(batchFileSchema.extend({ edits: publishedEdits.optional() }))
    .min(1)
    .max(100),
});
export const publishedBatchResultSchema = batchResultSchema.extend({
  results: z.array(
    batchFileResultSchema.extend({
      error: z
        .strictObject({ code: z.string(), message: z.string() })
        .optional(),
    }),
  ),
});
