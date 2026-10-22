import { McpError } from '@modelcontextprotocol/sdk/types.js';

import {
  automationSchemas,
  type AutomationTool,
} from '../../../src/automation/contracts/protocol';
import { automationTool } from './tools';

export const schemaResourceInstructions =
  'Complete tool schemas: neanes://schemas/{tool}/{view}, view=input|output (MCP resources). Read these for omitted constraints, defaults, field guidance or recursive shapes; resolve local $refs within schema. JSON values recursively contain scalars, null, arrays or objects.';

export const toolSchemaResourceTemplate = {
  uriTemplate: 'neanes://schemas/{tool}/{view}',
  name: 'tool_schema',
  description:
    'Complete published tool schema and description. tool is a tools/list name; view is input or output. Preserves constraints, defaults, field descriptions and recursive definitions.',
  mimeType: 'application/json',
};

export function toolSchemaResources() {
  return Object.keys(automationSchemas).flatMap((name) =>
    (['input', 'output'] as const).map((view) => ({
      uri: `neanes://schemas/${name}/${view}`,
      name: `${name} ${view} schema`,
      mimeType: 'application/json',
    })),
  );
}

export function readToolSchemaResource(uri: string) {
  const match = /^neanes:\/\/schemas\/([a-z_]+)\/(input|output)$/.exec(uri);
  if (!match) {
    throw new McpError(-32002, 'Unknown tool schema resource.');
  }
  if (!Object.hasOwn(automationSchemas, match[1])) {
    throw new McpError(-32002, 'Unknown tool schema resource.');
  }
  const tool = automationTool(match[1] as AutomationTool);
  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          tool: tool.name,
          description: tool.description,
          schema: match[2] === 'input' ? tool.inputSchema : tool.outputSchema,
        }),
      },
    ],
  };
}
