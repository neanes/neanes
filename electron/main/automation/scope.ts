import type {
  TextResourceContents,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { dropCapLyricInstruction } from '../../../src/automation/contracts/lyricSyntax';

// Private defaults keep agent tasks independent of the app launch order.
export function isDocumentTool(tool: Tool) {
  return (
    ['list_documents', 'create_document', 'open_document'].includes(
      tool.name,
    ) || Object.hasOwn(tool.inputSchema.properties ?? {}, 'documentId')
  );
}

export function scopedTools(tools: Tool[]): Tool[] {
  return tools.map((tool) =>
    isDocumentTool(tool)
      ? {
          ...tool,
          inputSchema: {
            ...tool.inputSchema,
            properties: {
              ...tool.inputSchema.properties,
              documentScope: {
                type: 'string',
                enum: ['private', 'editor'],
                description: 'Default: private. Use editor for open tabs.',
              },
            },
          },
        }
      : tool,
  );
}

export function scopedResourceContents(
  contents: TextResourceContents[],
): TextResourceContents[] {
  return contents.map((resource) => {
    if (!/^neanes:\/\/schemas\/[a-z_]+\/input$/.test(resource.uri)) {
      return resource;
    }
    const definition = JSON.parse(resource.text);
    const [tool] = scopedTools([
      { name: definition.tool, inputSchema: definition.schema },
    ]);
    return {
      ...resource,
      text: JSON.stringify({ ...definition, schema: tool.inputSchema }),
    };
  });
}

export function scopedInstructions(instructions: string) {
  return [
    dropCapLyricInstruction,
    'Document tools default to private documents, regardless of launch order. Set documentScope:"editor" on list_documents to discover open editor tabs, and on subsequent tools to work with them. Private documents last for the worker lifetime without idle expiry. Save explicitly. Connection loss never retries edits automatically.',
    instructions,
  ]
    .filter(Boolean)
    .join('\n');
}

export function documentScope(args: Record<string, unknown>) {
  const { documentScope: scope = 'private', ...argumentsWithoutScope } = args;
  if (scope !== 'private' && scope !== 'editor') {
    throw new Error('Invalid document scope.');
  }
  return { scope, arguments: argumentsWithoutScope };
}
