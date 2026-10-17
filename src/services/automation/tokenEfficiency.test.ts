import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { describe, expect, it } from 'vitest';

import { ElementType, NoteElement } from '@/models/Element';
import { Score } from '@/models/Score';

import { automationTools } from '../../../electron/main/automation/tools';
import { ElementDiscovery } from '../documents/elementDiscovery';
import { automationErrorCodes } from './errors';
import { parseAutomationRequest } from './protocol';
import { automationOutputSchema, automationResultSchemas } from './results';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';
const summary = {
  documentId: 'test',
  revision: 0,
  filePath: null,
  sourceFormat: null,
  title: '',
  hasUnsavedChanges: false,
  selected: false,
  elementCount: 2,
};

describe('MCP token efficiency contracts', () => {
  it('budgets the actual tools/list inventory and its separate schema views', () => {
    const tools = automationTools();
    const size = (value: unknown) => JSON.stringify(value).length;
    const sizes = {
      inventory: size({ tools }),
      inputs: tools.reduce((total, tool) => total + size(tool.inputSchema), 0),
      outputs: tools.reduce(
        (total, tool) => total + size(tool.outputSchema),
        0,
      ),
      inputView: size(
        tools.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        })),
      ),
      elementOutput: size(
        tools.find((tool) => tool.name === 'get_elements')!.outputSchema,
      ),
    };
    expect(tools).toHaveLength(16);
    expect(sizes.inventory).toBeLessThan(68000);
    expect(sizes.inputs).toBeLessThan(19000);
    expect(sizes.outputs).toBeLessThan(42000);
    expect(sizes.inputView).toBeLessThan(29000);
    expect(sizes.elementOutput).toBeLessThan(4500);
    console.info('MCP published inventory sizes (characters)', sizes);
  });

  it('publishes valid projected outcomes while keeping type-specific runtime validation', () => {
    const tools = automationTools();
    const validator = new AjvJsonSchemaValidator();
    const score = new Score();
    score.staff.elements.unshift(new NoteElement());
    const page = new ElementDiscovery().read(score, {
      collection: { kind: 'staff' },
      start: 0,
      offset: 0,
      limit: 100,
      properties: ['quantitativeNeume', 'lyrics'],
    });
    const result = { ...summary, ...page };
    const outcome = { success: true, result };
    expect(automationOutputSchema('get_elements').parse(outcome)).toEqual(
      outcome,
    );
    expect(
      validator.getValidator(
        tools.find((tool) => tool.name === 'get_elements')!.outputSchema!,
      )(outcome),
    ).toMatchObject({ valid: true });
    for (const properties of [
      { quantitativeNeume: 'invalid' },
      { lyrics: null },
      { unknown: true },
    ]) {
      expect(
        automationResultSchemas.get_elements.safeParse({
          ...result,
          elements: [
            { ...page.elements[0], elementType: ElementType.Note, properties },
          ],
        }).success,
      ).toBe(false);
    }
    expect(
      automationOutputSchema('get_elements').safeParse({
        success: false,
        error: { code: 'UNKNOWN', message: '', details: {} },
      }).success,
    ).toBe(false);
    for (const tool of tools) {
      const validate = validator.getValidator(tool.outputSchema!);
      for (const code of automationErrorCodes) {
        expect(
          validate({
            success: false,
            error: { code, message: 'failure', details: {} },
          }),
        ).toMatchObject({ valid: true });
      }
    }
  });

  it('accepts efficient input options in both published and runtime contracts', () => {
    const tools = automationTools();
    const validator = new AjvJsonSchemaValidator();
    for (const [name, args] of [
      ['get_capabilities', { includeErrorCodes: true }],
      [
        'get_document',
        {
          documentId: 'test',
          sections: ['staffElements'],
          expectedRevision: 0,
        },
      ],
      ['get_document', { documentId: 'test', sections: [] }],
      [
        'get_elements',
        { documentId: 'test', properties: [], includeContent: false },
      ],
      [
        'get_paragraph_styles',
        { documentId: 'test', ids: ['lyrics'], includeResolved: false },
      ],
    ] as const) {
      expect(
        validator.getValidator(
          tools.find((tool) => tool.name === name)!.inputSchema,
        )(args),
      ).toMatchObject({ valid: true });
      expect(() =>
        parseAutomationRequest({ tool: name, arguments: args }),
      ).not.toThrow();
    }
    expect(
      automationResultSchemas.edit_paragraph_styles.parse({
        ...summary,
        affectedStyleIds: ['lyrics'],
      }),
    ).toEqual({ ...summary, affectedStyleIds: ['lyrics'] });
  });
});
