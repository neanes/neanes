import metadataLegacy from '@/assets/fonts/neanes.metadata.json';
import metadata from '@/assets/fonts/neanesengraving.metadata.json';
import metadataRtlLegacy from '@/assets/fonts/neanesrtl.metadata.json';
import metadataRtl from '@/assets/fonts/neanesrtlengraving.metadata.json';
import metadataStathisLegacy from '@/assets/fonts/neanesstathisseries.metadata.json';
import metadataStathis from '@/assets/fonts/neanesstathisseriesengraving.metadata.json';
import type { SbmuflGlyphName } from '@/services/NeumeMappingService';

interface Metrics {
  ascent: number;
  descent: number;
  winAscent: number;
  winDescent: number;
  oligonMidpoint: number;
  elafronBounds: Partial<Record<SbmuflGlyphName, HorizontalBounds>>;
}

interface HorizontalBounds {
  left: number;
  right: number;
}

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

interface GlyphBBox {
  bBoxNE: [number, number];
  bBoxSW: [number, number];
}

interface CollisionRegion extends GlyphBBox {
  name: string;
}

interface ContextualSubstitution {
  inputGlyphs: SbmuflGlyphName[][];
  backtrackGlyphs: SbmuflGlyphName[][];
  lookaheadGlyphs: SbmuflGlyphName[][];
  markAttachmentClass?: string;
  substitutions: Array<{
    index: number;
    from: SbmuflGlyphName;
    to: SbmuflGlyphName;
  }>;
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
    return this.getMetadata(fontFamily).metrics as Metrics;
  }

  getLyricsHorizontalOffset(
    fontFamily: string,
    glyph: SbmuflGlyphName,
  ): number {
    const { left, right } = this.getElafronBounds(fontFamily, glyph);
    return left + right - this.getAdvanceWidth(fontFamily, glyph);
  }

  getElafronBounds(
    fontFamily: string,
    glyph: SbmuflGlyphName,
  ): HorizontalBounds {
    const bounds = this.getMetrics(fontFamily).elafronBounds[glyph];

    if (bounds == null) {
      throw new Error(`Missing elafron bounds for ${glyph}`);
    }

    return bounds;
  }

  getAdvanceWidth(fontFamily: string, glyph: SbmuflGlyphName) {
    return this.getMetadata(fontFamily).glyphAdvanceWidths[glyph];
  }

  getGlyphBBox(fontFamily: string, glyph: SbmuflGlyphName): GlyphBBox {
    return this.getMetadata(fontFamily).glyphBBoxes[glyph];
  }

  getGlyphCollisionRegions(
    fontFamily: string,
    glyph: SbmuflGlyphName,
  ): CollisionRegion[] {
    return this.getMetadata(fontFamily).collisionRegions?.[glyph] ?? [];
  }

  getContextualSubstitutions(fontFamily: string): ContextualSubstitution[] {
    return this.getMetadata(fontFamily).contextualSubstitutions ?? [];
  }

  resolveContextualSubstitutions(
    fontFamily: string,
    glyphs: SbmuflGlyphName[],
  ) {
    const resolvedGlyphs = [...glyphs];
    const markAttachmentClasses = this.getMetadata(fontFamily)
      .markAttachmentClasses as Record<string, SbmuflGlyphName[]> | undefined;

    for (const rule of this.getContextualSubstitutions(fontFamily)) {
      const markAttachmentGlyphs =
        rule.markAttachmentClass != null
          ? markAttachmentClasses?.[rule.markAttachmentClass]
          : undefined;

      for (
        let inputStart = 0;
        inputStart <= resolvedGlyphs.length - rule.inputGlyphs.length;
        inputStart++
      ) {
        const inputIndexes = this.contextualSubstitutionMatchIndexes(
          fontFamily,
          rule,
          resolvedGlyphs,
          inputStart,
          markAttachmentGlyphs,
        );

        if (inputIndexes == null) {
          continue;
        }

        for (const substitution of rule.substitutions) {
          const glyphIndex = inputIndexes[substitution.index];
          if (resolvedGlyphs[glyphIndex] === substitution.from) {
            resolvedGlyphs[glyphIndex] = substitution.to;
          }
        }
      }
    }

    return resolvedGlyphs;
  }

  private contextualSubstitutionMatchIndexes(
    fontFamily: string,
    rule: ContextualSubstitution,
    glyphs: SbmuflGlyphName[],
    inputStart: number,
    markAttachmentGlyphs: SbmuflGlyphName[] | undefined,
  ) {
    const inputIndexes = this.glyphClassesMatch(
      fontFamily,
      markAttachmentGlyphs,
      rule.inputGlyphs,
      glyphs,
      inputStart,
      1,
    );

    if (inputIndexes == null || inputIndexes[0] !== inputStart) {
      return null;
    }

    const backtrackIndexes = this.glyphClassesMatch(
      fontFamily,
      markAttachmentGlyphs,
      [...rule.backtrackGlyphs].reverse(),
      glyphs,
      inputStart - 1,
      -1,
    );
    const lookaheadIndexes = this.glyphClassesMatch(
      fontFamily,
      markAttachmentGlyphs,
      rule.lookaheadGlyphs,
      glyphs,
      inputIndexes.at(-1)! + 1,
      1,
    );

    return backtrackIndexes != null && lookaheadIndexes != null
      ? inputIndexes
      : null;
  }

  private glyphClassesMatch(
    fontFamily: string,
    markAttachmentGlyphs: SbmuflGlyphName[] | undefined,
    glyphClasses: SbmuflGlyphName[][],
    glyphs: SbmuflGlyphName[],
    start: number,
    direction: 1 | -1,
  ) {
    const indexes: number[] = [];
    let glyphIndex = start;

    for (const glyphClass of glyphClasses) {
      while (
        glyphIndex >= 0 &&
        glyphIndex < glyphs.length &&
        this.isIgnoredMark(fontFamily, markAttachmentGlyphs, glyphs[glyphIndex])
      ) {
        glyphIndex += direction;
      }

      if (
        glyphIndex < 0 ||
        glyphIndex >= glyphs.length ||
        !glyphClass.includes(glyphs[glyphIndex])
      ) {
        return null;
      }

      indexes.push(glyphIndex);
      glyphIndex += direction;
    }

    return indexes;
  }

  private isIgnoredMark(
    fontFamily: string,
    markAttachmentGlyphs: SbmuflGlyphName[] | undefined,
    glyph: SbmuflGlyphName,
  ) {
    return (
      markAttachmentGlyphs != null &&
      this.getAdvanceWidth(fontFamily, glyph) === 0 &&
      !markAttachmentGlyphs.includes(glyph)
    );
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
    const baseAnchors = metadata.glyphsWithAnchors[base];
    const markAnchors = metadata.glyphsWithAnchors[mark];

    if (baseAnchors == null || markAnchors == null) {
      console.warn(`Missing anchor for base: ${base} mark: ${mark}`);
      return { x: 0, y: 0 };
    }

    const markAnchorName = Object.keys(markAnchors).find(
      (x) => baseAnchors[x] != null,
    );

    if (markAnchorName == null) {
      console.warn(`Missing anchor for base: ${base} mark: ${mark}`);
      return { x: 0, y: 0 };
    }

    const markAnchor = markAnchors[markAnchorName] as number[];

    const baseAnchor = baseAnchors[markAnchorName] as number[];

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
