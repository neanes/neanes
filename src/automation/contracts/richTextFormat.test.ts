import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { DomUtils, parseDocument } from 'htmlparser2';
import { describe, expect, it } from 'vitest';

import { ElementType } from '@/models/Element';
import { BUILT_IN_PARAGRAPH_STYLE_IDS } from '@/models/ParagraphStyle';
import { richTextParagraphStyleIdFromClassName } from '@/utils/richTextParagraphStyleClasses';

import { automationTools } from '../../../electron/main/automation/tools';
import { getElementCatalog } from './elementSchemas';
import { parseAutomationRequest } from './protocol';
import { automationOutputSchema } from './results';
import { getRichTextFormat } from './richTextFormat';
import { canRunWhileEditorBusy } from './toolBehavior';

describe('rich-text authoring discovery', () => {
  it('publishes a bounded guide without requiring a document or session', () => {
    const tool = automationTools().find(
      (item) => item.name === 'get_rich_text_format',
    )!;
    expect(parseAutomationRequest({ tool: tool.name, arguments: {} })).toEqual({
      tool: tool.name,
      arguments: {},
    });
    expect(canRunWhileEditorBusy('get_rich_text_format')).toBe(true);
    expect(tool.annotations?.readOnlyHint).toBe(true);
    expect(JSON.stringify(tool).length).toBeLessThan(2500);
    const result = getRichTextFormat();
    expect(JSON.stringify(result).length).toBeLessThan(5000);
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
    const examples = getRichTextFormat()
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
