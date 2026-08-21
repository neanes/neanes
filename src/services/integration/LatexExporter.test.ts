import { describe, expect, it } from 'vitest';

import { TextBoxAlignment } from '@/models/Element';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultParagraphStyles,
  ParagraphStyle,
} from '@/models/ParagraphStyle';
import { Unit } from '@/utils/Unit';

import {
  convertResolvedTextStyle,
  getLatexNeumeFont,
  LATEX_SCHEMA_VERSION,
  LatexFontFaceResolutionError,
  LatexTextStyleRegistry,
} from './LatexExporter';

describe('LatexExporter typography schema', () => {
  it('uses format version 3', () => {
    expect(LATEX_SCHEMA_VERSION).toBe(3);
  });

  it.each(['Neanes', 'NeanesRTL', 'NeanesStathisSeries'])(
    'exports the logical neume font family %s',
    (family) => {
      expect(getLatexNeumeFont(family)).toEqual({
        fontFamily: family,
        fontVersion: expect.any(String),
      });
    },
  );

  it('exports a complete resolved style with exact face and OpenType values', () => {
    const styles = createDefaultParagraphStyles();
    const root = styles.find(
      (style) => style.id === BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    )!;

    root.overrides = {
      fontFamily: 'Source Serif',
      fontStyle: 'Caption Semibold',
      fontVariantCaps: 'all-small-caps',
      fontVariantNumeric: 'oldstyle-nums proportional-nums',
      fontVariantLigatures: 'discretionary-ligatures historical-ligatures',
      fontVariantAlternates:
        'historical-forms styleset(ss01, ss05) character-variant(cv27) swash(swash-2)',
    };

    const registry = new LatexTextStyleRegistry(styles);
    registry.getStyleId(BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText, {});

    expect(
      registry.styles.find(
        (style) => style.id === BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
      ),
    ).toEqual({
      id: BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
      alignment: 'left',
      fontFamily: 'Source Serif 4',
      fontSize: 12,
      fontStyle: 'Caption Semibold',
      postscriptName: 'SourceSerif4Caption-Semibold',
      color: '000000',
      strokeWidth: 0,
      strokeColor: 'currentcolor',
      lineHeight: 'normal',
      textDecoration: 'none',
      fontFeatures: {
        smcp: 1,
        c2sc: 1,
        onum: 1,
        pnum: 1,
        dlig: 1,
        hlig: 1,
        hist: 1,
        ss01: 1,
        ss05: 1,
        cv27: 1,
        swsh: 2,
        cswh: 2,
      },
    });
  });

  it('flattens paragraph inheritance and explicit typography resets', () => {
    const styles = createDefaultParagraphStyles();
    const lyrics = styles.find(
      (style) => style.id === BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
    )!;
    const custom = new ParagraphStyle();

    lyrics.overrides.fontVariantCaps = 'small-caps';
    lyrics.overrides.fontVariantNumeric = 'oldstyle-nums';
    custom.id = 'custom';
    custom.displayName = 'Custom';
    custom.parentStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics;
    custom.overrides = {
      fontSize: Unit.fromPt(14),
      textDecoration: null,
      fontVariantCaps: null,
    };
    styles.push(custom);

    const registry = new LatexTextStyleRegistry(styles);
    registry.getStyleId(custom.id, {});

    expect(registry.styles.find((style) => style.id === 'custom')).toEqual({
      id: 'custom',
      alignment: 'left',
      fontFamily: 'Source Serif 4',
      fontSize: 14,
      fontStyle: 'Regular',
      postscriptName: 'SourceSerif4-Regular',
      color: '000000',
      strokeWidth: 0,
      strokeColor: 'currentcolor',
      lineHeight: 'normal',
      textDecoration: 'none',
      fontFeatures: { onum: 1 },
    });
  });

  it('exports the real default face when a style changes only the font family', () => {
    const styles = createDefaultParagraphStyles();
    const dropCap = styles.find(
      (style) => style.id === BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
    )!;
    dropCap.overrides.fontFamily = 'GFS Didot';

    const registry = new LatexTextStyleRegistry(styles);
    registry.getStyleId(dropCap.id, {});

    expect(
      registry.styles.find(
        (style) => style.id === BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
      ),
    ).toMatchObject({
      fontFamily: 'GFS Didot',
      fontStyle: 'Regular',
      postscriptName: 'GFSDidot-Regular',
    });
  });

  it('fails export when an exact PostScript face cannot be resolved', () => {
    const styles = createDefaultParagraphStyles();
    const dropCap = styles.find(
      (style) => style.id === BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
    )!;
    dropCap.overrides.fontFamily = 'Not An Installed Family';
    dropCap.overrides.fontStyle = 'Bold Italic';

    expect(() =>
      new LatexTextStyleRegistry(styles).getStyleId(dropCap.id, {}),
    ).toThrow(LatexFontFaceResolutionError);

    try {
      new LatexTextStyleRegistry(styles).getStyleId(dropCap.id, {});
    } catch (error) {
      expect(error).toMatchObject({
        fontFamily: 'Not An Installed Family',
        fontStyle: 'Bold Italic',
      });
    }
  });

  it('also fails export for an unknown regular face', () => {
    const styles = createDefaultParagraphStyles();
    const dropCap = styles.find(
      (style) => style.id === BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
    )!;
    dropCap.overrides.fontFamily = 'Not An Installed Family';
    dropCap.overrides.fontStyle = 'Regular';

    expect(() =>
      new LatexTextStyleRegistry(styles).getStyleId(dropCap.id, {}),
    ).toThrow(LatexFontFaceResolutionError);

    try {
      new LatexTextStyleRegistry(styles).getStyleId(dropCap.id, {});
    } catch (error) {
      expect(error).toMatchObject({
        fontFamily: 'Not An Installed Family',
        fontStyle: 'Regular',
      });
    }
  });

  it('interns complete element styles and reuses identical values', () => {
    const styles = createDefaultParagraphStyles();
    const registry = new LatexTextStyleRegistry(styles);
    const overrides = {
      fontFamily: 'Source Serif',
      fontStyle: 'Display Bold Italic',
      color: '#123456',
      strokeWidth: Unit.fromPt(0.5),
      fontVariantAlternates: 'styleset(ss03)',
    };

    const firstStyleId = registry.getStyleId(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
      overrides,
    );
    const secondStyleId = registry.getStyleId(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
      overrides,
    );

    expect(firstStyleId).toBe(secondStyleId);
    expect(registry.styles.find((style) => style.id === firstStyleId)).toEqual({
      id: firstStyleId,
      alignment: 'left',
      fontFamily: 'Source Serif 4',
      fontSize: 12,
      fontStyle: 'Display Bold Italic',
      postscriptName: 'SourceSerif4Display-BoldIt',
      color: '123456',
      strokeWidth: 0.5,
      strokeColor: 'currentcolor',
      lineHeight: 'normal',
      textDecoration: 'none',
      fontFeatures: { ss03: 1 },
    });
  });

  it('reuses the referenced style when overrides do not change its value', () => {
    const styles = createDefaultParagraphStyles();
    const registry = new LatexTextStyleRegistry(styles);
    const baseStyleId = registry.getStyleId(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
      {},
    );

    expect(
      registry.getStyleId(BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics, {
        fontSize: Unit.fromPt(12),
      }),
    ).toBe(baseStyleId);
  });

  it('interns paragraph styles with identical resolved values', () => {
    const styles = createDefaultParagraphStyles();
    const registry = new LatexTextStyleRegistry(styles);

    registry.getStyleId(BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText, {});
    expect(
      registry.getStyleId(BUILT_IN_PARAGRAPH_STYLE_IDS.Annotation, {}),
    ).toBe(BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText);
    expect(
      registry.styles.some(
        (style) => style.id === BUILT_IN_PARAGRAPH_STYLE_IDS.Annotation,
      ),
    ).toBe(false);
  });

  it('converts an already resolved style without inheritance metadata', () => {
    expect(
      convertResolvedTextStyle({
        alignment: TextBoxAlignment.Center,
        fontFamily: 'Source Serif',
        fontSize: Unit.fromPt(12),
        fontStyle: 'Regular',
        color: '#123456',
        strokeWidth: 0,
        strokeColor: 'currentcolor',
        lineHeight: null,
        textDecoration: null,
        fontVariantCaps: null,
        fontVariantNumeric: null,
        fontVariantLigatures: null,
        fontVariantAlternates: null,
      }),
    ).toMatchObject({
      alignment: 'center',
      fontFamily: 'Source Serif 4',
      fontSize: 12,
      postscriptName: 'SourceSerif4-Regular',
    });
  });
});
