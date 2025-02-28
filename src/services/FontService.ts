import metadata from '@/assets/fonts/neanes.metadata.json';
import metadataRtl from '@/assets/fonts/neanesrtl.metadata.json';
import metadataStathis from '@/assets/fonts/neanesstathisseries.metadata.json';
import { SbmuflGlyphName } from '@/services/NeumeMappingService';

const metadataMap = new Map();
metadataMap.set('Neanes', metadata);
metadataMap.set('NeanesRTL', metadataRtl);
metadataMap.set('NeanesStathisSeries', metadataStathis);

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

    const markAnchorName = Object.keys(metadata.glyphsWithAnchors[mark]).find(
      (x) => metadata.glyphsWithAnchors[base][x] != null,
    );

    if (markAnchorName == null) {
      console.warn(`Missing anchor for base: ${base} mark: ${mark}`);
      return { x: 0, y: 0 };
    }

    const markAnchor = metadata.glyphsWithAnchors[mark][
      markAnchorName
    ] as number[];

    const baseAnchor = metadata.glyphsWithAnchors[base][
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
    const markAnchorName = Object.keys(metadata.glyphsWithAnchors[mark]).find(
      (x) => metadata.glyphsWithAnchors[base][x] != null,
    );

    if (markAnchorName == null) {
      console.warn(`Missing anchor for base: ${base} mark: ${mark}`);
      return { x: 0, y: 0 };
    }

    const baseAnchor = metadata.glyphsWithAnchors[base][
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
