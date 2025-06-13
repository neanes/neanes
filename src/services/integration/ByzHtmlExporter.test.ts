import { describe, expect, it } from 'vitest';

import glyphnames from '../../assets/fonts/sbmufl/glyphnames.json';
import { SbmuflGlyphName } from './../NeumeMappingService';
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
        .filter((x) => !exceptions.includes(x))
        .every((x) => exporter.getTag(x as SbmuflGlyphName) !== undefined),
    ).toBe(true);
  });
});
