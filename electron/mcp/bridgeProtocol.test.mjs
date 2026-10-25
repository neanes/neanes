import { SUPPORTED_PROTOCOL_VERSIONS } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it } from 'vitest';

import {
  readToolSchemaResource,
  schemaResourceInstructions,
} from '../main/automation/schemaResources';
import { automationTools } from '../main/automation/tools';
import {
  acceptInitialization,
  bridgeInstructions,
  bridgeResourceContents,
  bridgeTools,
  documentScope,
  isDocumentTool,
  isRpcRequest,
} from './bridgeProtocol.mjs';
import compatibility from './compatibility.json' with { type: 'json' };

describe('bridge protocol compatibility', () => {
  const initialization = {
    protocolVersion: '2025-11-25',
    serverInfo: { name: 'neanes', version: '0.5.56' },
    capabilities: {
      experimental: {
        'neanes/automation': { contractVersion: compatibility.contractVersion },
      },
    },
  };

  it('declares only bridge-supported revisions available in the installed SDK', () => {
    expect(compatibility.protocolVersions).toEqual([
      '2025-11-25',
      '2025-06-18',
    ]);
    for (const protocolVersion of compatibility.protocolVersions) {
      expect(SUPPORTED_PROTOCOL_VERSIONS).toContain(protocolVersion);
      expect(acceptInitialization({ ...initialization, protocolVersion })).toBe(
        protocolVersion,
      );
    }
  });

  it('allows different app releases only when their automation contracts match', () => {
    expect(
      acceptInitialization({
        ...initialization,
        serverInfo: { name: 'neanes', version: '0.5.57' },
      }),
    ).toBe(initialization.protocolVersion);
    for (const contractVersion of [undefined, 0, 2, '1']) {
      expect(() =>
        acceptInitialization({
          ...initialization,
          capabilities: {
            experimental: { 'neanes/automation': { contractVersion } },
          },
        }),
      ).toThrow('Incompatible Neanes automation contract');
    }
    expect(() =>
      acceptInitialization({ ...initialization, capabilities: {} }),
    ).toThrow('Incompatible');
    for (const protocolVersion of [
      '2025-03-26',
      '2024-11-05',
      '2024-10-07',
      'unknown',
    ]) {
      expect(() =>
        acceptInitialization({ ...initialization, protocolVersion }),
      ).toThrow('Unsupported MCP');
    }
    expect(() =>
      acceptInitialization({
        ...initialization,
        serverInfo: { name: 'other' },
      }),
    ).toThrow('not Neanes');
    expect(() => acceptInitialization(undefined)).toThrow('not Neanes');
  });

  it('accepts request and notification envelopes and rejects malformed JSON values', () => {
    for (const message of [
      { jsonrpc: '2.0', id: 0, method: 'ping' },
      { jsonrpc: '2.0', id: 'tools', method: 'tools/list', params: {} },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      {
        jsonrpc: '2.0',
        method: 'notifications/cancelled',
        params: { requestId: 1 },
      },
    ]) {
      expect(isRpcRequest(message)).toBe(true);
    }
    for (const message of [
      null,
      [],
      {},
      true,
      1,
      'ping',
      { jsonrpc: '1.0', id: 1, method: 'ping' },
      { jsonrpc: '2.0', id: null, method: 'ping' },
      { jsonrpc: '2.0', id: {}, method: 'ping' },
      { jsonrpc: '2.0', method: 1 },
      { jsonrpc: '2.0', method: 'ping', params: null },
      { jsonrpc: '2.0', method: 'ping', params: [] },
      { jsonrpc: '2.0', method: 'ping', result: {} },
      { jsonrpc: '2.0', method: 'ping', error: {} },
    ]) {
      expect(isRpcRequest(message)).toBe(false);
    }
  });
});

describe('one bridge connection', () => {
  it('preserves complete schema resources while adding document scope only to inputs', () => {
    for (const tool of automationTools('headless')) {
      for (const view of ['input', 'output']) {
        const { contents } = readToolSchemaResource(
          `neanes://schemas/${tool.name}/${view}`,
          'headless',
        );
        const before = JSON.stringify(contents);
        const decorated = bridgeResourceContents(contents);
        const definition = JSON.parse(decorated[0].text);
        const expected = bridgeTools([tool])[0];
        expect(definition.schema).toEqual(
          view === 'input' ? expected.inputSchema : expected.outputSchema,
        );
        expect(JSON.stringify(contents)).toBe(before);
      }
    }
  });

  it('retains server schema guidance alongside bridge routing instructions', () => {
    const instructions = bridgeInstructions(schemaResourceInstructions);
    expect(instructions).toContain('documentScope:"editor"');
    expect(instructions).toContain(schemaResourceInstructions);
    expect(bridgeInstructions(undefined)).not.toContain('undefined');
  });

  it('exposes explicit editor scope on real document tools without changing upstream definitions', () => {
    const originals = automationTools('headless');
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
  it('defaults to private documents and validates explicit scope', () => {
    expect(documentScope({ documentId: 'score' })).toEqual({
      scope: 'private',
      arguments: { documentId: 'score' },
    });
    expect(
      documentScope({ documentScope: 'editor', documentId: 'score' }),
    ).toEqual({
      scope: 'editor',
      arguments: { documentId: 'score' },
    });
    expect(() => documentScope({ documentScope: 'other' })).toThrow('Invalid');
  });

  it('preserves search scope through publication and editor/private routing', () => {
    const tool = automationTools('headless').find(
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
    const tools = bridgeTools(automationTools('headless'));
    // Includes host file discovery and an inline batch envelope; detailed
    // settings/style constraints remain in the single-document tools.
    expect(JSON.stringify({ tools }).length).toBeLessThan(156000);
    expect(
      JSON.stringify(
        tools.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        })),
      ).length,
    ).toBeLessThan(74500);
  });
});
