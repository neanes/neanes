import metadata from '@/assets/fonts/neanes.metadata.json';
import { SbmuflGlyphName } from '@/services/NeumeMappingService';

class FontService {
  getAdvanceWidth(glyph: SbmuflGlyphName) {
    return metadata.glyphAdvanceWidths[glyph];
  }

  getMarkOffset(base: SbmuflGlyphName, mark: SbmuflGlyphName) {
    const markAnchorName = Object.keys(
      (metadata.glyphsWithAnchors as any)[mark],
    )[0];

    const markAnchor = (metadata.glyphsWithAnchors as any)[mark][
      markAnchorName
    ] as number[];

    const baseAnchor = (metadata.glyphsWithAnchors as any)[base][
      markAnchorName
    ] as number[];

    if (baseAnchor == null) {
      console.warn(`Missing base anchor for base: ${base} mark: ${mark}`);
      return { x: 0, y: 0 };
    }

    return {
      x: baseAnchor[0] - markAnchor[0],
      y: -(baseAnchor[1] - markAnchor[1]),
    };
  }
}

const fontService = new FontService();

export { fontService };
