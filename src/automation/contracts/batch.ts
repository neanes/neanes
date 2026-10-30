import { z } from 'zod';

import { documentPropertiesSchema } from '@/services/documents/documentPropertiesSchema';
import {
  headerFooterChangesSchema,
  pageSetupChangesSchema,
} from '@/services/documents/pageSetupSchema';
import {
  paragraphStyleDefinitionSchema,
  paragraphStyleOverridesSchema,
} from '@/services/documents/paragraphStyleSchema';

import { automationErrorSchema } from './errors';
import {
  paragraphStyleChangeSchema,
  paragraphStyleUpdateSchema,
} from './paragraphStyleChanges';

const batchEditsSchema = z.strictObject({
  paragraphStyles: z.array(paragraphStyleChangeSchema).min(1).optional(),
  pageSetup: pageSetupChangesSchema.optional(),
  headerFooter: headerFooterChangesSchema.optional(),
  documentProperties: documentPropertiesSchema.partial().optional(),
});
const batchPath = z.string().min(1).max(4096);
const batchFileSchema = z.strictObject({
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

const batchFileResultSchema = z.strictObject({
  index: z.number().int().nonnegative(),
  filePath: z.string(),
  status: z.enum(['completed', 'unchanged', 'dryRun', 'failed']),
  changed: z.boolean().optional(),
  savedFilePath: z.string().optional(),
  pdfFilePath: z.string().optional(),
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
// Keep the batch envelope inline without repeating detailed style constraints.
// The runtime still validates every action with paragraphStyleChangeSchema.
const publishedStyleDefinition = paragraphStyleDefinitionSchema.extend({
  overrides: z.partialRecord(
    paragraphStyleOverridesSchema.keyof(),
    z.union([z.string(), z.number(), z.null()]),
  ),
});
const publishedStyleChange = z.strictObject({
  action: z.enum(
    paragraphStyleChangeSchema.options.flatMap((option) => {
      const action = option.shape.action;
      return action instanceof z.ZodEnum ? action.options : [action.value];
    }),
  ),
  id: paragraphStyleUpdateSchema.shape.id
    .describe('Required for update/delete.')
    .optional(),
  style: publishedStyleDefinition
    .describe('Required for create/replace; complete style definition.')
    .optional(),
  changes: publishedStyleDefinition.omit({ id: true }).partial().optional(),
  resetOverrides: paragraphStyleUpdateSchema.shape.resetOverrides,
});
const publishedEdits = batchEditsSchema.extend({
  paragraphStyles: z
    .array(publishedStyleChange)
    .min(1)
    .describe('Actions and value constraints: edit_paragraph_styles.changes.')
    .optional(),
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
