import { timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import {
  AutomationError,
  automationError,
} from '../../../src/services/automation/errors';
import {
  type AutomationRequest,
  automationSchemas,
  type AutomationTool,
  parseAutomationRequest,
} from '../../../src/services/automation/protocol';
import {
  automationOutputSchema,
  automationResultSchemas,
} from '../../../src/services/automation/results';

const descriptions: Record<AutomationTool, string> = {
  create_session:
    'Create an isolated session. Its ID is a bearer capability; pass sessionId to document tools. Sessions expire after 15 idle minutes and discard unsaved drafts. At most 4 sessions and 16 documents per session. HTTP disconnect does not close a session.',
  close_session:
    'Close an isolated session atomically. Unsaved documents require explicit discardUnsavedChanges. Does not save or delete files.',
  get_capabilities:
    'Describe supported operations, font families, file formats, and style units. Requires the editor to be ready.',
  list_documents:
    'List interactive workspaces, or only documents owned by the supplied sessionId, with IDs and revisions. Does not open files.',
  get_element_catalog:
    'Describe every live element content property and neume enum. Read-only inspection schemas, not edit validation or a writable score format. Lists nested collections and header/footer variants. Text-box and drop-cap lineHeight is special: omission inherits the paragraph style, null explicitly resets to normal, and a number overrides its multiplier.',
  get_elements:
    'Read typed elements in a collection (staff by default). Ranges use zero-based start inclusive/end exclusive; offset is relative to that range. Follow nextOffset with expectedRevision to prevent mixed-revision pages. Child collections use a returned parentRef. References are opaque, scoped to one open document, and survive movement and undo restoration of the same object; removal makes them unavailable and reopen assigns new references. Element properties omit null and undefined values except lineHeight: null, which explicitly resets text-box or drop-cap line height to normal. Omitted lineHeight inherits the paragraph style; other missing properties are unset. False, zero and empty strings remain present. Includes the terminal Empty sentinel. Header/footer collections are stored templates, not resolved page instances. Does not edit or save.',
  get_document:
    'Read document metadata and a paginated serialized score. Dimensions are CSS pixels. Use get_paragraph_styles for writable style definitions; serialized score styles use the save-format shape.',
  create_document:
    'Create an unsaved document using user defaults. With sessionId it belongs only to that isolated session; otherwise selects a new interactive tab.',
  open_document:
    'With sessionId, read saved contents independently of interactive unsaved edits; never reuse an interactive tab. Without sessionId, open and select a .byzx or .byz file within configured roots. Reuses an existing workspace and preserves unsaved edits. Returns created: true only when a new workspace was added.',
  close_document:
    'With sessionId, close only that session document; selectedDocumentId is null, no replacement document or recovery entry is created. Without sessionId, close a workspace without saving or deleting score files. Requires the last read revision, even when discarding. Unsaved or recovered documents require explicit discardUnsavedChanges: true; otherwise UNSAVED_CHANGES is returned. Removes recovery data. Closing the last workspace creates a blank workspace and keeps the server running. Return includes the closed ID and resulting selected ID. Close only workspaces you introduced unless the user requests otherwise; open_document.created distinguishes new workspaces from reused ones.',
  get_paragraph_styles:
    'Read all writable style definitions and separate read-only resolved values. Dimensions are CSS pixels; lineHeight is a multiplier. Built-in labels are read-only metadata.',
  edit_paragraph_styles:
    'Atomically create, replace, or delete paragraph styles in one undo step. Each create/replace supplies a complete definition; omitted overrides inherit, supported null values explicitly reset. IDs are immutable. Built-in styles cannot be created, deleted, or renamed. Custom null parents normalize to default-text. Action order is irrelevant: parents may be created in the same batch. One action per ID; the final graph must have existing parents and no cycles. Deleting styles reparents untouched children and content references to surviving ancestors or surface defaults. Explicitly referencing a deleted parent is rejected. Requires the last read revision. Does not save.',
  replace_document_properties:
    'Replace the complete document properties (title and author) in one undo step. Requires the last read revision. Does not save.',
  save_document:
    'Save a workspace to an explicit path, or its source path. Existing destinations require overwrite, except saving to the unchanged source. Requires the last read revision.',
  export_pdf:
    'Export a document to an explicit PDF path without a dialog. Does not save the score. Existing destinations require overwrite. Requires the last read revision.',
};

export interface McpServerOptions {
  token: string;
  port: number;
  version: string;
  execute(request: AutomationRequest, signal: AbortSignal): Promise<unknown>;
}

export async function startMcpServer(options: McpServerOptions) {
  if (options.token.length < 32) {
    throw new Error(
      'MCP_TOKEN_REQUIRED: Supply a token with at least 32 characters.',
    );
  }
  if (
    !Number.isInteger(options.port) ||
    options.port < 0 ||
    options.port > 65535
  ) {
    throw new Error('INVALID_MCP_PORT');
  }
  let queue = Promise.resolve();
  const active = new Set<McpServer>();
  const http = createServer(async (req, res) => {
    // Do not expose the endpoint to browser origins or non-loopback hosts.
    if (
      !/^127\.0\.0\.1(?::\d+)?$/.test(req.headers.host ?? '') &&
      !/^localhost(?::\d+)?$/.test(req.headers.host ?? '')
    ) {
      res.writeHead(403).end();
      return;
    }
    if (req.headers.origin !== undefined) {
      res.writeHead(403).end();
      return;
    }
    const expected = Buffer.from(`Bearer ${options.token}`);
    const supplied = Buffer.from(req.headers.authorization ?? '');
    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    ) {
      res.writeHead(401).end();
      return;
    }
    if (req.url !== '/mcp') {
      res.writeHead(404).end();
      return;
    }
    if (req.method !== 'POST') {
      res.writeHead(405, { Allow: 'POST' }).end();
      return;
    }
    const connection = new AbortController();
    const server = new McpServer(
      { name: 'neanes', version: options.version },
      { capabilities: { tools: {} } },
    );
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
      maxRequestBodySize: 1024 * 1024,
    });
    server.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: (Object.keys(automationSchemas) as AutomationTool[]).map(
        (tool): Tool => ({
          name: tool,
          description: descriptions[tool],
          inputSchema: {
            ...z.toJSONSchema(automationSchemas[tool]),
            type: 'object',
          } as Tool['inputSchema'],
          outputSchema: {
            ...z.toJSONSchema(automationOutputSchema(tool)),
            type: 'object',
          } as Tool['outputSchema'],
          annotations: {
            readOnlyHint: [
              'get_capabilities',
              'list_documents',
              'get_document',
              'get_element_catalog',
              'get_elements',
              'get_paragraph_styles',
            ].includes(tool),
            destructiveHint: ![
              'get_capabilities',
              'list_documents',
              'get_document',
              'get_element_catalog',
              'get_elements',
              'get_paragraph_styles',
              'create_session',
              'create_document',
              'open_document',
            ].includes(tool),
            openWorldHint: false,
          },
        }),
      ),
    }));
    // Validate tool arguments here so application failures always have our structured
    // error contract, including invalid arguments. JSON-RPC framing errors remain protocol errors.
    server.server.setRequestHandler(
      CallToolRequestSchema,
      async ({ params }, extra) => {
        let outcome;
        try {
          if (!Object.hasOwn(automationSchemas, params.name)) {
            throw new AutomationError({
              code: 'TOOL_NOT_FOUND',
              message: 'Unknown tool.',
              details: { tool: params.name },
            });
          }
          const request = parseAutomationRequest({
            tool: params.name,
            arguments: params.arguments ?? {},
          });
          const pending = queue.then(() => {
            connection.signal.throwIfAborted();
            extra.signal.throwIfAborted();
            return options.execute(
              request,
              AbortSignal.any([connection.signal, extra.signal]),
            );
          });
          queue = pending.then(
            () => undefined,
            () => undefined,
          );
          const result = await pending;
          // Serialize once to the wire representation before validating optional save-format fields.
          const parsed = automationResultSchemas[request.tool].safeParse(
            JSON.parse(JSON.stringify(result)),
          );
          if (!parsed.success) {
            throw new AutomationError({
              code: 'INTERNAL_ERROR',
              message: 'The tool returned an invalid result.',
              details: { tool: request.tool },
            });
          }
          outcome = { success: true as const, result: parsed.data };
        } catch (error) {
          outcome = { success: false as const, error: automationError(error) };
        }
        return {
          ...(!outcome.success ? { isError: true } : {}),
          structuredContent: outcome,
          content: [{ type: 'text' as const, text: JSON.stringify(outcome) }],
        };
      },
    );
    active.add(server);
    res.once('close', () => {
      if (!res.writableEnded) {
        connection.abort(new Error('EXPORT_CANCELLED'));
      }
      active.delete(server);
      void server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('MCP request failed', error);
      if (!res.headersSent) {
        res.writeHead(500).end();
      } else {
        res.end();
      }
    }
  });
  http.requestTimeout = 30_000;
  http.headersTimeout = 10_000;
  await new Promise<void>((resolve, reject) => {
    http.once('error', reject);
    http.listen(options.port, '127.0.0.1', resolve);
  });
  return {
    port: (http.address() as AddressInfo).port,
    async close() {
      await Promise.all([...active].map((server) => server.close()));
      http.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        http.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}
