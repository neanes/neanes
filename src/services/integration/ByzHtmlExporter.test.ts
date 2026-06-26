import { describe, expect, it } from 'vitest';

import { RichTextBoxElement } from '@/models/Element';
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
});
