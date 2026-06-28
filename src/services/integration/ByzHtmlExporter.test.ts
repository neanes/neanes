import { describe, expect, it } from 'vitest';

import {
  RichTextBoxElement,
  TextBoxAlignment,
  TextBoxElement,
} from '@/models/Element';
import { Unit } from '@/utils/Unit';
import { setRichTextLanguage } from '@/utils/richTextLanguage';

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

    expect(exporter.exportTextBox(element, 0)).toBe(
      '<div dir="auto" class="byz--text-box byz--text-box-inline" style="text-align: center;">Inline text</div\n>',
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

    expect(exporter.exportTextBox(element, 0)).toBe(
      `<div dir="auto" class="byz--text-box byz--text-box-inline" style="color: #123456;font-family: 'Alegreya', 'Source Serif';font-size: 18pt;font-weight: 700;font-style: italic;line-height: 1.4;-webkit-text-stroke-width: 2;text-align: right;">Inline override</div\n>`,
    );
  });
});
