import metadataLegacy from '@/assets/fonts/neanes.metadata.json';
import metadata from '@/assets/fonts/neanesengraving.metadata.json';
import metadataRtlLegacy from '@/assets/fonts/neanesrtl.metadata.json';
import metadataRtl from '@/assets/fonts/neanesrtlengraving.metadata.json';
import metadataStathisLegacy from '@/assets/fonts/neanesstathisseries.metadata.json';
import metadataStathis from '@/assets/fonts/neanesstathisseriesengraving.metadata.json';
import type { SbmuflGlyphName } from '@/services/NeumeMappingService';

interface EngravingGlue {
  width: number;
  stretch: number;
  shrink: number;
}

interface EngravingDefaults {
  martyriaGlue: EngravingGlue;
  standardGlue: EngravingGlue;
  vareiaGap: number;
}

const metadataMap = new Map();
metadataMap.set('Neanes', metadata);
metadataMap.set('NeanesRTL', metadataRtl);
metadataMap.set('NeanesStathisSeries', metadataStathis);
metadataMap.set('NeanesLegacy', metadataLegacy);
metadataMap.set('NeanesRTLLegacy', metadataRtlLegacy);
metadataMap.set('NeanesStathisSeriesLegacy', metadataStathisLegacy);

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

  getEngravingDefaults(fontFamily: string): EngravingDefaults {
    return this.getMetadata(fontFamily).engravingDefaults;
  }

  getStandardGlue(fontFamily: string) {
    return this.getEngravingDefaults(fontFamily).standardGlue;
  }

  getMartyriaGlue(fontFamily: string) {
    return this.getEngravingDefaults(fontFamily).martyriaGlue;
  }

  getVareiaGap(fontFamily: string) {
    return this.getEngravingDefaults(fontFamily).vareiaGap;
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
