import { describe, expect, it } from 'vitest';

import {
  RichTextBoxElement,
  TextBoxAlignment,
  TextBoxElement,
} from '@/models/Element';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  ParagraphStyle,
} from '@/models/ParagraphStyle';
import { fontCatalog } from '@/services/FontCatalog';
import { setRichTextLanguage } from '@/utils/richTextLanguage';
import { Unit } from '@/utils/Unit';

import glyphnames from '../../assets/fonts/sbmufl/glyphnames.json';
import type { SbmuflGlyphName } from './../NeumeMappingService';
import { ByzHtmlExporter, createByzHtmlDocument } from './ByzHtmlExporter';

function createComputedTextBox(overrides: Partial<TextBoxElement> = {}) {
  const element = new TextBoxElement();

  element.computedAlignment = TextBoxAlignment.Left;
  element.computedColor = '#000000';
  element.computedFontFamily = 'Source Serif';
  element.computedFontSize = Unit.fromPt(12);
  element.computedFontWeight = '400';
  element.computedFontStyle = 'normal';
  element.computedStrokeWidth = 0;
  element.computedLineHeight = null;

  return Object.assign(element, overrides);
}

describe('ByzHtmlExporter', () => {
  it('should have a tag mapping for every glyphname', () => {
    const exporter = new ByzHtmlExporter();

    const exceptions: SbmuflGlyphName[] = [
      'fthoraDiatonicNiLow',
      'fthoraDiatonicPa',
      'fthoraDiatonicVou',
      'fthoraDiatonicGa',
      'fthoraDiatonicDi',
      'fthoraDiatonicKe',
      'fthoraDiatonicZo',
      'fthoraDiatonicNiHigh',
      'fthoraHardChromaticPa',
      'fthoraHardChromaticDi',
      'fthoraSoftChromaticDi',
      'fthoraSoftChromaticKe',
      'fthoraEnharmonic',
      'chroaZygos',
      'chroaKliton',
      'chroaSpathi',
    ];

    expect(
      Object.keys(glyphnames)
        .filter((x) => !exceptions.includes(x as SbmuflGlyphName))
        .every((x) => exporter.getTag(x as SbmuflGlyphName) !== undefined),
    ).toBe(true);
  });

  it('exports rich text box language from element metadata', () => {
    const exporter = new ByzHtmlExporter();
    const element = new RichTextBoxElement();

    element.content = '<p><span lang="ar" dir="rtl">Hello</span></p>';
    setRichTextLanguage(element, 'ar', 'rtl');

    expect(exporter.exportRichTextBox(element, 0)).toBe(
      '<div class="byz---rich-text-box" lang="ar" dir="rtl"><p><span lang="ar" dir="rtl">Hello</span></p></div\n>',
    );
  });

  it('exports paragraph-style text boxes with inline underline text decoration', () => {
    const exporter = new ByzHtmlExporter();
    const element = createComputedTextBox({
      content: 'Styled text',
      paragraphStyleId: 'custom-style',
    });

    const customStyle = new ParagraphStyle();
    customStyle.id = 'custom-style';
    customStyle.overrides.textDecoration = 'underline';

    expect(exporter.exportTextBox(element, [customStyle], 0)).toContain(
      'text-decoration: underline;',
    );
  });

  it('exports explicit underline clears against an underlined default as none', () => {
    const exporter = new ByzHtmlExporter();
    const style = new ParagraphStyle();

    style.id = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
    style.overrides.textDecoration = 'underline';

    const element = createComputedTextBox({
      content: 'Styled text',
      underline: false,
    });

    expect(exporter.exportTextBox(element, [style], 0)).toContain(
      'text-decoration: none;',
    );
  });

  it('keeps inherited inline text boxes on the shared inline CSS defaults', () => {
    const exporter = new ByzHtmlExporter();
    const element = new TextBoxElement();

    element.inline = true;
    element.content = 'Inline text';
    element.paragraphStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics;
    element.computedAlignment = TextBoxAlignment.Center;

    expect(exporter.exportTextBox(element, [], 0)).toBe(
      `<div dir="auto" class="byz--text-box byz--text-box-inline" style="text-align: center;">Inline text</div
>`,
    );
  });

  it('exports computed styles for inline text boxes with explicit paragraph-style overrides', () => {
    const exporter = new ByzHtmlExporter();
    const element = createComputedTextBox({
      inline: true,
      content: 'Inline override',
      fontSize: Unit.fromPt(16),
      color: '#abcdef',
      fontFamily: 'Alegreya',
      fontStyle: 'Bold Italic',
      strokeWidth: 1.5,
      computedAlignment: TextBoxAlignment.Right,
      computedColor: '#123456',
      computedFontFamily: 'Alegreya',
      computedFontSize: Unit.fromPt(18),
      computedFontWeight: '700',
      computedFontStyle: 'italic',
      computedStrokeWidth: 2,
      computedLineHeight: 1.4,
    });

    expect(exporter.exportTextBox(element, [], 0)).toBe(
      `<div dir="auto" class="byz--text-box byz--text-box-inline" style="color: #123456;font-family: 'Alegreya', 'Source Serif';font-size: 18pt;font-weight: 700;font-style: italic;font-variant-caps: normal;font-variant-numeric: normal;font-variant-ligatures: normal;font-variant-alternates: normal;line-height: 1.4;-webkit-text-stroke-width: 2;-webkit-text-stroke-color: currentcolor;text-align: right;">Inline override</div\n>`,
    );
  });

  it('exports all registered exact faces and alternate mappings', () => {
    const registeredFamily = 'Previously Registered Export Family';
    const registeredFace = fontCatalog.resolveFace(registeredFamily, 'Caption');
    const unregisteredFamily = 'Unregistered Regular Export Family';

    fontCatalog.resolveFace(unregisteredFamily, 'Regular');

    const html = createByzHtmlDocument(
      "body { font-family: 'Source Serif'; }",
      '<p>Text</p>',
      false,
    );

    expect(html).toContain(
      `@font-face { font-family: "${registeredFace.cssFamily}"`,
    );
    expect(html).toMatch(
      new RegExp(`@font-feature-values [^{]*"${registeredFace.cssFamily}"`),
    );
    expect(html).not.toContain(unregisteredFamily);
  });
});
