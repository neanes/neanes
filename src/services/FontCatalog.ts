import { DEFAULT_FONT_STYLE, NEUME_FONT_FAMILIES } from '@/utils/fontConstants';
import {
  compareFontStyles,
  cssFontWeight,
  hasNonWeightStyleToken,
  isRegularStyle,
  matchStyle,
  normalizeDocumentFontStyle,
  parseStyleAxes,
} from '@/utils/fontStyleAxes';
import { isElectron } from '@/utils/isElectron';

// The CSS needed to render a (family, style) selection.
//   - bundled fonts express weight/slant styles via font-weight/font-style on
//     the same family (their @font-face rules live in App.vue, plus Source
//     Serif's expanded set in src/assets/fonts/source-serif.css). Source Serif
//     optical styles resolve to distinct bundled CSS families such as
//     "Source Serif Caption".
//   - system fonts use the base family plus browser-native weight/style when
//     the style is just weight/slant, and a conventional face name when it
//     contains non-weight tokens like Caption/Display.
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
}

const FONT_FACE_STYLE_ID = 'neanes-font-faces';

// Bundled families, in the order the pickers present them. These ship with the
// app as @font-face rules in App.vue and are available in both web and Electron.
const BUNDLED_FAMILIES = [
  'Source Serif',
  'GFS Didot',
  'Noto Naskh Arabic',
  'Old Standard',
  'Neanes',
  'NeanesStathisSeries',
];

// The standard four-face set shared by our bundled text families, matching the
// font-weight/font-style descriptors of their @font-face rules.
const TEXT_FACES: BundledFace[] = [
  { style: DEFAULT_FONT_STYLE },
  { style: 'Bold', cssFontWeight: 'bold' },
  { style: 'Italic', cssFontStyle: 'italic' },
  { style: 'Bold Italic', cssFontWeight: 'bold', cssFontStyle: 'italic' },
];

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
  return [
    ...SOURCE_SERIF_BASE_FACES,
    ...SOURCE_SERIF_OPTICAL_FAMILIES.flatMap(({ style, cssFamily }) =>
      SOURCE_SERIF_BASE_FACES.map((face) => ({
        ...face,
        cssFamily,
        style:
          face.style === DEFAULT_FONT_STYLE ? style : `${style} ${face.style}`,
      })),
    ),
  ];
}

const BUNDLED_FACES: Record<string, BundledFace[]> = {
  'Source Serif': sourceSerifFaces(),
  'GFS Didot': TEXT_FACES,
  'Old Standard': TEXT_FACES,
  'Noto Naskh Arabic': [
    { style: DEFAULT_FONT_STYLE },
    { style: 'Bold', cssFontWeight: 'bold' },
  ],
  Neanes: [{ style: DEFAULT_FONT_STYLE }],
  NeanesStathisSeries: [{ style: DEFAULT_FONT_STYLE }],
};

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

// Escape a font name for use inside a double-quoted CSS string.
function escapeFontName(name: string): string {
  return name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
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

class FontCatalog {
  private loaded = false;
  private loadingPromise: Promise<void> | null = null;
  private systemFaces = new Map<string, FontData[]>();
  private registeredFaceRules = new Map<string, string>();
  private injectedFaces = new Set<string>();
  private styleElement: HTMLStyleElement | null = null;

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
      return;
    }

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
      this.loaded = true;
    } catch (error) {
      // Leave `loaded` false so a later (e.g. post-activation) init can retry.
      console.error('Failed to query local fonts', error);
    }
  }

  bundledFamilies(): string[] {
    return [...BUNDLED_FAMILIES];
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
    return [...this.systemFaces.keys()]
      .filter((family) => BUNDLED_FACES[family] == null)
      .sort((a, b) => a.localeCompare(b));
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
      const styles = [
        ...new Set(
          system.map((font) => normalizeDocumentFontStyle(font.style)),
        ),
      ].sort(compareFontStyles);

      if (!styles.some((style) => isRegularStyle(style))) {
        styles.unshift(DEFAULT_FONT_STYLE);
      }

      return styles;
    }

    return [DEFAULT_FONT_STYLE];
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

  resolveFace(
    family: string,
    fontStyle: string | null | undefined,
  ): ResolvedFace {
    const style =
      fontStyle != null && fontStyle.trim() !== ''
        ? normalizeDocumentFontStyle(fontStyle)
        : DEFAULT_FONT_STYLE;

    const bundled = BUNDLED_FACES[family];

    if (bundled != null) {
      const matchedStyle = matchStyle(
        style,
        bundled.map((candidate) => candidate.style),
      );
      const face =
        bundled.find((candidate) => candidate.style === matchedStyle) ??
        bundled.find((candidate) => candidate.style === DEFAULT_FONT_STYLE) ??
        bundled[0];

      return {
        cssFamily: face.cssFamily ?? family,
        cssFontWeight: face.cssFontWeight,
        cssFontStyle: face.cssFontStyle,
      };
    }

    // System or unknown family.
    if (isRegularStyle(style)) {
      return { cssFamily: family };
    }

    const cssFamily = hasNonWeightStyleToken(style)
      ? `${family} ${style}`
      : family;

    if (cssFamily !== family) {
      this.registerSystemFace(family, style, cssFamily);
    }

    return {
      cssFamily,
      cssFontWeight: cssFontWeight(style),
      cssFontStyle: parseStyleAxes(style).italic ? 'italic' : undefined,
    };
  }

  getRegisteredFontFaceCss(): string {
    return [...this.registeredFaceRules.values()].join('');
  }

  // Register an @font-face only when CSS weight/style cannot identify the
  // style by itself (for example Caption or Display instances).
  private registerSystemFace(
    family: string,
    style: string,
    cssFamily: string,
  ): void {
    let rule = this.registeredFaceRules.get(cssFamily);

    if (rule == null) {
      const data = this.systemFaces
        .get(family)
        ?.find((font) => normalizeDocumentFontStyle(font.style) === style);

      const sources: string[] = [];

      if (data?.postscriptName) {
        sources.push(`local("${escapeFontName(data.postscriptName)}")`);
      }

      if (data?.fullName) {
        sources.push(`local("${escapeFontName(data.fullName)}")`);
      }

      sources.push(`local("${escapeFontName(cssFamily)}")`);

      rule = `@font-face { font-family: "${escapeFontName(
        cssFamily,
      )}"; src: ${sources.join(', ')}; font-weight: ${
        cssFontWeight(style) ?? '400'
      }; font-style: ${
        parseStyleAxes(style).italic ? 'italic' : 'normal'
      }; }\n`;
      this.registeredFaceRules.set(cssFamily, rule);
    }

    if (this.injectedFaces.has(cssFamily) || typeof document === 'undefined') {
      return;
    }

    this.injectedFaces.add(cssFamily);
    this.ensureStyleElement().appendChild(document.createTextNode(rule));
  }

  private ensureStyleElement(): HTMLStyleElement {
    if (this.styleElement == null) {
      const existing = document.getElementById(FONT_FACE_STYLE_ID);

      if (existing instanceof HTMLStyleElement) {
        this.styleElement = existing;
      } else {
        const element = document.createElement('style');
        element.id = FONT_FACE_STYLE_ID;
        document.head.appendChild(element);
        this.styleElement = element;
      }
    }

    return this.styleElement;
  }
}

export const fontCatalog = new FontCatalog();
