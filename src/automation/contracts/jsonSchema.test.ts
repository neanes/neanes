import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ElementType } from '@/models/Element';

import { getElementCatalog } from './elementSchemas';
import { compactJsonSchema } from './jsonSchema';
import { automationSchemas, parseAutomationRequest } from './protocol';
import { automationResultSchemas } from './results';

// Resolve schema references without interpreting defaults or enum data.
function expanded(schema: Record<string, unknown>, root = schema): unknown {
  if (typeof schema.$ref === 'string') {
    const target = schema.$ref
      .slice(2)
      .split('/')
      .reduce<unknown>(
        (node, key) => (node as Record<string, unknown>)[key],
        root,
      );
    expect(target).toBeDefined();
    return expanded(
      {
        ...(target as object),
        ...Object.fromEntries(
          Object.entries(schema).filter(([key]) => key !== '$ref'),
        ),
      },
      root,
    );
  }
  return Object.fromEntries(
    Object.entries(schema)
      .filter(([key]) => !['$defs', '$schema'].includes(key))
      .map(([key, value]) => {
        if (['properties', 'patternProperties'].includes(key)) {
          return [
            key,
            Object.fromEntries(
              Object.entries(value as object).map(([name, child]) => [
                name,
                expanded(child, root),
              ]),
            ),
          ];
        }
        if (['anyOf', 'oneOf', 'allOf'].includes(key)) {
          return [
            key,
            (value as Record<string, unknown>[]).map((child) =>
              expanded(child, root),
            ),
          ];
        }
        if (
          ['items', 'additionalProperties'].includes(key) &&
          typeof value === 'object' &&
          value !== null
        ) {
          return [key, expanded(value as Record<string, unknown>, root)];
        }
        return [key, value];
      }),
  );
}

describe('compact tool schemas', () => {
  it.each(['input', 'output'] as const)(
    'deduplicates equivalent %s constraints without rewriting default data',
    (io) => {
      const field = () =>
        z.enum([
          'a very long first choice'.repeat(8),
          'a very long second choice'.repeat(8),
        ]);
      const type = z.object({
        first: field(),
        second: field(),
        data: z
          .record(z.string(), z.string())
          .default({ description: 'literal', $ref: 'literal' }),
      });
      const compact = compactJsonSchema(type, io);
      expect(compact.$defs).toBeDefined();
      expect(expanded(compact)).toEqual(expanded(z.toJSONSchema(type, { io })));
      expect(JSON.stringify(compact)).toContain('"$ref":"literal"');
    },
  );

  it.each(['input', 'output'] as const)(
    'keeps more than 32 reused %s scalars visible without expanding references',
    (io) => {
      const id = z.string().min(1);
      const type = z.object(
        Object.fromEntries(
          Array.from({ length: 33 }, (_, index) => [`id${index}`, id]),
        ),
      );
      const input = compactJsonSchema(type, io);
      expect(input).not.toHaveProperty('$defs');
      expect(JSON.stringify(input)).not.toContain('"$ref"');
      expect(input).toEqual(z.toJSONSchema(type, { io }));
    },
  );

  it('keeps advertised transaction and discovery constraints equivalent with local references', () => {
    for (const schema of [
      automationSchemas.edit_elements,
      automationSchemas.get_element_catalog,
      automationResultSchemas.get_elements,
    ]) {
      expect(expanded(compactJsonSchema(schema))).toEqual(
        expanded(z.toJSONSchema(schema)),
      );
    }
  });

  it('allows documented minimal calls in published input schemas and retains output requirements', () => {
    const validator = new AjvJsonSchemaValidator();
    const input = compactJsonSchema(automationSchemas.edit_elements, 'input');
    const validate = validator.getValidator(input);
    for (const action of [
      { action: 'insert', elements: [{ elementType: 'Note' }] },
      {
        action: 'update',
        elementType: 'Note',
        elementRef: '00000000-0000-4000-8000-000000000001',
        properties: { lyrics: 'Al' },
      },
      { action: 'assign_lyrics', text: 'Al-le-lu' },
    ]) {
      const args = {
        documentId: 'test',
        expectedRevision: 0,
        actions: [action],
      };
      expect(validate(args)).toMatchObject({ valid: true });
      expect(() =>
        parseAutomationRequest({ tool: 'edit_elements', arguments: args }),
      ).not.toThrow();
    }
    expect(
      validator.getValidator(
        compactJsonSchema(automationSchemas.get_element_catalog, 'input'),
      )({}),
    ).toMatchObject({ valid: true });
    expect(
      validator.getValidator(
        compactJsonSchema(automationSchemas.get_element_catalog, 'output'),
      )({}),
    ).toMatchObject({ valid: false });
    expect(expanded(input)).toEqual(
      expanded(
        z.toJSONSchema(automationSchemas.edit_elements, { io: 'input' }),
      ),
    );
  });

  it('discovers property names without loading constraints', () => {
    const names = getElementCatalog({
      elementTypes: [ElementType.Note],
      view: 'names',
    });
    const note = names.elementTypes[0];
    expect(note.propertyNames).toEqual(
      Object.keys(
        getElementCatalog({ elementTypes: [ElementType.Note], view: 'read' })
          .elementTypes[0].properties!.properties as object,
      ),
    );
    expect(note).not.toHaveProperty('properties');
    expect(note).not.toHaveProperty('editProperties');
    expect(automationResultSchemas.get_element_catalog.parse(names)).toEqual(
      names,
    );
    const validator = new AjvJsonSchemaValidator();
    expect(
      validator.getValidator(
        compactJsonSchema(automationSchemas.get_element_catalog, 'input'),
      )({ elementTypes: [ElementType.Note], view: 'names' }),
    ).toMatchObject({ valid: true });
    expect(
      validator.getValidator(
        compactJsonSchema(automationResultSchemas.get_element_catalog),
      )(names),
    ).toMatchObject({ valid: true });
    expect(JSON.stringify(names).length).toBeLessThan(4000);
    expect(
      getElementCatalog({ view: 'names' }).elementTypes.every(
        (type) => type.propertyNames !== undefined,
      ),
    ).toBe(true);
    const filtered = getElementCatalog({
      elementTypes: [ElementType.Note],
      properties: ['lyrics', 'quantitativeNeume'],
      view: 'names',
      includeProperties: true,
    });
    expect(filtered.elementTypes[0].propertyNames).toEqual([
      'lyrics',
      'quantitativeNeume',
    ]);
    expect(filtered.elementTypes[0]).not.toHaveProperty('editProperties');
  });

  it('provides small inventory and focused read/edit schemas on demand', () => {
    const inventory = getElementCatalog();
    expect(inventory.elementTypes).toHaveLength(11);
    expect(
      inventory.elementTypes.every(
        (type) => !('properties' in type) && !('editProperties' in type),
      ),
    ).toBe(true);
    expect(inventory).not.toHaveProperty('neumes');
    expect(inventory.tempoBpmDefaults.Quick).toBe(168);
    expect(inventory.tempoBpmDefaults.QuickAbove).toBe(168);
    expect(inventory.tempoBpmDefaults.Moderate).toBe(100);
    const focused = getElementCatalog({
      elementTypes: [ElementType.Note],
      properties: ['lyrics', 'acceptsLyrics'],
      view: 'edit',
    });
    expect(focused.elementTypes).toHaveLength(1);
    expect(focused.elementTypes[0]).not.toHaveProperty('properties');
    expect(
      Object.keys(focused.elementTypes[0].editProperties!.properties as object),
    ).toEqual(['lyrics', 'acceptsLyrics']);
    const sizes = {
      input: JSON.stringify(
        compactJsonSchema(automationSchemas.edit_elements, 'input'),
      ).length,
      inventory: JSON.stringify(inventory).length,
      focused: JSON.stringify(focused).length,
      full: JSON.stringify(
        getElementCatalog({ includeProperties: true, includeNeumes: true }),
      ).length,
    };
    expect(sizes.input).toBeLessThan(12000);
    expect(sizes.inventory).toBeLessThan(2000);
    expect(sizes.focused).toBeLessThan(5000);
    console.info('MCP schema sizes (characters)', sizes);
  });

  it.each([
    { unknownProperty: true },
    { quantitativeNeume: 'not-a-neume' },
    { lyricsFontSize: -1 },
    { lyrics: null },
  ])(
    'retains type-specific validation for compact property envelopes: %j',
    (properties) => {
      for (const action of [
        { action: 'insert', elements: [{ elementType: 'Note', properties }] },
        {
          action: 'update',
          elementType: 'Note',
          elementRef: '00000000-0000-4000-8000-000000000001',
          properties,
        },
      ]) {
        expect(() =>
          parseAutomationRequest({
            tool: 'edit_elements',
            arguments: {
              documentId: 'test',
              expectedRevision: 0,
              actions: [action],
            },
          }),
        ).toThrow();
      }
    },
  );
});

describe('compound mark discovery', () => {
  it('exposes application component targets only on request', () => {
    expect(getElementCatalog()).not.toHaveProperty('neumeComponents');
    const catalog = getElementCatalog({ includeNeumeComponents: true });
    expect(automationResultSchemas.get_element_catalog.parse(catalog)).toEqual(
      catalog,
    );
    expect(catalog.neumeComponents).toMatchObject({
      OligonPlusApostrophosPlusKentemata: {
        primary: 'Kentemata',
        secondary: 'Apostrophos',
      },
      OligonPlusRunningElaphronPlusKentemata: {
        primary: 'Kentemata',
        secondary: 'Elaphron',
        tertiary: 'Apostrophos',
      },
    });
    expect(
      catalog.neumeComponents!.OligonPlusApostrophosPlusKentemata,
    ).not.toHaveProperty('tertiary');
    expect(catalog.neumeComponents).not.toHaveProperty('Oligon');
  });

  it.each(['read', 'edit'] as const)(
    'keeps component guidance in focused %s catalogs',
    (view) => {
      const catalog = getElementCatalog({
        elementTypes: [ElementType.Note],
        properties: [
          'secondaryFthora',
          'tertiaryAccidental',
          'secondaryGorgonNeume',
          'secondaryChromaticFthoraNote',
          'secondaryFthoraOffsetX',
        ],
        view,
      });
      const schema =
        catalog.elementTypes[0][
          view === 'read' ? 'properties' : 'editProperties'
        ]!;
      const fields = (
        expanded(schema) as {
          properties: Record<string, { description: string }>;
        }
      ).properties;
      for (const key of [
        'secondaryFthora',
        'tertiaryAccidental',
        'secondaryGorgonNeume',
        'secondaryChromaticFthoraNote',
      ]) {
        expect(fields[key].description).toContain(
          'includeNeumeComponents:true',
        );
      }
      expect(fields.secondaryFthoraOffsetX.description).toContain(
        'does not select a component',
      );
      if (view === 'edit') {
        expect(fields.secondaryFthora.description).toContain('UI default');
      }
    },
  );
});
