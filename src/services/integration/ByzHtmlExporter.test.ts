import { ByzHtmlExporter } from './ByzHtmlExporter';
import { NeumeMappingService, SbmuflGlyphName } from './../NeumeMappingService';
import glyphnames from '../../assets/fonts/sbmufl/glyphnames.json';

describe('ByzHtmlExporter', () => {
  it('should have a tag mapping for every glyphname', () => {
    const exporter = new ByzHtmlExporter();

    expect(
      Object.keys(glyphnames).every((x) => exporter.getTag(x) !== undefined),
    ).toBe(true);
  });
});
