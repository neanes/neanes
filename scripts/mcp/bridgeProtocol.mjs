// Bridge-only defaults keep agent tasks independent of the app's launch order.
export function isDocumentTool(tool) {
  return (
    ['list_documents', 'create_document', 'open_document'].includes(
      tool.name,
    ) || Object.hasOwn(tool.inputSchema.properties ?? {}, 'documentId')
  );
}

export function bridgeTools(tools) {
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

export function bridgeResourceContents(contents) {
  return contents.map((resource) => {
    if (!/^neanes:\/\/schemas\/[a-z_]+\/input$/.test(resource.uri)) {
      return resource;
    }
    const definition = JSON.parse(resource.text);
    const [tool] = bridgeTools([
      { name: definition.tool, inputSchema: definition.schema },
    ]);
    return {
      ...resource,
      text: JSON.stringify({ ...definition, schema: tool.inputSchema }),
    };
  });
}

export function bridgeInstructions(instructions) {
  return [
    'Document tools default to private documents, regardless of launch order. Set documentScope:"editor" on list_documents to discover open editor tabs, and on subsequent tools to work with them. Private documents last for the worker lifetime without idle expiry. Save explicitly. Connection loss never retries edits automatically.',
    instructions,
  ]
    .filter(Boolean)
    .join('\n');
}

export function documentScope(args) {
  const { documentScope: scope = 'private', ...argumentsWithoutScope } = args;
  if (!['private', 'editor'].includes(scope)) {
    throw new Error('Invalid document scope.');
  }
  if (Object.hasOwn(args, 'sessionId')) {
    throw new Error(
      'Bridge documents do not accept sessionId. Use documentScope to choose private documents or editor tabs.',
    );
  }
  return { scope, arguments: argumentsWithoutScope };
}
