import metadata from '@/assets/fonts/neanes.metadata.json';
import { SbmuflGlyphName } from '@/services/NeumeMappingService';

class FontService {
  getAdvanceWidth(glyph: SbmuflGlyphName) {
    return metadata.glyphAdvanceWidths[glyph];
  }

  getMarkOffset(base: SbmuflGlyphName, mark: SbmuflGlyphName) {
    const markAnchorName = Object.keys(
      (metadata.glyphsWithAnchors as any)[mark],
    ).find((x) => (metadata.glyphsWithAnchors as any)[base][x] != null);

    if (markAnchorName == null) {
      console.warn(`Missing anchor for base: ${base} mark: ${mark}`);
      return { x: 0, y: 0 };
    }

    const markAnchor = (metadata.glyphsWithAnchors as any)[mark][
      markAnchorName
    ] as number[];

    const baseAnchor = (metadata.glyphsWithAnchors as any)[base][
      markAnchorName
    ] as number[];

    return {
      x: baseAnchor[0] - markAnchor[0],
      y: -(baseAnchor[1] - markAnchor[1]),
    };
  }
}

const fontService = new FontService();

export { fontService };
