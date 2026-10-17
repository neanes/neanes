import { z } from 'zod';

import { documentPropertiesSchema } from '../../services/documents/documentPropertiesSchema';
import { documentReadSections } from '../documents/documentRead';
import { elementEditBatchSchema } from './elementEditSchema';
import { assertElementPredicateBounds } from './elementPredicates';
import { elementCatalogQuerySchema, elementQueryShape } from './elementSchemas';
import { elementLookupShape, elementSearchShape } from './elementSearchSchema';
import type { AutomationOutcome } from './errors';
import { layoutReadShape, pageElementQueryShape } from './pageSchemas';
import { paragraphStyleChangeSchema } from './paragraphStyleChanges';

const documentId = z.string().min(1);
const revision = z.number().int().nonnegative();
const sessionId = z.string().uuid().optional();
const filePath = z.string().min(1);

export const automationSchemas = {
  create_session: z.strictObject({}),
  close_session: z.strictObject({
    sessionId: z.string().uuid(),
    discardUnsavedChanges: z.boolean().default(false),
  }),
  list_documents: z.strictObject({ sessionId }),
  get_capabilities: z.strictObject({
    includeErrorCodes: z.boolean().default(false),
  }),
  get_element_catalog: elementCatalogQuerySchema,
  get_elements: z.strictObject({
    sessionId,
    documentId,
    expectedRevision: revision.optional(),
    ...elementQueryShape,
  }),
  find_elements: z.strictObject({
    sessionId,
    documentId,
    expectedRevision: revision.optional(),
    ...elementSearchShape,
  }),
  get_element: z.strictObject({
    sessionId,
    documentId,
    expectedRevision: revision.optional(),
    ...elementLookupShape,
  }),
  get_selection: z.strictObject({
    sessionId,
    documentId,
    expectedRevision: revision.optional(),
  }),
  get_pages: z.strictObject({
    sessionId,
    documentId,
    expectedRevision: revision.optional(),
    ...layoutReadShape,
  }),
  get_page_elements: z.strictObject({
    sessionId,
    documentId,
    expectedRevision: revision.optional(),
    ...pageElementQueryShape,
  }),
  edit_elements: z.strictObject({
    sessionId,
    documentId,
    expectedRevision: revision,
    actions: elementEditBatchSchema,
  }),
  get_document: z.strictObject({
    sessionId,
    documentId,
    expectedRevision: revision.optional(),
    sections: z.array(z.enum(documentReadSections)).optional(),
    offset: z.number().int().nonnegative().default(0),
    limit: z.number().int().min(1).max(1000).default(100),
  }),
  create_document: z.strictObject({ sessionId, title: z.string().optional() }),
  open_document: z.strictObject({ sessionId, filePath }),
  close_document: z.strictObject({
    sessionId,
    documentId,
    expectedRevision: revision,
    discardUnsavedChanges: z.boolean().default(false),
  }),
  get_paragraph_styles: z.strictObject({
    sessionId,
    documentId,
    ids: z.array(z.string().min(1)).optional(),
    includeResolved: z.boolean().default(true),
  }),
  edit_paragraph_styles: z.strictObject({
    sessionId,
    documentId,
    expectedRevision: revision,
    changes: z.array(paragraphStyleChangeSchema).min(1),
    includeStyles: z.boolean().default(false),
  }),
  replace_document_properties: z.strictObject({
    sessionId,
    documentId,
    expectedRevision: revision,
    properties: documentPropertiesSchema,
  }),
  save_document: z.strictObject({
    sessionId,
    documentId,
    expectedRevision: revision,
    filePath: filePath.optional(),
    overwrite: z.boolean().default(false),
  }),
  export_pdf: z.strictObject({
    sessionId,
    documentId,
    expectedRevision: revision,
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
