import { z } from 'zod';

import { documentPropertiesSchema } from '../documents/documentPropertiesSchema';
import { paragraphStyleChangeSchema } from '../documents/paragraphStyleSchema';
import type { AutomationOutcome } from './errors';

const documentId = z.string().min(1);
const revision = z.number().int().nonnegative();
const filePath = z.string().min(1);

export const automationSchemas = {
  list_documents: z.strictObject({}),
  get_capabilities: z.strictObject({}),
  get_document: z.strictObject({
    documentId,
    offset: z.number().int().nonnegative().default(0),
    limit: z.number().int().min(1).max(1000).default(100),
  }),
  create_document: z.strictObject({ title: z.string().optional() }),
  open_document: z.strictObject({ filePath }),
  close_document: z.strictObject({
    documentId,
    expectedRevision: revision,
    discardUnsavedChanges: z.boolean().default(false),
  }),
  get_paragraph_styles: z.strictObject({ documentId }),
  edit_paragraph_styles: z.strictObject({
    documentId,
    expectedRevision: revision,
    changes: z.array(paragraphStyleChangeSchema).min(1),
  }),
  replace_document_properties: z.strictObject({
    documentId,
    expectedRevision: revision,
    properties: documentPropertiesSchema,
  }),
  save_document: z.strictObject({
    documentId,
    expectedRevision: revision,
    filePath: filePath.optional(),
    overwrite: z.boolean().default(false),
  }),
  export_pdf: z.strictObject({
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
