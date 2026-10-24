import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { describe, expect, it } from 'vitest';

import { automationOutputSchema } from '@/automation/__tests__/helpers';
import { ElementType, NoteElement } from '@/models/Element';
import { Score } from '@/models/Score';

import { automationTools } from '../../../electron/main/automation/tools';
import { ElementDiscovery } from '../documents/elementDiscovery';
import { getParagraphStyles } from '../documents/paragraphStyleRead';
import { automationErrorCodes } from './errors';
import { parseAutomationRequest } from './protocol';
import { automationResultSchemas } from './results';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';
const summary = {
  documentId: 'test',
  revision: 0,
  filePath: null,
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
    console.info('MCP published inventory sizes (characters)', sizes);
    // Includes text search, mode-key templates and rich-text format discovery.
    expect(tools).toHaveLength(31);
    // Includes host file discovery and inline batch publication for clients that
    // lose local input references. Detailed style/settings constraints stay shared.
    // Detailed authoring guides remain opt-in, outside tools/list.
    expect(sizes.inventory).toBeLessThan(153000);
    expect(sizes.inputs).toBeLessThan(52000);
    expect(sizes.outputs).toBeLessThan(79000);
    expect(sizes.inputView).toBeLessThan(71500);
    expect(sizes.elementOutput).toBeLessThan(4500);
  });

  it('measures style discovery and existing mutation acknowledgments', () => {
    const styles = new Score().paragraphStyles;
    const size = (result: unknown) =>
      JSON.stringify({ success: true, result }).length;
    const complete = { ...summary, ...getParagraphStyles(styles) };
    const definitions = {
      ...summary,
      ...getParagraphStyles(styles, { includeResolved: false }),
    };
    const ids = { ...summary, ...getParagraphStyles(styles, { view: 'ids' }) };
    const tools = automationTools();
    const validator = new AjvJsonSchemaValidator();
    for (const result of [complete, definitions, ids]) {
      expect(
        automationResultSchemas.get_paragraph_styles.parse(result),
      ).toEqual(result);
      expect(
        validator.getValidator(
          tools.find((tool) => tool.name === 'get_paragraph_styles')!
            .outputSchema!,
        )({ success: true, result }),
      ).toMatchObject({ valid: true });
    }
    expect(size(ids)).toBeLessThan(size(complete) * 0.2);
    expect(size(ids)).toBeLessThan(size(definitions) * 0.6);
    const writes = {
      update_page_setup: summary,
      update_header_footer_settings: summary,
      edit_paragraph_styles: { ...summary, affectedStyleIds: ['lyrics'] },
      edit_elements: { ...summary, applied: true, createdCount: 0 },
      replace_document_properties: {
        ...summary,
        properties: { title: '', author: '' },
      },
      save_document: {
        ...summary,
        savedRevision: 0,
        savedContentUnchanged: true,
      },
      export_pdf: {
        ...summary,
        exportedRevision: 0,
        outputFilePath: '/scores/result.pdf',
        format: 'pdf',
      },
    };
    for (const [name, result] of Object.entries(writes)) {
      expect(
        automationResultSchemas[name as keyof typeof writes].parse(result),
      ).toEqual(result);
    }
    console.info(
      'MCP representative response sizes (JSON characters, one envelope)',
      {
        styles: {
          complete: size(complete),
          definitions: size(definitions),
          ids: size(ids),
        },
        idsSavingsAcross37Reads: 37 * (size(complete) - size(ids)),
        writes: Object.fromEntries(
          Object.entries(writes).map(([name, result]) => [name, size(result)]),
        ),
      },
    );
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
      ['get_capabilities', { includeErrorCodes: true, includeFonts: true }],
      [
        'edit_paragraph_styles',
        {
          documentId: 'test',
          expectedRevision: 0,
          changes: [
            {
              action: 'update',
              id: 'default-text',
              changes: { overrides: { fontFamily: 'Source Serif' } },
            },
          ],
        },
      ],
      [
        'edit_paragraph_styles',
        {
          documentId: 'test',
          expectedRevision: 0,
          changes: [
            { action: 'update', id: 'lyrics', resetOverrides: ['fontFamily'] },
          ],
        },
      ],
      ['get_paragraph_styles', { documentId: 'test', view: 'ids' }],
      [
        'edit_elements',
        {
          documentId: 'test',
          expectedRevision: 0,
          includeCreated: false,
          actions: [{ action: 'insert', elements: [{ elementType: 'Note' }] }],
        },
      ],
      [
        'get_staff_lyrics',
        { documentId: 'test', offset: 0, limit: 8000, expectedRevision: 0 },
      ],
      [
        'get_element_content',
        {
          documentId: 'test',
          elementRef: '00000000-0000-4000-8000-000000000001',
          property: 'content',
          offset: 0,
          limit: 8000,
          expectedRevision: 0,
        },
      ],
      [
        'get_page_setup',
        { documentId: 'test', properties: ['topMargin'], expectedRevision: 0 },
      ],
      ['get_header_footer_settings', { documentId: 'test', properties: [] }],
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
