import { z } from 'zod';

import { documentPropertiesSchema } from '../documents/documentPropertiesSchema';
import {
  paragraphStyleDefinitionSchema,
  paragraphStyleOverridesSchema,
} from '../documents/paragraphStyleSchema';
import { automationErrorSchema } from './errors';
import type { AutomationTool } from './protocol';

const revision = z.number().int().nonnegative();
export const documentSummarySchema = z.strictObject({
  documentId: z.string().min(1),
  revision,
  filePath: z.string().nullable(),
  sourceFormat: z.enum(['byz', 'byzx']).nullable(),
  title: z.string(),
  hasUnsavedChanges: z.boolean(),
  selected: z.boolean(),
  elementCount: z.number().int().nonnegative(),
});
const styleResultSchema = documentSummarySchema.extend({
  styles: z.array(paragraphStyleDefinitionSchema),
  resolvedStyles: z.array(
    z.strictObject({
      id: z.string(),
      builtIn: z.boolean(),
      displayName: z.string(),
      values: paragraphStyleOverridesSchema.required(),
    }),
  ),
  units: z.strictObject({
    dimensions: z.literal('css-px'),
    lineHeight: z.literal('multiplier'),
  }),
});

export const automationResultSchemas = {
  get_capabilities: z.strictObject({
    mode: z.literal('interactive'),
    paragraphStyles: z.strictObject({
      actions: z.array(z.enum(['create', 'replace', 'delete'])),
      dimensions: z.literal('css-px'),
      lineHeight: z.literal('multiplier'),
    }),
    fonts: z.array(z.string()),
    formats: z.strictObject({
      open: z.array(z.enum(['byz', 'byzx'])),
      save: z.array(z.enum(['byz', 'byzx'])),
      export: z.array(z.literal('pdf')),
    }),
  }),
  list_documents: z.array(documentSummarySchema),
  create_document: documentSummarySchema,
  open_document: documentSummarySchema.extend({ created: z.boolean() }),
  close_document: z.strictObject({
    documentId: z.string().min(1),
    selectedDocumentId: z.string().min(1),
  }),
  get_document: documentSummarySchema.extend({
    // This is the existing .byzx save-format document, not a second writable model.
    score: z
      .record(z.string(), z.json())
      .describe(
        'The serialized .byzx score, with staff.elements paginated. Uses the existing Neanes save-format contract.',
      ),
    offset: z.number().int().nonnegative(),
    nextOffset: z.number().int().nonnegative().nullable(),
  }),
  get_paragraph_styles: styleResultSchema,
  edit_paragraph_styles: styleResultSchema,
  replace_document_properties: documentSummarySchema.extend({
    properties: documentPropertiesSchema,
  }),
  save_document: documentSummarySchema.extend({
    savedRevision: revision,
    savedContentUnchanged: z.boolean(),
  }),
  export_pdf: documentSummarySchema.extend({
    exportedRevision: revision,
    outputFilePath: z.string(),
    format: z.literal('pdf'),
  }),
} satisfies Record<AutomationTool, z.ZodType>;

export type AutomationResults = {
  [K in AutomationTool]: z.output<(typeof automationResultSchemas)[K]>;
};
export function automationOutputSchema(tool: AutomationTool) {
  return z.discriminatedUnion('success', [
    z.strictObject({
      success: z.literal(true),
      result: automationResultSchemas[tool],
    }),
    z.strictObject({ success: z.literal(false), error: automationErrorSchema }),
  ]);
}
