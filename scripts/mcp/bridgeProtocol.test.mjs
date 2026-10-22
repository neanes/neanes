import { describe, expect, it } from 'vitest';

import {
  readToolSchemaResource,
  schemaResourceInstructions,
} from '../../electron/main/automation/schemaResources';
import { automationTools } from '../../electron/main/automation/tools';
import {
  bridgeInstructions,
  bridgeResourceContents,
  bridgeTools,
  documentScope,
  isDocumentTool,
} from './bridgeProtocol.mjs';

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
  it('defaults to private documents and rejects session IDs', () => {
    expect(documentScope({ documentId: 'score' })).toEqual({
      scope: 'private',
      arguments: { documentId: 'score' },
    });
    expect(() => documentScope({ sessionId: 'session' })).toThrow(
      'do not accept sessionId',
    );
    expect(
      documentScope({ documentScope: 'editor', documentId: 'score' }),
    ).toEqual({
      scope: 'editor',
      arguments: { documentId: 'score' },
    });
    expect(() =>
      documentScope({ documentScope: 'editor', sessionId: 'session' }),
    ).toThrow('do not accept sessionId');
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
