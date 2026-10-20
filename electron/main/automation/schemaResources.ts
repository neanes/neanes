import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { automationTools } from './tools';

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
  return automationTools().flatMap((tool) =>
    (['input', 'output'] as const).map((view) => ({
      uri: `neanes://schemas/${tool.name}/${view}`,
      name: `${tool.name} ${view} schema`,
      mimeType: 'application/json',
    })),
  );
}

export function readToolSchemaResource(uri: string) {
  const match = /^neanes:\/\/schemas\/([a-z_]+)\/(input|output)$/.exec(uri);
  if (!match) {
    throw new McpError(-32002, 'Unknown tool schema resource.');
  }
  const tool = automationTools().find((tool) => tool.name === match[1]);
  if (!tool) {
    throw new McpError(-32002, 'Unknown tool schema resource.');
  }
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
