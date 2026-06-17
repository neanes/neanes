import { describe, expect, it } from 'vitest';

import {
  composeFontFamilyCss,
  composeFontStyleCss,
  composeFontStyleCssDeclaration,
} from '@/ckeditor-plugins/fontstyle/fontstyle-util';
import { fontCatalog } from '@/services/FontCatalog';
import { compareFontStyles } from '@/utils/fontStyleAxes';

describe('FontCatalog bundled fonts', () => {
  it('lists the bundled families', () => {
    expect(fontCatalog.bundledFamilies()).toContain('Source Serif');
    expect(fontCatalog.bundledFamilies()).toContain('Neanes');
  });

  it('excludes bundled families from system family results', () => {
    const catalog = fontCatalog as unknown as {
      systemFaces: Map<string, FontData[]>;
    };
    const previous = catalog.systemFaces;

    try {
      catalog.systemFaces = new Map([
        ['Source Serif', [fontData('Source Serif')]],
        ['Avenir', [fontData('Avenir')]],
        ['Neanes', [fontData('Neanes')]],
        ['Charter', [fontData('Charter')]],
      ]);

      expect(fontCatalog.systemFamilies()).toEqual(['Avenir', 'Charter']);
    } finally {
      catalog.systemFaces = previous;
    }
  });

  it('canonicalizes lowercase keyword system styles', () => {
    const catalog = fontCatalog as unknown as {
      systemFaces: Map<string, FontData[]>;
    };
    const previous = catalog.systemFaces;

    try {
      catalog.systemFaces = new Map([
        [
          'Keyword Sans',
          [
            fontData('Keyword Sans', 'normal'),
            fontData('Keyword Sans', 'italic'),
            fontData('Keyword Sans', 'oblique'),
          ],
        ],
      ]);

      expect(fontCatalog.getStyles('Keyword Sans')).toEqual([
        'Regular',
        'Italic',
        'Oblique',
      ]);
    } finally {
      catalog.systemFaces = previous;
    }
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

function fontData(family: string, style = 'Regular'): FontData {
  return {
    family,
    fullName: `${family} ${style}`,
    postscriptName: `${family}-${style}`,
    style,
  };
}

describe('FontCatalog system font-face registration', () => {
  it('registers exact system faces with matching weight and style descriptors', () => {
    const catalog = fontCatalog as unknown as {
      registeredFaceRules: Map<string, string>;
      systemFaces: Map<string, FontData[]>;
    };
    const previousRegisteredFaceRules = catalog.registeredFaceRules;
    const previousSystemFaces = catalog.systemFaces;

    try {
      catalog.registeredFaceRules = new Map();
      catalog.systemFaces = new Map([
        ['Minion Pro', [fontData('Minion Pro', 'Caption Bold Italic')]],
      ]);

      expect(
        fontCatalog.resolveFace('Minion Pro', 'Caption Bold Italic'),
      ).toEqual({
        cssFamily: 'Minion Pro Caption Bold Italic',
        cssFontWeight: '700',
        cssFontStyle: 'italic',
      });
      expect(fontCatalog.getRegisteredFontFaceCss()).toBe(
        '@font-face { font-family: "Minion Pro Caption Bold Italic"; src: local("Minion Pro-Caption Bold Italic"), local("Minion Pro Caption Bold Italic"), local("Minion Pro Caption Bold Italic"); font-weight: 700; font-style: italic; }\n',
      );
    } finally {
      catalog.registeredFaceRules = previousRegisteredFaceRules;
      catalog.systemFaces = previousSystemFaces;
    }
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
