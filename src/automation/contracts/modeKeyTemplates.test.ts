import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { describe, expect, it } from 'vitest';

import { automationOutputSchema } from '@/automation/__tests__/helpers';
import { ElementType } from '@/models/Element';
import { modeKeyTemplates } from '@/models/ModeKeys';

import { automationTools } from '../../../electron/main/automation/tools';
import { getElementCatalog } from './elementSchemas';
import { getModeKeyTemplates } from './modeKeyTemplates';
import { parseAutomationRequest } from './protocol';

describe('mode-key catalog', () => {
  it('publishes every template with descriptions in a bounded summary response', () => {
    const result = getModeKeyTemplates({});
    expect(result.templates).toHaveLength(modeKeyTemplates.length);
    expect(result.templates).toHaveLength(44);
    expect(new Set(result.templates.map((item) => item.templateId)).size).toBe(
      44,
    );
    expect(JSON.stringify(result).length).toBeLessThan(10000);
    const outcome = { success: true, result };
    expect(
      automationOutputSchema('get_mode_key_templates').parse(outcome),
    ).toEqual(outcome);
    const tool = automationTools().find(
      (item) => item.name === 'get_mode_key_templates',
    )!;
    expect(JSON.stringify(tool).length).toBeLessThan(3500);
    const validator = new AjvJsonSchemaValidator();
    expect(validator.getValidator(tool.outputSchema!)(outcome)).toMatchObject({
      valid: true,
    });
    expect(validator.getValidator(tool.inputSchema)({ mode: 6 })).toMatchObject(
      { valid: true },
    );
    expect(
      parseAutomationRequest({ tool: tool.name, arguments: { mode: 6 } })
        .arguments,
    ).toEqual({ mode: 6 });
    expect(
      result.templates.find((item) => item.templateId === 100),
    ).toMatchObject({
      description: 'Heirmologic and Sticheraric',
      supportsOptionalDiatonicFthora: true,
    });
  });

  it('exposes enough information for the requested mode variants', () => {
    const sixth = getModeKeyTemplates({ mode: 6 }).templates;
    expect(sixth).toHaveLength(5);
    expect(JSON.stringify({ templates: sixth }).length).toBeLessThan(2000);
    expect(sixth.find((item) => item.templateId === 604)).toEqual({
      templateId: 604,
      mode: 6,
      description: 'Heptaphonic (Makam Hicâzkâr)',
      scale: 'HardChromatic',
      scaleNote: 'PaHigh',
      supportsOptionalDiatonicFthora: false,
    });
    expect(
      getModeKeyTemplates({ mode: 7, templateIds: [703, 604] }).templates.map(
        (item) => item.templateId,
      ),
    ).toEqual([703]);
    expect(getModeKeyTemplates({ templateIds: [999] }).templates).toEqual([]);
    expect(
      getModeKeyTemplates({ mode: 7 }).templates.find(
        (item) => item.templateId === 703,
      )?.description,
    ).toBe('Pentaphonic (Makam Ferâhnâk)');
  });

  it('exposes the construction option only in writable property discovery', () => {
    const catalog = getElementCatalog({
      elementTypes: [ElementType.ModeKey],
      properties: ['useOptionalDiatonicFthoras'],
    });
    expect(catalog.elementTypes).toHaveLength(1);
    const entry = catalog.elementTypes[0];
    expect(entry.editProperties?.properties).toHaveProperty(
      'useOptionalDiatonicFthoras',
    );
    expect(entry.properties?.properties).not.toHaveProperty(
      'useOptionalDiatonicFthoras',
    );
  });

  it.each([
    { mode: 0 },
    { mode: 9 },
    { mode: 1.5 },
    { templateIds: [] },
    { query: 'hijaz-kar' },
  ])('rejects unsupported query %j', (args) => {
    expect(() =>
      parseAutomationRequest({
        tool: 'get_mode_key_templates',
        arguments: args,
      }),
    ).toThrow();
  });
});
