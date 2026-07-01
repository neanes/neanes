import { describe, expect, it, vi } from 'vitest';

import {
  RichTextBoxElement,
  TextBoxAlignment,
  TextBoxElement,
} from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { ParagraphStyle } from '@/models/ParagraphStyle';
import { setRichTextLanguage } from '@/utils/richTextLanguage';
import { Unit } from '@/utils/Unit';

import glyphnames from '../../assets/fonts/sbmufl/glyphnames.json';
import type { SbmuflGlyphName } from './../NeumeMappingService';
import { ByzHtmlExporter } from './ByzHtmlExporter';

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

  it('exports rich text paragraph styles in the ByzHTML stylesheet', () => {
    const exporter = new ByzHtmlExporter();
    const pageSetup = new PageSetup();
    const style = new ParagraphStyle();

    vi.spyOn(
      exporter as ByzHtmlExporter,
      'getDropCapAdjustment',
    ).mockReturnValue(0);

    style.id = 'custom-style';
    style.overrides = {
      fontFamily: 'Alegreya',
      fontSize: 16,
      fontStyle: 'Bold Italic',
      color: '#abcdef',
      strokeWidth: 1.5,
      lineHeight: 1.4,
      textDecoration: 'underline',
    };

    const css = exporter.exportPageSetup(pageSetup, [style]);

    expect(css).toContain(
      '.byz---rich-text-box p.neanes-style-custom-style{font-family:',
    );
    expect(css).toContain('font-weight:700;font-style:italic;font-size:16px;');
    expect(css).toContain(
      'color:#abcdef;-webkit-text-stroke-width:1.5px;text-decoration:underline;line-height:1.4;',
    );
  });

  it('exports underlined paragraph-style text boxes with text decoration', () => {
    const exporter = new ByzHtmlExporter();
    const element = new TextBoxElement();

    vi.spyOn(
      exporter as ByzHtmlExporter,
      'getDropCapAdjustment',
    ).mockReturnValue(0);

    element.content = 'Styled text';
    element.paragraphStyleId = 'custom-style';
    element.computedAlignment = TextBoxAlignment.Left;
    element.computedColor = '#000000';
    element.computedFontFamily = 'Source Serif';
    element.computedFontSize = Unit.fromPt(12);
    element.computedFontWeight = '400';
    element.computedFontStyle = 'normal';
    element.computedStrokeWidth = 0;
    element.computedLineHeight = null;

    const customStyle = new ParagraphStyle();
    customStyle.id = 'custom-style';
    customStyle.overrides.textDecoration = 'underline';

    const html = exporter.exportTextBox(
      element,
      new PageSetup(),
      [customStyle],
      0,
    );
    const css = exporter.exportPageSetup(new PageSetup(), [customStyle]);

    expect(css).toContain('text-decoration:underline;');
    expect(html).toContain('text-decoration: underline;');
  });

  it('exports explicit text-box underline clears as none', () => {
    const exporter = new ByzHtmlExporter();
    const element = new TextBoxElement();
    const style = new ParagraphStyle();

    vi.spyOn(
      exporter as ByzHtmlExporter,
      'getDropCapAdjustment',
    ).mockReturnValue(0);

    style.id = 'custom-style';
    style.overrides.textDecoration = 'underline';

    element.content = 'Styled text';
    element.paragraphStyleId = 'custom-style';
    element.underline = false;
    element.computedAlignment = TextBoxAlignment.Left;
    element.computedColor = '#000000';
    element.computedFontFamily = 'Source Serif';
    element.computedFontSize = Unit.fromPt(12);
    element.computedFontWeight = '400';
    element.computedFontStyle = 'normal';
    element.computedStrokeWidth = 0;
    element.computedLineHeight = null;

    expect(
      exporter.exportTextBox(element, new PageSetup(), [style], 0),
    ).toContain('text-decoration: none;');
  });

  it('keeps inherited inline text boxes on the shared inline CSS defaults', () => {
    const exporter = new ByzHtmlExporter();
    const element = new TextBoxElement();

    element.inline = true;
    element.content = 'Inline text';
    element.computedAlignment = TextBoxAlignment.Center;
    element.computedColor = '#123456';
    element.computedFontFamily = 'Alegreya';
    element.computedFontSize = Unit.fromPt(18);
    element.computedFontWeight = '700';
    element.computedFontStyle = 'italic';
    element.computedStrokeWidth = 2;
    element.computedLineHeight = 1.4;

    expect(exporter.exportTextBox(element, new PageSetup(), [], 0)).toBe(
      `<div dir="auto" class="byz--text-box byz--text-box-inline" style="color: #123456;font-family: 'Alegreya', 'Source Serif';font-size: 18pt;font-weight: 700;font-style: italic;line-height: 1.4;-webkit-text-stroke-width: 2;text-align: center;">Inline text</div
>`,
    );
  });

  it('exports computed styles for inline text boxes with explicit paragraph-style overrides', () => {
    const exporter = new ByzHtmlExporter();
    const element = new TextBoxElement();

    element.inline = true;
    element.content = 'Inline override';
    element.fontSize = Unit.fromPt(16);
    element.color = '#abcdef';
    element.fontFamily = 'Alegreya';
    element.fontStyle = 'Bold Italic';
    element.strokeWidth = 1.5;
    element.computedAlignment = TextBoxAlignment.Right;
    element.computedColor = '#123456';
    element.computedFontFamily = 'Alegreya';
    element.computedFontSize = Unit.fromPt(18);
    element.computedFontWeight = '700';
    element.computedFontStyle = 'italic';
    element.computedStrokeWidth = 2;
    element.computedLineHeight = 1.4;

    expect(exporter.exportTextBox(element, new PageSetup(), [], 0)).toBe(
      `<div dir="auto" class="byz--text-box byz--text-box-inline" style="color: #123456;font-family: 'Alegreya', 'Source Serif';font-size: 18pt;font-weight: 700;font-style: italic;line-height: 1.4;-webkit-text-stroke-width: 2;text-align: right;">Inline override</div\n>`,
    );
  });
});
