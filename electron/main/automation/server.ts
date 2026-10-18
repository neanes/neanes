import { timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  AutomationError,
  automationError,
} from '../../../src/automation/contracts/errors';
import { previewImageSchema } from '../../../src/automation/contracts/preview';
import {
  type AutomationRequest,
  automationSchemas,
  parseAutomationRequest,
} from '../../../src/automation/contracts/protocol';
import { automationResultSchemas } from '../../../src/automation/contracts/results';
import { automationTools } from './tools';

export interface McpServerOptions {
  token: string;
  port: number;
  version: string;
  authorize(): Promise<unknown>;
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
    try {
      await options.authorize();
    } catch {
      res.writeHead(403).end();
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
      tools: automationTools(),
    }));
    // Validate tool arguments here so application failures always have our structured
    // error contract, including invalid arguments. JSON-RPC framing errors remain protocol errors.
    server.server.setRequestHandler(
      CallToolRequestSchema,
      async ({ params }, extra) => {
        let outcome;
        let imageData: string | undefined;
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
          let result = await pending;
          if (request.tool === 'preview_page') {
            const image = previewImageSchema.safeParse({
              imageData: Reflect.get(result as object, 'imageData'),
              width: Reflect.get(result as object, 'width'),
              height: Reflect.get(result as object, 'height'),
            });
            if (!image.success) {
              throw new Error(
                'INTERNAL_ERROR: The preview returned an invalid image',
              );
            }
            imageData = image.data.imageData;
            const metadata = { ...(result as Record<string, unknown>) };
            delete metadata.imageData;
            result = metadata;
          }
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
          content: [
            { type: 'text' as const, text: JSON.stringify(outcome) },
            ...(outcome.success && imageData !== undefined
              ? [
                  {
                    type: 'image' as const,
                    data: imageData,
                    mimeType: 'image/png',
                  },
                ]
              : []),
          ],
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
