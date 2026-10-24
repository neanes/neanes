import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { DomUtils, parseDocument } from 'htmlparser2';
import { describe, expect, it } from 'vitest';

import { automationOutputSchema } from '@/automation/__tests__/helpers';
import { ElementType } from '@/models/Element';
import { BUILT_IN_PARAGRAPH_STYLE_IDS } from '@/models/ParagraphStyle';
import { fontCatalog } from '@/services/FontCatalog';
import { applyLegacyStyle } from '@/utils/fontStyle';
import {
  normalizeAlternatesStyle,
  normalizeLigatureStyle,
  normalizeNumericStyle,
  parseFontVariantCaps,
} from '@/utils/fontVariants';
import { richTextParagraphStyleIdFromClassName } from '@/utils/richTextParagraphStyleClasses';

import { automationTools } from '../../../electron/main/automation/tools';
import { getElementCatalog } from './elementSchemas';
import { parseAutomationRequest } from './protocol';
import { getRichTextFormat } from './richTextFormat';
import { canRunWhileEditorBusy } from './toolBehavior';

describe('rich-text authoring discovery', () => {
  it('publishes a bounded guide without requiring a document or session', () => {
    const tool = automationTools().find(
      (item) => item.name === 'get_rich_text_format',
    )!;
    expect(parseAutomationRequest({ tool: tool.name, arguments: {} })).toEqual({
      tool: tool.name,
      arguments: { topics: ['basics', 'inline'] },
    });
    expect(canRunWhileEditorBusy('get_rich_text_format')).toBe(true);
    expect(tool.annotations?.readOnlyHint).toBe(true);
    expect(JSON.stringify(tool).length).toBeLessThan(2500);
    const result = getRichTextFormat();
    expect(JSON.stringify(result).length).toBeLessThan(6500);
    const outcome = { success: true, result };
    expect(
      automationOutputSchema('get_rich_text_format').parse(outcome),
    ).toEqual(outcome);
    const validator = new AjvJsonSchemaValidator();
    expect(validator.getValidator(tool.inputSchema)({})).toMatchObject({
      valid: true,
    });
    expect(validator.getValidator(tool.outputSchema!)(outcome)).toMatchObject({
      valid: true,
    });
  });

  it('provides valid edit calls whose paragraphs use existing style IDs', () => {
    const examples = getRichTextFormat({ topics: ['basics'] })
      .guide.split('\n')
      .filter((line) => line.startsWith('{'));
    expect(examples).toHaveLength(2);
    for (const example of examples) {
      const request = parseAutomationRequest(
        JSON.parse(
          example.replaceAll(
            'NOTE_REF',
            '00000000-0000-4000-8000-000000000001',
          ),
        ),
      );
      expect(request.tool).toBe('edit_elements');
      if (request.tool !== 'edit_elements') {
        throw new Error('Expected edit');
      }
      const action = request.arguments.actions[0];
      if (action.action !== 'insert') {
        throw new Error('Expected insertion');
      }
      const element = action.elements[0];
      const html = element.properties?.content ?? element.properties?.text;
      expect(typeof html).toBe('string');
      const document = parseDocument(html as string);
      const paragraphs = DomUtils.findAll(
        (node) => node.name === 'p',
        document.children,
      );
      expect(paragraphs).toHaveLength(1);
      const styleId = richTextParagraphStyleIdFromClassName(
        paragraphs[0].attribs.class,
      );
      expect(Object.values(BUILT_IN_PARAGRAPH_STYLE_IDS)).toContain(styleId);
      expect(styleId).toBe(
        element.elementType === 'Annotation' ? 'annotation' : 'default-text',
      );
      if (element.elementType === 'RichTextBox') {
        expect(DomUtils.textContent(document)).toBe('Hello & welcome');
      } else {
        expect(action.collection).toMatchObject({
          kind: 'children',
          collection: 'annotations',
        });
      }
    }
  });

  it('returns focused inline help and a valid full-field update example', () => {
    const { guide } = getRichTextFormat({ topics: ['inline'] });
    expect(guide.length).toBeLessThan(3500);
    expect(guide).not.toContain('BASICS');
    expect(guide).not.toContain('OPENTYPE INLINE OVERRIDES');
    const example = guide.split('\n').find((line) => line.startsWith('{'))!;
    const request = parseAutomationRequest(
      JSON.parse(
        example.replaceAll(
          'ELEMENT_REF',
          '00000000-0000-4000-8000-000000000001',
        ),
      ),
    );
    if (request.tool !== 'edit_elements') {
      throw new Error('Expected edit');
    }
    const action = request.arguments.actions[0];
    if (action.action !== 'update') {
      throw new Error('Expected update');
    }
    const document = parseDocument(action.properties!.content as string);
    expect(DomUtils.textContent(document)).toBe('Sing softly here.');
    const spans = DomUtils.findAll(
      (node) => node.name === 'span',
      document.children,
    );
    expect(spans).toHaveLength(1);
    expect(DomUtils.textContent(spans[0])).toBe('softly');
    expect(spans[0].attribs.style).toBe(
      "color:#c00000;font-size:18pt;font-family:'Source Serif';font-weight:700;font-style:italic;font-variant-caps:small-caps;",
    );
    const paragraphs = DomUtils.findAll(
      (node) => node.name === 'p',
      document.children,
    );
    expect(paragraphs[0].attribs.class).toBe(
      'neanes-paragraph-style-default-text',
    );
  });

  it.each([
    ['700', 'Bold'],
    ['400', 'Regular'],
  ])(
    'resets face aliases before applying weight %s and upright slant',
    (weight, expected) => {
      const { guide } = getRichTextFormat({ topics: ['inline'] });
      expect(guide).toContain(
        'replace stale face aliases with the base family',
      );
      expect(guide).toContain(
        "'Source Serif Bold Italic' -> font-family:'Source Serif';font-weight:700;font-style:normal",
      );
      const stale = fontCatalog.splitFace('Source Serif Bold Italic');
      const styles = fontCatalog.getStyles(stale.family);
      expect(
        applyLegacyStyle(stale.style, { weight, italic: false }, styles),
      ).toBe('Bold Italic');
      const base = fontCatalog.splitFace(stale.family);
      expect(
        applyLegacyStyle(base.style, { weight, italic: false }, styles),
      ).toBe(expected);
    },
  );

  it('documents OpenType examples that survive the real property normalizers', () => {
    const { guide } = getRichTextFormat({ topics: ['opentype'] });
    expect(guide.length).toBeLessThan(4000);
    expect(guide).not.toContain('INLINE OVERRIDES\nFor one word');
    expect(guide).not.toContain('BASICS');
    const document = parseDocument(
      guide
        .split('\n')
        .filter((line) => line.startsWith('<p '))
        .join(''),
    );
    const spans = DomUtils.findAll(
      (node) => node.name === 'span',
      document.children,
    );
    expect(spans).toHaveLength(2);
    const normalizers = {
      'font-variant-caps': parseFontVariantCaps,
      'font-variant-numeric': normalizeNumericStyle,
      'font-variant-ligatures': normalizeLigatureStyle,
      'font-variant-alternates': normalizeAlternatesStyle,
    };
    for (const span of spans) {
      for (const declaration of span.attribs.style.split(';').filter(Boolean)) {
        const [property, value] = declaration.split(':');
        expect(normalizers[property as keyof typeof normalizers](value)).toBe(
          value,
        );
      }
    }
    for (const normalize of Object.values(normalizers)) {
      expect(normalize('normal')).toBe('normal');
    }
    expect(normalizeLigatureStyle('none')).toBe(
      'no-common-ligatures no-contextual',
    );
    expect(guide).toContain('Each longhand replaces its whole value');
    expect(guide).toContain('normal explicitly');
  });

  it('validates topics at the published and runtime boundaries', () => {
    const tool = automationTools().find(
      (item) => item.name === 'get_rich_text_format',
    )!;
    const validate = new AjvJsonSchemaValidator().getValidator(
      tool.inputSchema,
    );
    for (const topics of [
      ['inline'],
      ['opentype'],
      ['basics', 'inline', 'opentype'],
    ]) {
      expect(validate({ topics })).toMatchObject({ valid: true });
      expect(() =>
        parseAutomationRequest({ tool: tool.name, arguments: { topics } }),
      ).not.toThrow();
    }
    for (const topics of [
      [],
      ['unknown'],
      ['basics', 'basics', 'basics', 'basics'],
    ]) {
      expect(validate({ topics })).toMatchObject({ valid: false });
      expect(() =>
        parseAutomationRequest({ tool: tool.name, arguments: { topics } }),
      ).toThrow();
    }
    const all = getRichTextFormat({ topics: ['basics', 'inline', 'opentype'] });
    expect(all.guide.length).toBeLessThan(9500);
    expect(getRichTextFormat({ topics: ['inline', 'inline'] })).toEqual(
      getRichTextFormat({ topics: ['inline'] }),
    );
  });

  it.each(['read', 'edit'] as const)(
    'retains HTML and plain-text guidance in focused %s catalogs',
    (view) => {
      const catalog = getElementCatalog({
        elementTypes: [
          ElementType.RichTextBox,
          ElementType.Annotation,
          ElementType.TextBox,
        ],
        properties: ['content', 'text'],
        view,
      });
      for (const entry of catalog.elementTypes) {
        const schema = JSON.stringify(
          view === 'read' ? entry.properties : entry.editProperties,
        );
        expect(schema).toContain(
          entry.elementType === 'TextBox' ? 'Plain text' : 'CKEditor HTML',
        );
        if (entry.elementType !== 'TextBox') {
          expect(schema).toContain('neanes-paragraph-style-');
          expect(schema).toContain('get_rich_text_format');
        }
      }
    },
  );
});
