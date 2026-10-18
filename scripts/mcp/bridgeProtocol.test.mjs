import { describe, expect, it } from 'vitest';

import { automationTools } from '../../electron/main/automation/tools';
import {
  bridgeTools,
  documentScope,
  handleAutomaticSessionReply,
  isDocumentTool,
} from './bridgeProtocol.mjs';

describe('one bridge connection', () => {
  it('exposes explicit editor scope on real document tools without changing upstream definitions', () => {
    const originals = automationTools();
    const before = JSON.stringify(originals);
    const decorated = bridgeTools(originals);
    for (const tool of decorated) {
      if (isDocumentTool(tool)) {
        expect(tool.inputSchema.properties.documentScope.enum).toEqual([
          'private',
          'editor',
        ]);
        expect(tool.description).toBe(
          originals.find((original) => original.name === tool.name).description,
        );
      } else {
        expect(tool.inputSchema.properties).not.toHaveProperty('documentScope');
      }
    }
    expect(JSON.stringify(originals)).toBe(before);
    expect(decorated.map((tool) => tool.name)).toEqual(
      originals.map((tool) => tool.name),
    );
  });
  it('defaults to private documents and preserves explicit session ownership', () => {
    expect(documentScope({ documentId: 'score' })).toEqual({
      scope: 'private',
      arguments: { documentId: 'score' },
    });
    expect(documentScope({ sessionId: 'session' })).toEqual({
      scope: 'private',
      arguments: { sessionId: 'session' },
    });
    expect(
      documentScope({ documentScope: 'editor', documentId: 'score' }),
    ).toEqual({
      scope: 'editor',
      arguments: { documentId: 'score' },
    });
    expect(() =>
      documentScope({ documentScope: 'editor', sessionId: 'session' }),
    ).toThrow('either');
    expect(() => documentScope({ documentScope: 'other' })).toThrow('Invalid');
  });

  it('preserves search scope through publication and editor/private routing', () => {
    const tool = automationTools().find(
      (tool) => tool.name === 'find_elements',
    );
    const published = bridgeTools([tool])[0];
    expect(published.inputSchema.properties.scope).toEqual(
      tool.inputSchema.properties.scope,
    );
    for (const documentTarget of ['private', 'editor']) {
      const scope = { kind: 'collection', collection: { kind: 'staff' } };
      expect(documentScope({ documentScope: documentTarget, scope })).toEqual({
        scope: documentTarget,
        arguments: { scope },
      });
    }
  });

  it('budgets the inventory delivered to clients, including bridge arguments', () => {
    const tools = bridgeTools(automationTools());
    // Includes find_text and its bridge documentScope argument.
    expect(JSON.stringify({ tools }).length).toBeLessThan(136000);
    expect(
      JSON.stringify(
        tools.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        })),
      ).length,
    ).toBeLessThan(59000);
  });
});

describe('automatic private session expiry', () => {
  const expired = {
    jsonrpc: '2.0',
    id: 7,
    result: {
      isError: true,
      structuredContent: {
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session missing',
          details: {},
        },
      },
      content: [],
    },
  };

  it('releases the expired cache and reports failure without replaying the request', () => {
    const session = Promise.resolve('expired-session');
    const handled = handleAutomaticSessionReply(expired, session, session);
    expect(handled.session).toBeUndefined();
    expect(handled.reply.id).toBe(expired.id);
    expect(handled.reply.result.isError).toBe(true);
    expect(handled.reply.result.structuredContent).toMatchObject({
      success: false,
      error: { code: 'SESSION_NOT_FOUND' },
    });
    expect(handled.reply.result.structuredContent.error.message).toContain(
      'not replayed',
    );
    expect(handled.reply.result.structuredContent.error.message).toContain(
      'reopen saved documents',
    );
    expect(JSON.parse(handled.reply.result.content[0].text)).toEqual(
      handled.reply.result.structuredContent,
    );
    expect(expired.result.structuredContent.error.message).toBe(
      'Session missing',
    );
  });

  it('keeps a fresh cached session when an older in-flight request reports expiry', () => {
    const oldSession = Promise.resolve('expired-session');
    const freshSession = Promise.resolve('fresh-session');
    expect(
      handleAutomaticSessionReply(expired, freshSession, oldSession).session,
    ).toBe(freshSession);
  });

  it('does not reset the automatic cache for explicit sessions or unrelated errors', () => {
    const session = Promise.resolve('automatic-session');
    expect(handleAutomaticSessionReply(expired, session, undefined)).toEqual({
      reply: expired,
      session,
    });
    const conflict = {
      ...expired,
      result: {
        ...expired.result,
        structuredContent: {
          success: false,
          error: {
            code: 'REVISION_CONFLICT',
            message: 'Conflict',
            details: {},
          },
        },
      },
    };
    expect(handleAutomaticSessionReply(conflict, session, session)).toEqual({
      reply: conflict,
      session,
    });
    const success = {
      jsonrpc: '2.0',
      id: 8,
      result: { structuredContent: { success: true, result: [] } },
    };
    expect(handleAutomaticSessionReply(success, session, session)).toEqual({
      reply: success,
      session,
    });
  });
});
