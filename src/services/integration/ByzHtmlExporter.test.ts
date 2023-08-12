import glyphnames from '../../assets/fonts/sbmufl/glyphnames.json';
import { SbmuflGlyphName } from './../NeumeMappingService';
import { ByzHtmlExporter } from './ByzHtmlExporter';

describe('ByzHtmlExporter', () => {
  it('should have a tag mapping for every glyphname', () => {
    const exporter = new ByzHtmlExporter();

    expect(
      Object.keys(glyphnames).every(
        (x) => exporter.getTag(x as SbmuflGlyphName) !== undefined,
      ),
    ).toBe(true);
  });
});
