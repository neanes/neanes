import { z } from 'zod';

import { ElementType } from '@/models/Element';

import { documentPropertiesSchema } from '../../services/documents/documentPropertiesSchema';
import {
  paragraphStyleDefinitionSchema,
  paragraphStyleOverridesSchema,
} from '../../services/documents/paragraphStyleSchema';
import {
  elementCatalogSchema,
  elementCollectionSchema,
  elementPageShape,
} from './elementSchemas';
import {
  elementLookupResultShape,
  elementSearchResultShape,
} from './elementSearchSchema';
import { automationErrorSchema } from './errors';
import { pageElementsResultShape, pageListResultShape } from './pageSchemas';
import type { AutomationTool } from './protocol';
import { selectionResultShape } from './selectionSchema';

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
  resolvedStyles: z
    .array(
      z.strictObject({
        id: z.string(),
        builtIn: z.boolean(),
        displayName: z.string(),
        values: paragraphStyleOverridesSchema.required(),
      }),
    )
    .optional(),
  units: z.strictObject({
    dimensions: z.literal('css-px'),
    lineHeight: z.literal('multiplier'),
  }),
});

export const automationResultSchemas = {
  create_session: z.strictObject({
    sessionId: z.string().uuid(),
    idleTimeoutMs: z.number(),
    maxDocuments: z.number(),
  }),
  close_session: z.strictObject({ sessionId: z.string().uuid() }),
  get_capabilities: z.strictObject({
    isolatedSessions: z.strictObject({
      maxSessions: z.number(),
      maxDocuments: z.number(),
      idleTimeoutMs: z.number(),
    }),
    mode: z.enum(['interactive', 'headless']),
    errorCodes: z.array(z.string()).optional(),
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
    selectedDocumentId: z.string().min(1).nullable(),
  }),
  get_element_catalog: elementCatalogSchema,
  get_elements: documentSummarySchema.extend(elementPageShape),
  find_elements: documentSummarySchema.extend(elementSearchResultShape),
  get_element: documentSummarySchema.extend(elementLookupResultShape),
  get_selection: documentSummarySchema.extend(selectionResultShape),
  get_pages: documentSummarySchema.extend(pageListResultShape),
  get_page_elements: documentSummarySchema.extend(pageElementsResultShape),
  edit_elements: documentSummarySchema.extend({
    applied: z.boolean(),
    created: z.array(
      z.strictObject({
        clientId: z.string().nullable(),
        elementRef: z.string().uuid(),
        elementType: z.enum(ElementType),
      }),
    ),
  }),
  get_document: documentSummarySchema.extend({
    // This is the existing .byzx save-format document, not a second writable model.
    score: z
      .record(z.string(), z.json())
      .describe(
        'The serialized .byzx score, optionally section-filtered, with staff.elements paginated. Selected views are not complete loadable scores. Uses the existing Neanes save-format contract.',
      ),
    offset: z.number().int().nonnegative(),
    nextOffset: z.number().int().nonnegative().nullable(),
  }),
  get_paragraph_styles: styleResultSchema,
  edit_paragraph_styles: styleResultSchema
    .partial({ styles: true, resolvedStyles: true, units: true })
    .extend({
      affectedStyleIds: z.array(z.string()),
    }),
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

// Publication stays compact; runtime results above retain typed property validation.
const publishedElement = z.strictObject({
  elementRef: z.string().uuid(),
  elementType: z.enum(ElementType),
  index: z.number().int().nonnegative(),
  properties: z
    .record(z.string(), z.json())
    .describe(
      'Typed live properties, optionally projected. Use get_element_catalog with elementTypes/properties and view:read for constraints.',
    ),
  children: z.partialRecord(
    z.enum(['annotations', 'alternateLines', 'elements']),
    z.number().int().nonnegative(),
  ),
});
const publishedElementResult = documentSummarySchema.extend({
  ...elementPageShape,
  elements: z.array(publishedElement),
});
const publishedSearchResult = documentSummarySchema.extend({
  ...elementSearchResultShape,
  elements: z.array(
    publishedElement.extend({ collection: elementCollectionSchema }),
  ),
});
const publishedLookupResult = documentSummarySchema.extend({
  ...elementLookupResultShape,
  elements: z.array(publishedElement),
});

export function publishedAutomationOutputSchema(tool: AutomationTool) {
  return z.discriminatedUnion('success', [
    z.strictObject({
      success: z.literal(true),
      result:
        tool === 'get_elements'
          ? publishedElementResult
          : tool === 'find_elements'
            ? publishedSearchResult
            : tool === 'get_element'
              ? publishedLookupResult
              : automationResultSchemas[tool],
    }),
    z.strictObject({
      success: z.literal(false),
      error: automationErrorSchema.extend({
        code: z
          .string()
          .describe(
            'Stable error code. Request get_capabilities with includeErrorCodes:true for the vocabulary.',
          ),
      }),
    }),
  ]);
}
