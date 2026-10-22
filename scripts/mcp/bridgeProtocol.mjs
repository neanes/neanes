// Bridge-only defaults keep agent tasks independent of the app's launch order.
export function isDocumentTool(tool) {
  return (
    tool.name !== 'close_session' &&
    Object.hasOwn(tool.inputSchema.properties ?? {}, 'sessionId')
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
    'Document tools default to private documents, regardless of launch order. Set documentScope:"editor" on list_documents to discover open editor tabs, and on subsequent tools to work with them. Explicit sessionId addresses an existing private session. Save explicitly. Connection loss never retries edits automatically.',
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
  if (scope === 'editor' && args.sessionId) {
    throw new Error('Use either editor scope or sessionId, not both.');
  }
  return { scope, arguments: argumentsWithoutScope };
}

// A late reply from an old session must not clear a newer cached session.
export function handleAutomaticSessionReply(
  reply,
  currentSession,
  usedSession,
) {
  const outcome = reply?.result?.structuredContent;
  if (
    !usedSession ||
    outcome?.success !== false ||
    outcome.error.code !== 'SESSION_NOT_FOUND'
  ) {
    return { reply, session: currentSession };
  }
  const reported = {
    ...outcome,
    error: {
      ...outcome.error,
      message:
        'The automatic private session expired or was closed. This request was not replayed. Further default document requests use a fresh session; reopen saved documents before continuing.',
    },
  };
  return {
    session: currentSession === usedSession ? undefined : currentSession,
    reply: {
      ...reply,
      result: {
        ...reply.result,
        isError: true,
        structuredContent: reported,
        content: [{ type: 'text', text: JSON.stringify(reported) }],
      },
    },
  };
}
