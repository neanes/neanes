import compatibility from './compatibility.json' with { type: 'json' };

export const preferredProtocolVersion = compatibility.protocolVersions[0];

export function acceptInitialization(result) {
  if (result?.serverInfo?.name !== 'neanes') {
    throw new Error('The endpoint is not Neanes.');
  }
  if (
    result.capabilities?.experimental?.['neanes/automation']
      ?.contractVersion !== compatibility.contractVersion
  ) {
    throw new Error(
      'Incompatible Neanes automation contract. Save private drafts, update Neanes, and reconnect the MCP client.',
    );
  }
  if (!compatibility.protocolVersions.includes(result.protocolVersion)) {
    throw new Error(
      'Unsupported MCP protocol version. Update Neanes and reconnect.',
    );
  }
  return result.protocolVersion;
}

export function isRpcRequest(message) {
  return (
    message !== null &&
    typeof message === 'object' &&
    !Array.isArray(message) &&
    message.jsonrpc === '2.0' &&
    typeof message.method === 'string' &&
    message.method.length > 0 &&
    !Object.hasOwn(message, 'result') &&
    !Object.hasOwn(message, 'error') &&
    (!Object.hasOwn(message, 'id') || isRequestId(message.id)) &&
    (!Object.hasOwn(message, 'params') ||
      (message.params !== null &&
        typeof message.params === 'object' &&
        !Array.isArray(message.params)))
  );
}

export function isRequestId(id) {
  return typeof id === 'string' || Number.isInteger(id);
}

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
  return { scope, arguments: argumentsWithoutScope };
}
