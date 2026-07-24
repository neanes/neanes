import { describe, expect, it } from 'vitest';

import {
  composeFontFamilyCss,
  composeFontStyleCss,
  composeFontStyleCssDeclaration,
} from '@/ckeditor-plugins/fontstyle/fontstyle-util';
import {
  createSystemFontFaceRule,
  fontCatalog,
  listFontStyles,
  listSystemFontFamilies,
  matchFontFaceByStyle,
  normalizeFontFamilyForComparison,
  resolveSystemFontFace,
  selectFontFaceByStyle,
} from '@/services/FontCatalog';
import { loadBundledFont } from '@/services/loadBundledFont.testHelper';
import { compareFontStyles } from '@/utils/fontStyleAxes';

interface BundledFontFace {
  family: string;
  fullName: string;
  postscriptName: string;
  style: string;
}

async function loadBundledFontFace(fileName: string): Promise<BundledFontFace> {
  const font = await loadBundledFont(fileName);

  const names = font.opentype.tables.name;
  const family = names.get(16) ?? names.get(1);
  const style = names.get(17) ?? names.get(2);
  const fullName = names.get(4);
  const postscriptName = names.get(6);

  if (
    family == null ||
    style == null ||
    fullName == null ||
    postscriptName == null
  ) {
    throw new Error(`Missing required name metadata in ${fileName}`);
  }

  return { family, fullName, postscriptName, style };
}

describe('FontCatalog bundled fonts', () => {
  it('lists the bundled families', () => {
    expect(fontCatalog.bundledFamilies()).toEqual([
      'Source Serif',
      'GFS Didot',
      'Noto Naskh Arabic',
      'Old Standard',
      'Neanes',
      'NeanesStathisSeries',
      'NeanesRTL',
      'NeanesLegacy',
      'NeanesStathisSeriesLegacy',
      'NeanesRTLLegacy',
    ]);
  });

  it('lists only text families as bundled text families', () => {
    expect(fontCatalog.bundledTextFamilies()).toEqual([
      'Source Serif',
      'GFS Didot',
      'Noto Naskh Arabic',
      'Old Standard',
    ]);
  });

  it('identifies bundled neume aliases independently of font-file mappings', () => {
    expect(fontCatalog.isBundledFamily('Neanes')).toBe(true);
    expect(fontCatalog.isBundledFamily('NeanesLegacy')).toBe(true);
    expect(fontCatalog.isBundledFamily('NeanesStathisSeriesLegacy')).toBe(true);
    expect(fontCatalog.isBundledFamily('Minion Pro')).toBe(false);
  });

  it('excludes bundled families from system family results', async () => {
    const bundledFaces = await Promise.all([
      loadBundledFontFace('GFSDidot.otf'),
      loadBundledFontFace('Neanes.otf'),
      loadBundledFontFace('OldStandard-Regular.otf'),
    ]);

    expect(
      listSystemFontFamilies([
        ...bundledFaces.map((face) => face.family),
        'Avenir',
        'Charter',
      ]),
    ).toEqual(['Avenir', 'Charter']);
  });

  it('lists styles from real font face metadata', async () => {
    const faces = await Promise.all([
      loadBundledFontFace('SourceSerif4-Regular.otf'),
      loadBundledFontFace('SourceSerif4-Semibold.otf'),
      loadBundledFontFace('SourceSerif4-BoldIt.otf'),
    ]);

    expect(listFontStyles(faces)).toEqual([
      'Regular',
      'Semibold',
      'Bold Italic',
    ]);
  });

  it('returns the styles of a bundled family in font-style order', () => {
    const sourceSerifStyles = fontCatalog.getStyles('Source Serif');

    expect(sourceSerifStyles).toHaveLength(60);
    expect(sourceSerifStyles).toEqual(
      [...sourceSerifStyles].sort(compareFontStyles),
    );
    expect(sourceSerifStyles.slice(0, 6)).toEqual([
      'Regular',
      'ExtraLight',
      'Caption ExtraLight',
      'Display ExtraLight',
      'SmText ExtraLight',
      'Subhead ExtraLight',
    ]);
    expect(sourceSerifStyles).toContain('Caption');
    expect(sourceSerifStyles).toContain('Caption Bold Italic');
    expect(sourceSerifStyles).toContain('Display Light');
    expect(sourceSerifStyles).toContain('SmText ExtraLight Italic');
    expect(sourceSerifStyles).toContain('Subhead Black Italic');
    expect(fontCatalog.getStyles('GFS Didot')).toEqual([
      'Regular',
      'Italic',
      'Bold',
      'Bold Italic',
    ]);
    expect(fontCatalog.getStyles('Noto Naskh Arabic')).toEqual([
      'Regular',
      'Bold',
    ]);
    expect(fontCatalog.getStyles('Neanes')).toEqual(['Regular']);
  });

  it('resolves bundled faces to weight/style on the same family', () => {
    expect(fontCatalog.resolveFace('Source Serif', 'Regular')).toEqual({
      cssFamily: 'Source Serif',
      cssFontWeight: undefined,
      cssFontStyle: undefined,
    });
    expect(fontCatalog.resolveFace('Source Serif', 'Bold Italic')).toEqual({
      cssFamily: 'Source Serif',
      cssFontWeight: 'bold',
      cssFontStyle: 'italic',
    });
    expect(fontCatalog.resolveFace('Source Serif', 'Semibold Italic')).toEqual({
      cssFamily: 'Source Serif',
      cssFontWeight: '600',
      cssFontStyle: 'italic',
    });
    expect(
      fontCatalog.resolveFace('Source Serif', 'Caption Bold Italic'),
    ).toEqual({
      cssFamily: 'Source Serif Caption',
      cssFontWeight: 'bold',
      cssFontStyle: 'italic',
    });
    expect(fontCatalog.resolveFace('Source Serif', 'Display Light')).toEqual({
      cssFamily: 'Source Serif Display',
      cssFontWeight: '300',
      cssFontStyle: undefined,
    });
    expect(fontCatalog.resolveFace('Source Serif', 'Extra Light')).toEqual({
      cssFamily: 'Source Serif',
      cssFontWeight: '200',
      cssFontStyle: undefined,
    });
  });
});

describe('FontCatalog font feature values', () => {
  it('strips wrapper quotes without removing embedded apostrophes', () => {
    expect(normalizeFontFamilyForComparison(`  "O'Brien   Caption"  `)).toBe(
      "o'brien caption",
    );
    expect(normalizeFontFamilyForComparison("O'Brien Caption")).not.toBe(
      normalizeFontFamilyForComparison('OBrien Caption'),
    );
  });

  it('maps export idents for bundled text and registered exact faces', () => {
    const exactFace = fontCatalog.resolveFace('Minion Pro', 'Caption');
    const regularSystemFace = fontCatalog.resolveFace(
      'Unregistered System Family',
      'Regular',
    );
    const css = fontCatalog.getExportFontFeatureValuesCss();

    expect(css).toContain('@font-feature-values');
    expect(css).toContain('"Old Standard"');
    expect(css).toContain('"Source Serif Caption"');
    expect(css).toContain(`"${exactFace.cssFamily}"`);
    expect(css).not.toContain(`"${regularSystemFace.cssFamily}"`);
    expect(css).toContain('@stylistic { stylistic-1: 1;');
    expect(css).toContain('@styleset { ss01: 1;');
    expect(css).toContain('ss20: 20; }');
    expect(css).toContain('@character-variant { cv01: 1;');
    expect(css).toContain('cv99: 99; }');
    expect(css).toContain('@swash { swash-1: 1;');
    expect(css).toContain('@ornaments { ornaments-1: 1;');
    expect(css).toContain('@annotation { annotation-1: 1;');
    expect(css).toContain('annotation-99: 99; } }');
    expect(css).not.toContain('"Neanes"');
    expect(css).not.toContain('"NeanesLegacy"');
    expect(css).not.toContain('"NeanesStathisSeries"');
    expect(css).not.toContain('"NeanesStathisSeriesLegacy"');
    expect(css).not.toContain('NeanesRTL');
    expect(css).not.toContain('NeanesRTLLegacy');
  });

  it('selects real font faces by matching style axes', async () => {
    const faces = await Promise.all([
      loadBundledFontFace('SourceSerif4-Regular.otf'),
      loadBundledFontFace('SourceSerif4-Semibold.otf'),
      loadBundledFontFace('SourceSerif4-BoldIt.otf'),
    ]);

    expect(selectFontFaceByStyle(faces, 'Semibold')?.postscriptName).toBe(
      'SourceSerif4-Semibold',
    );
    expect(selectFontFaceByStyle(faces, 'Italic Bold')?.postscriptName).toBe(
      'SourceSerif4-BoldIt',
    );
    // An unavailable style falls back to the Regular face.
    expect(selectFontFaceByStyle(faces, 'Black')?.postscriptName).toBe(
      'SourceSerif4-Regular',
    );
    expect(selectFontFaceByStyle(faces, null)?.postscriptName).toBe(
      'SourceSerif4-Regular',
    );
    expect(selectFontFaceByStyle([], null)).toBeUndefined();
  });
});

describe('FontCatalog system font-face registration', () => {
  it('requires exact aliases for enumerated basic system faces', async () => {
    const faces = await Promise.all([
      loadBundledFontFace('SourceSerif4-Regular.otf'),
      loadBundledFontFace('SourceSerif4-BoldIt.otf'),
    ]);

    const regular = resolveSystemFontFace(faces, 'Regular');
    const boldItalic = resolveSystemFontFace(faces, 'Italic Bold');
    const unavailableBasic = resolveSystemFontFace(faces, 'Semibold');
    const unavailableOptical = resolveSystemFontFace([], 'Caption');

    expect(regular.face?.postscriptName).toBe('SourceSerif4-Regular');
    expect(regular.canonicalStyle).toBe('Regular');
    expect(regular.needsFaceAlias).toBe(true);
    expect(boldItalic.face?.postscriptName).toBe('SourceSerif4-BoldIt');
    expect(boldItalic.canonicalStyle).toBe('Bold Italic');
    expect(boldItalic.needsFaceAlias).toBe(true);
    expect(unavailableBasic.needsFaceAlias).toBe(false);
    expect(unavailableOptical.needsFaceAlias).toBe(true);
  });

  it('matches reordered non-basic styles without falling back', async () => {
    const parsedFace = await loadBundledFontFace(
      'SourceSerif4Caption-BoldIt.otf',
    );
    const canonicalFace = {
      ...parsedFace,
      family: 'Source Serif 4',
      style: 'Caption Bold Italic',
    };

    const matched = matchFontFaceByStyle(
      [canonicalFace],
      'Italic Caption Bold',
    );

    expect(matched).toBe(canonicalFace);
    expect(matchFontFaceByStyle([canonicalFace], 'Display Black')).toBe(
      undefined,
    );

    if (matched == null) {
      throw new Error('Expected the reordered style to match');
    }

    const rule = createSystemFontFaceRule(
      `${matched.family} ${matched.style}`,
      matched.style,
      matched,
    );

    expect(rule).toContain(`local("${parsedFace.postscriptName}")`);
    expect(rule).toContain(`local("${parsedFace.fullName}")`);
    expect(rule).toContain('font-family: "Source Serif 4 Caption Bold Italic"');
  });

  it('creates exact-face CSS from real font metadata', async () => {
    const face = await loadBundledFontFace('SourceSerif4Caption-BoldIt.otf');

    expect(
      createSystemFontFaceRule(face.family, 'Caption Bold Italic', face),
    ).toBe(
      '@font-face { font-family: "Source Serif 4 Caption"; src: local("SourceSerif4Caption-BoldIt"), local("Source Serif 4 Caption Bold Italic"), local("Source Serif 4 Caption"); font-weight: 700; font-style: italic; }\n',
    );
  });
});

describe('FontCatalog.splitFace', () => {
  it('treats a known family as Regular', () => {
    expect(fontCatalog.splitFace('Source Serif')).toEqual({
      family: 'Source Serif',
      style: 'Regular',
    });
  });

  it('splits a known family plus a trailing style', () => {
    expect(fontCatalog.splitFace('Source Serif Bold')).toEqual({
      family: 'Source Serif',
      style: 'Bold',
    });
    expect(fontCatalog.splitFace('Source Serif Caption Bold Italic')).toEqual({
      family: 'Source Serif',
      style: 'Caption Bold Italic',
    });
  });

  it('falls back to a heuristic for unknown fonts', () => {
    expect(fontCatalog.splitFace('Minion Pro Semibold')).toEqual({
      family: 'Minion Pro',
      style: 'Semibold',
    });
    expect(fontCatalog.splitFace('Minion Pro')).toEqual({
      family: 'Minion Pro',
      style: 'Regular',
    });
  });
});

describe('composeFontStyleCss', () => {
  it('serializes basic axes as explicit CSS', () => {
    expect(composeFontStyleCss('Source Serif,Neanes', 'Bold', 'Neanes')).toBe(
      'font-family:Source Serif,Neanes;font-weight:700;font-style:normal;',
    );
    expect(composeFontStyleCss('Source Serif,Neanes', 'Italic', 'Neanes')).toBe(
      'font-family:Source Serif,Neanes;font-weight:400;font-style:italic;',
    );
    expect(
      composeFontStyleCss('Source Serif,Neanes', 'Bold Italic', 'Neanes'),
    ).toBe(
      'font-family:Source Serif,Neanes;font-weight:700;font-style:italic;',
    );
    expect(composeFontStyleCss(null, 'Bold', 'Neanes')).toBe(
      'font-weight:700;font-style:normal;',
    );
  });

  it('distinguishes explicit Regular from inherited style', () => {
    expect(composeFontStyleCss('GFS Didot,Neanes', 'Regular', 'Neanes')).toBe(
      'font-family:GFS Didot,Neanes;font-weight:400;font-style:normal;',
    );
    expect(composeFontStyleCss('GFS Didot,Neanes', undefined, 'Neanes')).toBe(
      'font-family:GFS Didot,Neanes;',
    );
    expect(composeFontStyleCss(null, 'Regular', 'Neanes')).toBe(
      'font-weight:400;font-style:normal;',
    );
    expect(composeFontStyleCss(null, undefined, 'Neanes')).toBe('');
  });

  it('does not append the neume fallback to a neume family', () => {
    expect(composeFontStyleCss('Neanes', 'Regular', 'Neanes')).toBe(
      'font-family:Neanes;font-weight:400;font-style:normal;',
    );
  });

  it('uses the base family plus weight/style for weight-only system styles', () => {
    expect(composeFontStyleCss('Minion Pro,Neanes', 'Semibold', 'Neanes')).toBe(
      'font-family:Minion Pro,Neanes;font-weight:600;font-style:normal;',
    );
    expect(
      composeFontStyleCss('Minion Pro,Neanes', 'Light Italic', 'Neanes'),
    ).toBe('font-family:Minion Pro,Neanes;font-weight:300;font-style:italic;');
  });

  it('uses an exact face name when the style has non-weight tokens', () => {
    expect(
      composeFontStyleCss('Minion Pro,Neanes', 'Bold Italic Caption', 'Neanes'),
    ).toBe(
      "font-family:'Minion Pro Bold Italic Caption', Minion Pro,Neanes;font-weight:700;font-style:italic;",
    );
    expect(composeFontStyleCss('Minion Pro,Neanes', 'Display', 'Neanes')).toBe(
      "font-family:'Minion Pro Display', Minion Pro,Neanes;font-weight:400;font-style:normal;",
    );
    expect(
      composeFontStyleCss(
        'Source Serif,Neanes',
        'Caption Bold Italic',
        'Neanes',
      ),
    ).toBe(
      "font-family:'Source Serif Caption', Source Serif,Neanes;font-weight:700;font-style:italic;",
    );
  });

  it('does not serialize familyless non-basic styles', () => {
    expect(composeFontStyleCss(null, 'Semibold', 'Neanes')).toBe('');
    expect(composeFontStyleCss(null, 'Caption', 'Neanes')).toBe('');
  });

  it('keeps family and non-basic style CSS separately composable', () => {
    expect(
      composeFontFamilyCss('Minion Pro,Neanes', 'Semibold', 'Neanes'),
    ).toBe('font-family:Minion Pro,Neanes;');
    expect(composeFontFamilyCss('Minion Pro,Neanes', 'Caption', 'Neanes')).toBe(
      "font-family:'Minion Pro Caption', Minion Pro,Neanes;",
    );
    expect(
      composeFontFamilyCss(
        'Source Serif,Neanes',
        'Caption Bold Italic',
        'Neanes',
      ),
    ).toBe("font-family:'Source Serif Caption', Source Serif,Neanes;");
    expect(
      composeFontStyleCssDeclaration('Minion Pro,Neanes', 'Semibold'),
    ).toBe('font-weight:600;font-style:normal;');
    expect(composeFontStyleCssDeclaration('Minion Pro,Neanes', 'Bold')).toBe(
      'font-weight:700;font-style:normal;',
    );
  });
});
