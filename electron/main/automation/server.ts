import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  AutomationError,
  automationError,
} from '../../../src/automation/contracts/errors';
import {
  type AutomationRequest,
  isToolAvailable,
  parseAutomationRequest,
} from '../../../src/automation/contracts/protocol';
import { assertResultBudget } from '../../../src/automation/contracts/responseBudget';
import { automationResultSchemas } from '../../../src/automation/contracts/results';
import compatibility from './compatibility.json';
import {
  readToolSchemaResource,
  schemaResourceInstructions,
  toolSchemaResources,
  toolSchemaResourceTemplate,
} from './schemaResources';
import {
  documentScope,
  isDocumentTool,
  scopedInstructions,
  scopedResourceContents,
  scopedTools,
} from './scope';
import { automationTools } from './tools';

export function createMcpServer(options: {
  version: string;
  execute(request: AutomationRequest, signal: AbortSignal): Promise<unknown>;
  executeEditor(
    request: AutomationRequest,
    signal: AbortSignal,
  ): Promise<unknown>;
}) {
  const tools = scopedTools(automationTools('headless'));
  const resources = toolSchemaResources('headless');
  const server = new McpServer(
    { name: 'neanes', version: options.version },
    {
      capabilities: {
        tools: {},
        resources: {},
        experimental: {
          'neanes/automation': {
            contractVersion: compatibility.contractVersion,
          },
        },
      },
      instructions: scopedInstructions(schemaResourceInstructions),
    },
  );
  server.server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));
  server.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources,
  }));
  server.server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async () => ({
      resourceTemplates: [toolSchemaResourceTemplate],
    }),
  );
  server.server.setRequestHandler(
    ReadResourceRequestSchema,
    async ({ params }) => ({
      contents: scopedResourceContents(
        readToolSchemaResource(params.uri, 'headless').contents,
      ),
    }),
  );
  // Validate tool arguments here so application failures always have our structured
  // error contract, including invalid arguments. JSON-RPC framing errors remain protocol errors.
  server.server.setRequestHandler(
    CallToolRequestSchema,
    async ({ params }, extra) => {
      let outcome;
      try {
        if (!isToolAvailable(params.name)) {
          throw new AutomationError({
            code: 'TOOL_NOT_FOUND',
            message: 'Unknown tool.',
            details: { tool: params.name },
          });
        }
        const tool = tools.find((tool) => tool.name === params.name)!;
        const routed = isDocumentTool(tool)
          ? documentScope(params.arguments ?? {})
          : { scope: 'private', arguments: params.arguments ?? {} };
        const request = parseAutomationRequest({
          tool: params.name,
          arguments: routed.arguments,
        });
        const result = await (routed.scope === 'editor'
          ? options.executeEditor(request, extra.signal)
          : options.execute(request, extra.signal));
        // Serialize once to the wire representation before validating optional save-format fields.
        assertResultBudget(result, request.tool);
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
  return server;
}
