import metadata from '@/assets/fonts/neanes.metadata.json';
import metadataRtl from '@/assets/fonts/neanesrtl.metadata.json';
import metadataStathis from '@/assets/fonts/neanesstathisseries.metadata.json';
import type { SbmuflGlyphName } from '@/services/NeumeMappingService';

const metadataMap = new Map();
metadataMap.set('Neanes', metadata);
metadataMap.set('NeanesRTL', metadataRtl);
metadataMap.set('NeanesStathisSeries', metadataStathis);

class FontService {
  getMetadata(fontFamily: string) {
    return metadataMap.get(fontFamily);
  }

  getMetrics(fontFamily: string) {
    return this.getMetadata(fontFamily).metrics;
  }

  getAdvanceWidth(fontFamily: string, glyph: SbmuflGlyphName) {
    return this.getMetadata(fontFamily).glyphAdvanceWidths[glyph];
  }

  getLeadingSpace(fontFamily: string, glyph: SbmuflGlyphName) {
    return this.getGlyphSpacing(fontFamily, glyph).leading;
  }

  getTrailingSpace(fontFamily: string, glyph: SbmuflGlyphName) {
    return this.getGlyphSpacing(fontFamily, glyph).trailing;
  }

  private getGlyphSpacing(fontFamily: string, glyph: SbmuflGlyphName) {
    const metadata = this.getMetadata(fontFamily);
    const spacing = metadata.glyphSpacing?.[glyph];

    if (spacing == null) {
      console.warn(
        `Missing glyph spacing for font: ${fontFamily} glyph: ${glyph}`,
      );
      return { leading: 0, trailing: 0 };
    }

    return spacing;
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
