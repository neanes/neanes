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
          description: `${tool.description} Through this connection, omitted scope uses private documents. Set scope:"editor" to discover or work with open editor tabs. Explicit sessionId addresses that private session.`,
          inputSchema: {
            ...tool.inputSchema,
            properties: {
              ...tool.inputSchema.properties,
              scope: {
                type: 'string',
                enum: ['private', 'editor'],
                description:
                  'Defaults to private documents. Use editor explicitly for open editor tabs.',
              },
            },
          },
        }
      : tool,
  );
}

export function documentScope(args) {
  const { scope = 'private', ...argumentsWithoutScope } = args;
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
