import { DEFAULT_FONT_STYLE, NEUME_FONT_FAMILIES } from '@/utils/fontConstants';
import { escapeFontName, normalizeFontFamily } from '@/utils/fontFamily';
import {
  compareFontStyles,
  cssFontWeight,
  fontStyleKey,
  hasNonWeightStyleToken,
  isRegularStyle,
  normalizeDocumentFontStyle,
  parseStyleAxes,
} from '@/utils/fontStyleAxes';
import { fontFeatureValuesCss } from '@/utils/fontVariants';
import { isElectron } from '@/utils/isElectron';

// The CSS needed to render a (family, style) selection.
//   - bundled fonts express weight/slant styles via font-weight/font-style on
//     the same family (their @font-face rules live in App.vue, plus Source
//     Serif's expanded set in src/assets/fonts/source-serif.css). Source Serif
//     optical styles resolve to distinct bundled CSS families such as
//     "Source Serif Caption".
//   - enumerated system fonts use an exact-face @font-face alias. This avoids a
//     Chromium system-family path that drops resolved font-variant-alternates
//     features. Unknown families retain browser-native family matching.
export interface ResolvedFace {
  cssFamily: string;
  cssFontWeight?: string;
  cssFontStyle?: string;
}

interface BundledFace {
  style: string;
  cssFamily?: string;
  cssFontWeight?: string;
  cssFontStyle?: string;
  // The bundled font file (src/assets/fonts) backing the face. Present only
  // on the text faces: the alternates inspection reads these files, and the
  // neume families deliberately opt out (their salt feature is neume-rendering
  // plumbing, alternate glyph forms the fonts' contextual rules select, not
  // text typography).
  fileName?: string;
}

export interface FontFaceValue {
  style: string;
}

interface LocalFontSource {
  fullName: string;
  postscriptName: string;
}

const FONT_FACE_STYLE_ID = 'neanes-font-faces';
const FONT_FEATURE_VALUES_STYLE_ID = 'neanes-font-feature-values';

// Bundled families, in the order the pickers present them. These ship with the
// app as @font-face rules in App.vue and are available in both web and Electron.
const BUNDLED_FAMILIES = [
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
];

// The standard four-face set shared by our bundled text families, matching the
// font-weight/font-style descriptors of their @font-face rules.
const TEXT_FACES: BundledFace[] = [
  { style: DEFAULT_FONT_STYLE },
  { style: 'Bold', cssFontWeight: 'bold' },
  { style: 'Italic', cssFontStyle: 'italic' },
  { style: 'Bold Italic', cssFontWeight: 'bold', cssFontStyle: 'italic' },
];

const NOTO_NASKH_ARABIC_FACES: BundledFace[] = [
  { style: DEFAULT_FONT_STYLE },
  { style: 'Bold', cssFontWeight: 'bold' },
];

// Bundled font files are named after the face they hold, so a family only has
// to say how it spells the style (which is the style name with the spaces
// squeezed out). The drift-guard test in FontAlternatesService.test.ts opens
// every mapped file, so a wrong name fails loudly rather than silently
// dropping the face's alternates.
function withFileNames(
  faces: BundledFace[],
  fileName: (style: string) => string,
): BundledFace[] {
  return faces.map((face) => ({
    ...face,
    fileName: fileName(face.style.replace(/ /g, '')),
  }));
}

const SOURCE_SERIF_BASE_FACES: BundledFace[] = [
  { style: DEFAULT_FONT_STYLE },
  { style: 'ExtraLight', cssFontWeight: '200' },
  { style: 'ExtraLight Italic', cssFontWeight: '200', cssFontStyle: 'italic' },
  { style: 'Light', cssFontWeight: '300' },
  { style: 'Light Italic', cssFontWeight: '300', cssFontStyle: 'italic' },
  { style: 'Italic', cssFontStyle: 'italic' },
  { style: 'Semibold', cssFontWeight: '600' },
  { style: 'Semibold Italic', cssFontWeight: '600', cssFontStyle: 'italic' },
  { style: 'Bold', cssFontWeight: 'bold' },
  { style: 'Bold Italic', cssFontWeight: 'bold', cssFontStyle: 'italic' },
  { style: 'Black', cssFontWeight: '900' },
  { style: 'Black Italic', cssFontWeight: '900', cssFontStyle: 'italic' },
];

const SOURCE_SERIF_OPTICAL_FAMILIES = [
  { style: 'Caption', cssFamily: 'Source Serif Caption' },
  { style: 'Display', cssFamily: 'Source Serif Display' },
  { style: 'SmText', cssFamily: 'Source Serif SmText' },
  { style: 'Subhead', cssFamily: 'Source Serif Subhead' },
];

function sourceSerifFaces(): BundledFace[] {
  // Source Serif folds the optical size into the file-name prefix and
  // abbreviates Italic ("Bold Italic" -> "SourceSerif4-BoldIt.otf").
  const faces = (optical: string, cssFamily?: string) =>
    withFileNames(
      SOURCE_SERIF_BASE_FACES,
      (style) => `SourceSerif4${optical}-${style.replace('Italic', 'It')}.otf`,
    ).map((face) => ({ ...face, cssFamily }));

  return [
    ...faces(''),
    ...SOURCE_SERIF_OPTICAL_FAMILIES.flatMap(({ style, cssFamily }) =>
      faces(style, cssFamily).map((face) => ({
        ...face,
        style:
          face.style === DEFAULT_FONT_STYLE ? style : `${style} ${face.style}`,
      })),
    ),
  ];
}

const BUNDLED_FACES: Record<string, BundledFace[]> = {
  'Source Serif': sourceSerifFaces(),
  'GFS Didot': withFileNames(TEXT_FACES, (style) =>
    style === DEFAULT_FONT_STYLE ? 'GFSDidot.otf' : `GFSDidot${style}.otf`,
  ),
  'Old Standard': withFileNames(
    TEXT_FACES,
    (style) => `OldStandard-${style}.otf`,
  ),
  'Noto Naskh Arabic': withFileNames(
    NOTO_NASKH_ARABIC_FACES,
    (style) => `NotoNaskhArabic-${style}.otf`,
  ),
  Neanes: [{ style: DEFAULT_FONT_STYLE }],
  NeanesStathisSeries: [{ style: DEFAULT_FONT_STYLE }],
  NeanesRTL: [{ style: DEFAULT_FONT_STYLE }],
  NeanesLegacy: [{ style: DEFAULT_FONT_STYLE }],
  NeanesStathisSeriesLegacy: [{ style: DEFAULT_FONT_STYLE }],
  NeanesRTLLegacy: [{ style: DEFAULT_FONT_STYLE }],
};

// CSS font family names are case-insensitive. Normalize the spelling used for
// comparisons without changing the family spelling emitted in generated CSS.
export function normalizeFontFamilyForComparison(family: string): string {
  return normalizeName(normalizeFontFamily(family)).replace(
    /[A-Z]/g,
    (character) => character.toLowerCase(),
  );
}

const NORMALIZED_NEUME_FONT_FAMILIES = [...NEUME_FONT_FAMILIES].map(
  normalizeFontFamilyForComparison,
);

// Exact system faces are registered as "<family> <style>" CSS families, so
// exclude those aliases along with the four base neume families.
function isNeumeFontFeatureValuesFamily(family: string): boolean {
  const normalizedFamily = normalizeFontFamilyForComparison(family);

  return NORMALIZED_NEUME_FONT_FAMILIES.some(
    (neumeFamily) =>
      normalizedFamily === neumeFamily ||
      normalizedFamily.startsWith(`${neumeFamily} `),
  );
}

// Every CSS family the bundled text fonts render as: the picker families plus
// the distinct families the Source Serif optical sizes resolve to. Neume fonts
// must not receive inherited text alternate mappings because they use salt for
// notation glyph selection.
const BUNDLED_CSS_FAMILIES: string[] = [
  ...new Set([
    ...BUNDLED_FAMILIES,
    ...Object.values(BUNDLED_FACES).flatMap((faces) =>
      faces.flatMap((face) => face.cssFamily ?? []),
    ),
  ]),
].filter((family) => !isNeumeFontFeatureValuesFamily(family));

// Tokens used to recognise a trailing style in a face name when the family is
// neither bundled nor installed (a best-effort fallback for legacy imports).
const STYLE_WORDS = new Set([
  'regular',
  'normal',
  'italic',
  'oblique',
  'bold',
  'semibold',
  'demibold',
  'medium',
  'light',
  'semilight',
  'thin',
  'hairline',
  'book',
  'black',
  'heavy',
  'extralight',
  'ultralight',
  'extrabold',
  'ultrabold',
  'extra',
  'semi',
  'demi',
  'ultra',
  'super',
  'condensed',
  'narrow',
  'wide',
  'expanded',
  'caption',
  'display',
  'text',
  'smtext',
  'subhead',
  'deck',
  'poster',
  'micro',
]);

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function heuristicSplitFace(face: string): { family: string; style: string } {
  const tokens = face.split(' ');
  const styleTokens: string[] = [];

  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1].toLowerCase().replace(/-/g, '');

    if (STYLE_WORDS.has(last)) {
      styleTokens.unshift(tokens.pop()!);
    } else {
      break;
    }
  }

  if (styleTokens.length === 0) {
    return { family: face, style: DEFAULT_FONT_STYLE };
  }

  return {
    family: tokens.join(' '),
    style: normalizeDocumentFontStyle(styleTokens.join(' ')),
  };
}

export function listSystemFontFamilies(families: Iterable<string>): string[] {
  return [...families]
    .filter((family) => BUNDLED_FACES[family] == null)
    .sort((a, b) => a.localeCompare(b));
}

export function listFontStyles(faces: readonly FontFaceValue[]): string[] {
  const styles = [
    ...new Set(faces.map((font) => normalizeDocumentFontStyle(font.style))),
  ].sort(compareFontStyles);

  if (!styles.some((style) => isRegularStyle(style))) {
    styles.unshift(DEFAULT_FONT_STYLE);
  }

  return styles;
}

export function selectFontFaceByStyle<T extends FontFaceValue>(
  faces: readonly T[],
  fontStyle: string | null,
): T | undefined {
  return (
    matchFontFaceByStyle(faces, fontStyle) ??
    faces.find((font) => isRegularStyle(font.style)) ??
    faces[0]
  );
}

// Return only a face whose style is semantically equivalent to the requested
// style. Token ordering does not matter, and there is deliberately no fallback.
export function matchFontFaceByStyle<T extends FontFaceValue>(
  faces: readonly T[],
  fontStyle: string | null,
): T | undefined {
  const key = fontStyleKey(fontStyle);

  return faces.find((font) => fontStyleKey(font.style) === key);
}

export function resolveSystemFontFace<T extends FontFaceValue>(
  faces: readonly T[],
  style: string,
): {
  face: T | undefined;
  canonicalStyle: string;
  needsFaceAlias: boolean;
} {
  const face = matchFontFaceByStyle(faces, style);

  return {
    face,
    canonicalStyle:
      face != null ? normalizeDocumentFontStyle(face.style) : style,
    // Keep the legacy best-effort alias for non-basic styles even when local
    // font enumeration is unavailable. Basic styles are aliased only when the
    // exact installed face and its unique local names are known.
    needsFaceAlias: face != null || hasNonWeightStyleToken(style),
  };
}

export function createSystemFontFaceRule(
  cssFamily: string,
  style: string,
  data?: LocalFontSource,
): string {
  const sources: string[] = [];

  if (data?.postscriptName) {
    sources.push(`local("${escapeFontName(data.postscriptName)}")`);
  }

  if (data?.fullName) {
    sources.push(`local("${escapeFontName(data.fullName)}")`);
  }

  sources.push(`local("${escapeFontName(cssFamily)}")`);

  return `@font-face { font-family: "${escapeFontName(
    cssFamily,
  )}"; src: ${sources.join(', ')}; font-weight: ${
    cssFontWeight(style) ?? '400'
  }; font-style: ${parseStyleAxes(style).italic ? 'italic' : 'normal'}; }\n`;
}

class FontCatalog {
  private loaded = false;
  private loadingPromise: Promise<void> | null = null;
  private systemFaces = new Map<string, FontData[]>();
  private registeredFaceRules = new Map<string, string>();
  // Memoized (family, requested style) -> CSS family: the exact-face alias, or
  // the base family when no alias is needed. resolveFace runs once per note
  // per layout pass, so steady-state calls must skip the face scan. Reset when
  // the system font list loads because the aliasing decision and the canonical
  // style come from the matched face.
  private resolvedSystemFaces = new Map<string, string>();
  private injectedFaces = new Set<string>();
  private styleElement: HTMLStyleElement | null = null;
  private featureValuesStyleElement: HTMLStyleElement | null = null;

  // Resolve once the document is visible. queryLocalFonts() throws
  // "SecurityError: Page needs to be visible" when the document is hidden.
  private waitUntilVisible(): Promise<void> {
    if (
      typeof document === 'undefined' ||
      document.visibilityState === 'visible'
    ) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', onVisibilityChange);
          resolve();
        }
      };

      document.addEventListener('visibilitychange', onVisibilityChange);
    });
  }

  // Load the system font list (Electron only). Idempotent and safe to call
  // repeatedly; if a query fails (e.g. it needs a user gesture) it leaves the
  // catalog unloaded so a later call can retry.
  async init(): Promise<void> {
    if (this.loaded) {
      return;
    }

    if (this.loadingPromise == null) {
      this.loadingPromise = this.load().finally(() => {
        this.loadingPromise = null;
      });
    }

    return this.loadingPromise;
  }

  private async load(): Promise<void> {
    // The web app intentionally never calls queryLocalFonts (privacy); it only
    // supports the bundled fonts. Nothing to load -- mark loaded so we do not
    // retry pointlessly.
    if (
      !isElectron() ||
      typeof window === 'undefined' ||
      typeof window.queryLocalFonts !== 'function'
    ) {
      this.loaded = true;
      this.refreshFontFeatureValuesStyle();
      return;
    }

    // queryLocalFonts() requires a visible document, so defer it until the
    // renderer reports that condition.
    await this.waitUntilVisible();

    try {
      const fonts = await window.queryLocalFonts();
      const map = new Map<string, FontData[]>();

      for (const font of fonts) {
        const list = map.get(font.family);

        if (list != null) {
          list.push(font);
        } else {
          map.set(font.family, [font]);
        }
      }

      this.systemFaces = map;
      this.resolvedSystemFaces.clear();
      this.loaded = true;
    } catch (error) {
      // Leave `loaded` false so a later (e.g. post-activation) init can retry.
      console.error('Failed to query local fonts', error);
    }

    // Even a failed system query leaves the bundled families needing their
    // styleset ident mapping.
    this.refreshFontFeatureValuesStyle();
  }

  bundledFamilies(): string[] {
    return [...BUNDLED_FAMILIES];
  }

  isBundledFamily(family: string): boolean {
    return BUNDLED_FAMILIES.includes(family);
  }

  // Bundled text families only (excludes the neume/music fonts). Non-rich text
  // pickers prepend these to the system families.
  bundledTextFamilies(): string[] {
    return BUNDLED_FAMILIES.filter(
      (family) => !NEUME_FONT_FAMILIES.has(family),
    );
  }

  // System font families only (sorted, deduped). The pickers prepend the
  // bundled families themselves, so excluding them here avoids duplicates.
  systemFamilies(): string[] {
    return listSystemFontFamilies(this.systemFaces.keys());
  }

  // The styles available for a family, ordered for display. Always includes
  // Regular so the "no explicit style" default has a home.
  getStyles(family: string): string[] {
    const bundled = BUNDLED_FACES[family];

    if (bundled != null) {
      return bundled.map((face) => face.style).sort(compareFontStyles);
    }

    const system = this.systemFaces.get(family);

    if (system != null) {
      return listFontStyles(system);
    }

    return [DEFAULT_FONT_STYLE];
  }

  // The per-face FontData of a system family, used by the stylistic-set
  // inspection to read the face's bytes (FontData.blob()). Prefers the face
  // whose style axes match, then the family's Regular face, then the first
  // face.
  getSystemFaceData(family: string, fontStyle: string | null): FontData | null {
    const faces = this.systemFaces.get(family);

    if (faces == null) {
      return null;
    }

    return selectFontFaceByStyle(faces, fontStyle) ?? null;
  }

  // Split a face name ("Minion Pro Semibold") into its family and style, using
  // the known families. Falls back to a heuristic for fonts that are neither
  // bundled nor installed (e.g. legacy files opened on another machine).
  splitFace(face: string): { family: string; style: string } {
    const trimmed = normalizeName(face);

    if (trimmed === '') {
      return { family: '', style: DEFAULT_FONT_STYLE };
    }

    if (BUNDLED_FACES[trimmed] != null || this.systemFaces.has(trimmed)) {
      return { family: trimmed, style: DEFAULT_FONT_STYLE };
    }

    // Prefer the longest known family that is a prefix of the face name.
    let best: { family: string; style: string } | null = null;

    const families = [
      ...Object.keys(BUNDLED_FACES),
      ...this.systemFaces.keys(),
    ];

    for (const family of families) {
      if (
        trimmed.startsWith(`${family} `) &&
        (best == null || family.length > best.family.length)
      ) {
        best = {
          family,
          style: normalizeDocumentFontStyle(trimmed.slice(family.length + 1)),
        };
      }
    }

    return best ?? heuristicSplitFace(trimmed);
  }

  // The bundled face a (family, normalized style) selection matches, or null
  // when the family is not bundled.
  private matchBundledFace(family: string, style: string): BundledFace | null {
    const bundled = BUNDLED_FACES[family];

    return bundled != null
      ? (selectFontFaceByStyle(bundled, style) ?? null)
      : null;
  }

  // The bundled font file backing a (family, style) selection, or null when
  // it does not resolve to a bundled face with a file name. Keys the
  // alternates inspection's build-time artifact.
  getBundledFaceFileName(
    family: string,
    fontStyle: string | null,
  ): string | null {
    return (
      this.matchBundledFace(family, normalizeDocumentFontStyle(fontStyle))
        ?.fileName ?? null
    );
  }

  resolveFace(
    family: string,
    fontStyle: string | null | undefined,
  ): ResolvedFace {
    const style =
      fontStyle != null && fontStyle.trim() !== ''
        ? normalizeDocumentFontStyle(fontStyle)
        : DEFAULT_FONT_STYLE;

    const face = this.matchBundledFace(family, style);

    if (face != null) {
      return {
        cssFamily: face.cssFamily ?? family,
        cssFontWeight: face.cssFontWeight,
        cssFontStyle: face.cssFontStyle,
      };
    }

    return {
      cssFamily: this.resolveSystemCssFamily(family, style),
      cssFontWeight: cssFontWeight(style),
      cssFontStyle: parseStyleAxes(style).italic ? 'italic' : undefined,
    };
  }

  getRegisteredFontFaceCss(): string {
    return [...this.registeredFaceRules.values()].join('');
  }

  // Serialized exports include bundled families and exact-face aliases whose
  // @font-face rules were already exposed by the pre-alternates exporter. Base
  // system families stay out of exported CSS unless they become exact aliases.
  getExportFontFeatureValuesCss(): string {
    return this.createFontFeatureValuesCss([
      ...BUNDLED_CSS_FAMILIES,
      ...this.registeredFaceRules.keys(),
    ]);
  }

  private getEditorFontFeatureValuesCss(): string {
    return this.createFontFeatureValuesCss([
      ...BUNDLED_CSS_FAMILIES,
      ...this.systemFaces.keys(),
      ...this.registeredFaceRules.keys(),
    ]);
  }

  private createFontFeatureValuesCss(families: Iterable<string>): string {
    return fontFeatureValuesCss(
      [...new Set(families)].filter(
        (family) => !isNeumeFontFeatureValuesFamily(family),
      ),
    );
  }

  private refreshFontFeatureValuesStyle(): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.featureValuesStyleElement ??= getOrCreateStyleElement(
      FONT_FEATURE_VALUES_STYLE_ID,
    );
    this.featureValuesStyleElement.textContent =
      this.getEditorFontFeatureValuesCss();
  }

  // The CSS family for a system (or unknown) family and style. Chromium can
  // lose resolved font-variant-alternates features when it selects an
  // installed face through the base family, so every enumerated face routes
  // through an exact local() @font-face alias; besides selecting optical
  // styles such as Caption, this keeps those features attached to ordinary
  // Regular/Bold/Italic system faces.
  private resolveSystemCssFamily(family: string, style: string): string {
    const key = `${family}\0${style}`;
    const memoized = this.resolvedSystemFaces.get(key);

    if (memoized != null) {
      return memoized;
    }

    const { face, canonicalStyle, needsFaceAlias } = resolveSystemFontFace(
      this.systemFaces.get(family) ?? [],
      style,
    );

    if (!needsFaceAlias) {
      this.resolvedSystemFaces.set(key, family);
      return family;
    }

    const cssFamily = `${family} ${canonicalStyle}`;
    let rule = this.registeredFaceRules.get(cssFamily);

    if (rule == null) {
      rule = createSystemFontFaceRule(cssFamily, canonicalStyle, face);
      this.registeredFaceRules.set(cssFamily, rule);

      // The new exact-face family also needs the styleset ident mapping.
      this.refreshFontFeatureValuesStyle();
    }

    if (!this.injectedFaces.has(cssFamily) && typeof document !== 'undefined') {
      this.injectedFaces.add(cssFamily);
      this.ensureStyleElement().appendChild(document.createTextNode(rule));
    }

    this.resolvedSystemFaces.set(key, cssFamily);
    return cssFamily;
  }

  private ensureStyleElement(): HTMLStyleElement {
    return (this.styleElement ??= getOrCreateStyleElement(FONT_FACE_STYLE_ID));
  }
}

// Claim the app-managed <style> element with the given id, creating and
// appending it on first use.
function getOrCreateStyleElement(id: string): HTMLStyleElement {
  const existing = document.getElementById(id);

  if (existing instanceof HTMLStyleElement) {
    return existing;
  }

  const element = document.createElement('style');
  element.id = id;
  document.head.appendChild(element);
  return element;
}

export const fontCatalog = new FontCatalog();
