import { z } from 'zod';

import { documentPropertiesSchema } from '../../services/documents/documentPropertiesSchema';
import {
  headerFooterChangesSchema,
  headerFooterSettingsSchema,
  pageSetupChangesSchema,
  pageSetupSchema,
} from '../../services/documents/pageSetupSchema';
import { batchQuerySchema } from './batch';
import { contentChunkQueryShape } from './contentChunkSchema';
import { elementContentQueryShape } from './elementContentSchema';
import { elementEditBatchSchema } from './elementEditSchema';
import { assertElementPredicateBounds } from './elementPredicates';
import { elementCatalogQuerySchema, elementQueryShape } from './elementSchemas';
import { elementLookupShape, elementSearchShape } from './elementSearchSchema';
import type { AutomationOutcome } from './errors';
import { fileDiscoveryQuerySchema } from './fileDiscovery';
import { modeKeyTemplatesQuerySchema } from './modeKeyTemplates';
import { layoutReadShape, pageElementQueryShape } from './pageSchemas';
import { paragraphStyleChangeSchema } from './paragraphStyleChanges';
import { richTextFormatQuerySchema } from './richTextFormat';
import { textSearchShape } from './textSearchSchema';

const documentId = z.string().min(1);
const revision = z.number().int().nonnegative();
const sessionId = z.string().uuid().optional();
const filePath = z.string().min(1);
const documentRead = {
  sessionId,
  documentId,
  expectedRevision: revision.optional(),
};
const documentMutation = { ...documentRead, expectedRevision: revision };

export const automationSchemas = {
  discover_score_files: fileDiscoveryQuerySchema,
  batch_update_files: batchQuerySchema,
  create_session: z.strictObject({}),
  close_session: z.strictObject({
    sessionId: z.string().uuid(),
    discardUnsavedChanges: z.boolean().default(false),
  }),
  list_documents: z.strictObject({ sessionId }),
  get_capabilities: z.strictObject({
    includeErrorCodes: z.boolean().default(false),
    includeFonts: z.boolean().default(false),
  }),
  get_element_catalog: elementCatalogQuerySchema,
  get_mode_key_templates: modeKeyTemplatesQuerySchema,
  get_rich_text_format: richTextFormatQuerySchema,
  get_elements: z.strictObject({
    ...documentRead,
    ...elementQueryShape,
  }),
  find_text: z.strictObject({
    ...documentRead,
    ...textSearchShape,
  }),
  find_elements: z.strictObject({
    ...documentRead,
    ...elementSearchShape,
  }),
  get_element: z.strictObject({
    ...documentRead,
    ...elementLookupShape,
  }),
  get_element_content: z.strictObject({
    ...documentRead,
    ...elementContentQueryShape,
  }),
  get_staff_lyrics: z.strictObject({
    ...documentRead,
    ...contentChunkQueryShape,
  }),
  get_selection: z.strictObject({
    ...documentRead,
  }),
  get_pages: z.strictObject({
    ...documentRead,
    ...layoutReadShape,
  }),
  get_page_elements: z.strictObject({
    ...documentRead,
    ...pageElementQueryShape,
  }),
  edit_elements: z.strictObject({
    ...documentMutation,
    actions: elementEditBatchSchema,
    includeCreated: z.boolean().default(true),
  }),
  get_document_properties: z.strictObject({
    ...documentRead,
  }),
  get_page_setup: z.strictObject({
    ...documentRead,
    properties: z.array(pageSetupSchema.keyof()).optional(),
  }),
  update_page_setup: z.strictObject({
    ...documentMutation,
    changes: pageSetupChangesSchema,
  }),
  get_header_footer_settings: z.strictObject({
    ...documentRead,
    properties: z.array(headerFooterSettingsSchema.keyof()).optional(),
  }),
  update_header_footer_settings: z.strictObject({
    ...documentMutation,
    changes: headerFooterChangesSchema,
  }),
  create_document: z.strictObject({ sessionId, title: z.string().optional() }),
  open_document: z.strictObject({ sessionId, filePath }),
  close_document: z.strictObject({
    ...documentMutation,
    discardUnsavedChanges: z.boolean().default(false),
  }),
  get_paragraph_styles: z.strictObject({
    sessionId,
    documentId,
    ids: z.array(z.string().min(1)).optional(),
    view: z.enum(['definitions', 'ids']).default('definitions'),
    includeResolved: z.boolean().default(true),
  }),
  edit_paragraph_styles: z.strictObject({
    ...documentMutation,
    changes: z.array(paragraphStyleChangeSchema).min(1),
    includeStyles: z.boolean().default(false),
  }),
  replace_document_properties: z.strictObject({
    ...documentMutation,
    properties: documentPropertiesSchema,
  }),
  save_document: z.strictObject({
    ...documentMutation,
    filePath: filePath.optional(),
    overwrite: z.boolean().default(false),
  }),
  preview_page: z.strictObject({
    ...documentMutation,
    pageNumber: z.number().int().positive(),
    maxEdge: z.number().int().min(256).max(2048).default(1600),
  }),
  export_pdf: z.strictObject({
    ...documentMutation,
    filePath,
    overwrite: z.boolean().default(false),
  }),
};

export type AutomationTool = keyof typeof automationSchemas;
export type AutomationRequest = {
  [K in AutomationTool]: {
    tool: K;
    arguments: z.output<(typeof automationSchemas)[K]>;
  };
}[AutomationTool];

export function parseAutomationRequest(value: unknown): AutomationRequest {
  const envelope = z
    .strictObject({
      tool: z.enum(
        Object.keys(automationSchemas) as [AutomationTool, ...AutomationTool[]],
      ),
      arguments: z.unknown(),
    })
    .parse(value);
  if (
    (envelope.tool === 'find_elements' ||
      envelope.tool === 'get_page_elements') &&
    envelope.arguments !== null &&
    typeof envelope.arguments === 'object'
  ) {
    assertElementPredicateBounds(Reflect.get(envelope.arguments, 'where'));
  }
  return {
    tool: envelope.tool,
    arguments: automationSchemas[envelope.tool].parse(envelope.arguments),
  } as AutomationRequest;
}

export interface AutomationMessage {
  requestId: string;
  request: AutomationRequest;
}

export type AutomationReply = {
  requestId: string;
} & AutomationOutcome<unknown>;
