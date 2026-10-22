import { z } from 'zod';

import { ElementType } from '@/models/Element';

import { documentPropertiesSchema } from '../../services/documents/documentPropertiesSchema';
import {
  headerFooterSettingsSchema,
  pageSetupSchema,
} from '../../services/documents/pageSetupSchema';
import {
  paragraphStyleDefinitionSchema,
  paragraphStyleOverridesSchema,
} from '../../services/documents/paragraphStyleSchema';
import { batchResultSchema, publishedBatchResultSchema } from './batch';
import { contentChunkPageShape } from './contentChunkSchema';
import {
  elementContentPropertySchema,
  elementContentResultShape,
} from './elementContentSchema';
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
import { fileDiscoveryResultSchema } from './fileDiscovery';
import { modeKeyTemplatesResultSchema } from './modeKeyTemplates';
import { pageElementsResultShape, pageListResultShape } from './pageSchemas';
import type { AutomationTool } from './protocol';
import { selectionResultShape } from './selectionSchema';
import { textSearchResultShape } from './textSearchSchema';

const revision = z.number().int().nonnegative();
export const documentSummarySchema = z.strictObject({
  documentId: z.string().min(1),
  revision,
  filePath: z.string().nullable(),
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

const capabilityFields = {
  errorCodes: z.array(z.string()).optional(),
  paragraphStyles: z.strictObject({
    actions: z.array(z.enum(['create', 'replace', 'update', 'delete'])),
    dimensions: z.literal('css-px'),
    lineHeight: z.literal('multiplier'),
  }),
  fonts: z.array(z.string()).optional(),
  formats: z.strictObject({
    open: z.array(z.enum(['byz', 'byzx'])),
    save: z.array(z.enum(['byz', 'byzx'])),
    export: z.array(z.literal('pdf')),
  }),
};

export const capabilitiesSchemas = {
  interactive: z.strictObject({
    ...capabilityFields,
    mode: z.literal('interactive'),
    isolatedSessions: z.strictObject({
      maxSessions: z.number(),
      maxDocuments: z.number(),
      idleTimeoutMs: z.number(),
    }),
  }),
  headless: z.strictObject({
    ...capabilityFields,
    mode: z.literal('headless'),
    privateDocuments: z.strictObject({
      maxDocuments: z.number(),
      lifetime: z.literal('worker'),
    }),
  }),
};

export const automationResultSchemas = {
  discover_score_files: fileDiscoveryResultSchema,
  batch_update_files: batchResultSchema,
  create_session: z.strictObject({
    sessionId: z.string().uuid(),
    idleTimeoutMs: z.number(),
    maxDocuments: z.number(),
  }),
  close_session: z.strictObject({ sessionId: z.string().uuid() }),
  get_capabilities: z.discriminatedUnion('mode', [
    capabilitiesSchemas.interactive,
    capabilitiesSchemas.headless,
  ]),
  list_documents: z.array(documentSummarySchema),
  create_document: documentSummarySchema,
  open_document: documentSummarySchema.extend({ created: z.boolean() }),
  close_document: z.strictObject({
    documentId: z.string().min(1),
    selectedDocumentId: z.string().min(1).nullable(),
  }),
  get_element_catalog: elementCatalogSchema,
  get_mode_key_templates: modeKeyTemplatesResultSchema,
  get_rich_text_format: z.strictObject({ guide: z.string() }),
  get_elements: documentSummarySchema.extend(elementPageShape),
  find_text: documentSummarySchema.extend(textSearchResultShape),
  find_elements: documentSummarySchema.extend(elementSearchResultShape),
  get_element: documentSummarySchema.extend(elementLookupResultShape),
  get_element_content: z.strictObject({
    documentId: z.string().min(1),
    revision,
    ...elementContentResultShape,
  }),
  get_staff_lyrics: z.strictObject({
    documentId: z.string().min(1),
    revision,
    ...contentChunkPageShape,
    text: z.string(),
    locked: z.boolean(),
  }),
  get_selection: documentSummarySchema.extend(selectionResultShape),
  get_pages: documentSummarySchema.extend(pageListResultShape),
  get_page_elements: documentSummarySchema.extend(pageElementsResultShape),
  edit_elements: documentSummarySchema.extend({
    applied: z.boolean(),
    createdCount: z.number().int().nonnegative(),
    created: z
      .array(
        z.strictObject({
          clientId: z.string().nullable(),
          elementRef: z.string().uuid(),
          elementType: z.enum(ElementType),
        }),
      )
      .optional(),
  }),
  get_document_properties: documentSummarySchema.extend({
    properties: documentPropertiesSchema,
  }),
  get_page_setup: documentSummarySchema.extend({
    settings: pageSetupSchema.partial(),
  }),
  update_page_setup: documentSummarySchema,
  get_header_footer_settings: documentSummarySchema.extend({
    settings: headerFooterSettingsSchema.partial(),
  }),
  update_header_footer_settings: documentSummarySchema,
  get_paragraph_styles: z.union([
    styleResultSchema,
    documentSummarySchema.extend({ styleIds: z.array(z.string()) }),
  ]),
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
  preview_page: documentSummarySchema.extend({
    capturedRevision: revision,
    pageCount: z.number().int().nonnegative(),
    pageNumber: z.number().int().positive(),
    mimeType: z.literal('image/png'),
    width: z.number().int().positive().max(2048),
    height: z.number().int().positive().max(2048),
  }),
  export_pdf: documentSummarySchema.extend({
    exportedRevision: revision,
    outputFilePath: z.string(),
    format: z.literal('pdf'),
  }),
} satisfies Record<AutomationTool, z.ZodType>;

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
  omittedContent: z.array(elementContentPropertySchema).optional(),
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

const publishedSettingsResult = documentSummarySchema.extend({
  settings: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .describe(
      'Live settings, optionally projected. Field names and constraints are defined by the corresponding update tool; pageWidth/pageHeight are read-only derived dimensions.',
    ),
});

const publishedStyleResult = styleResultSchema
  .partial({ styles: true, units: true })
  .extend({ styleIds: z.array(z.string()).optional() });

export function publishedAutomationOutputSchema(
  tool: AutomationTool,
  mode: 'interactive' | 'headless' = 'interactive',
) {
  return z.discriminatedUnion('success', [
    z.strictObject({
      success: z.literal(true),
      result:
        tool === 'get_capabilities'
          ? capabilitiesSchemas[mode]
          : tool === 'batch_update_files'
            ? publishedBatchResultSchema
            : tool === 'get_paragraph_styles'
              ? publishedStyleResult
              : tool === 'get_elements'
                ? publishedElementResult
                : tool === 'find_elements'
                  ? publishedSearchResult
                  : tool === 'get_element'
                    ? publishedLookupResult
                    : tool === 'get_page_setup' ||
                        tool === 'get_header_footer_settings'
                      ? publishedSettingsResult
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
