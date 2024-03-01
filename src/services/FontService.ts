import metadata from '@/assets/fonts/neanes.metadata.json';
import metadataRtl from '@/assets/fonts/neanesrtl.metadata.json';
import { SbmuflGlyphName } from '@/services/NeumeMappingService';

const metadataMap = new Map();
metadataMap.set('Neanes', metadata);
metadataMap.set('NeanesRTL', metadataRtl);

class FontService {
  getMetadata(fontFamily: string) {
    return metadataMap.get(fontFamily);
  }

  getAdvanceWidth(fontFamily: string, glyph: SbmuflGlyphName) {
    return this.getMetadata(fontFamily).glyphAdvanceWidths[glyph];
  }

  getMarkOffset(
    fontFamily: string,
    base: SbmuflGlyphName,
    mark: SbmuflGlyphName,
  ) {
    const metadata = this.getMetadata(fontFamily);

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

  getMarkAnchorOffset(
    fontFamily: string,
    base: SbmuflGlyphName,
    mark: SbmuflGlyphName,
  ) {
    const metadata = this.getMetadata(fontFamily);
    const markAnchorName = Object.keys(
      (metadata.glyphsWithAnchors as any)[mark],
    ).find((x) => (metadata.glyphsWithAnchors as any)[base][x] != null);

    if (markAnchorName == null) {
      console.warn(`Missing anchor for base: ${base} mark: ${mark}`);
      return { x: 0, y: 0 };
    }

    const baseAnchor = (metadata.glyphsWithAnchors as any)[base][
      markAnchorName
    ] as number[];

    return {
      x: baseAnchor[0],
      y: metadata.metrics.winAscent - baseAnchor[1],
    };
  }
}

const fontService = new FontService();

export { fontService };
