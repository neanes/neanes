import {
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  McpError,
  ReadResourceResultSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { describe, expect, it } from 'vitest';

import {
  readToolSchemaResource,
  toolSchemaResources,
  toolSchemaResourceTemplate,
} from './schemaResources';
import { automationTools } from './tools';

describe('complete tool schema resources', () => {
  it('lists both complete schema views for every tool without changing them', () => {
    const tools = automationTools();
    const before = JSON.stringify(tools);
    const resources = toolSchemaResources();
    expect(resources).toHaveLength(tools.length * 2);
    expect(ListResourcesResultSchema.safeParse({ resources }).success).toBe(
      true,
    );
    expect(
      ListResourceTemplatesResultSchema.safeParse({
        resourceTemplates: [toolSchemaResourceTemplate],
      }).success,
    ).toBe(true);
    for (const tool of tools) {
      for (const view of ['input', 'output'] as const) {
        const uri = `neanes://schemas/${tool.name}/${view}`;
        expect(resources.some((resource) => resource.uri === uri)).toBe(true);
        const result = readToolSchemaResource(uri);
        expect(ReadResourceResultSchema.safeParse(result).success).toBe(true);
        expect(JSON.parse(result.contents[0].text)).toEqual({
          tool: tool.name,
          description: tool.description,
          schema: view === 'input' ? tool.inputSchema : tool.outputSchema,
        });
      }
    }
    expect(JSON.stringify(tools)).toBe(before);
  });

  it('retains validation and field guidance that client declarations can omit', () => {
    const read = (name: string) =>
      JSON.parse(
        readToolSchemaResource(`neanes://schemas/${name}/input`).contents[0]
          .text,
      ).schema;
    const preview = read('preview_page');
    expect(preview.properties.maxEdge).toMatchObject({
      minimum: 256,
      maximum: 2048,
      default: 1600,
    });
    expect(preview.properties.sessionId.format).toBe('uuid');
    const validate = new AjvJsonSchemaValidator().getValidator(preview);
    expect(
      validate({
        documentId: 'test',
        expectedRevision: 0,
        pageNumber: 1,
        maxEdge: 1,
      }),
    ).toMatchObject({ valid: false });
    expect(JSON.stringify(read('edit_elements'))).toContain(
      'spaces separate syllables',
    );
    const batch = read('batch_update_files');
    expect(
      batch.properties.edits.properties.pageSetup.propertyNames.enum,
    ).toContain('topMargin');
    const recursive = read('find_elements');
    expect(recursive.$defs).toBeDefined();
    expect(JSON.stringify(recursive)).toContain('"$ref"');
  });

  it.each([
    'neanes://schemas/no_such_tool/input',
    'neanes://schemas/constructor/input',
    'neanes://schemas/__proto__/output',
    'neanes://schemas/preview_page/other',
    'neanes://schemas/preview_page/input?other=true',
    'file:///tmp/score.byzx',
  ])('rejects unknown resources: %s', (uri) => {
    expect(() => readToolSchemaResource(uri)).toThrow(McpError);
  });
});
