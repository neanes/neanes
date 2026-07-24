import type { Font } from 'lib-font';

import bundledFontAlternates from '@/assets/fonts/bundled-font-alternates.generated.json';
import { fontCatalog } from '@/services/FontCatalog';
import {
  parseCharacterVariantTag,
  parseStylisticSetTag,
} from '@/utils/fontVariants';

// Reads which alternate-glyph features a font face actually has, by parsing
// the face's GSUB table with lib-font: the stylistic sets (OpenType
// ss01-ss20) and character variants (cv01-cv99) with the names the font
// gives them, and whether the face has the features behind the
// single-alternate notations (swash, stylistic alternates, ornaments,
// annotation forms) and the plain historical-forms keyword (hist).
// Bundled faces are fixed, so their alternates are precomputed into
// bundled-font-alternates.generated.json and drift-guarded by
// FontAlternatesService.test.ts. Only system faces are parsed at runtime,
// from the Local Font Access FontData bytes. The results feed the alternates
// controls: the stored document value only ever contains raw feature tags
// and alternate indices (see fontVariants.ts), so nothing read here is ever
// persisted.

// A numbered feature the face advertises, with the font's own UI label for it
// or null when the font does not provide one.
export interface NamedFeature {
  number: number;
  name: string | null;
}

export interface FontAlternates {
  // The stylistic sets, labeled from GSUB featureParams UINameID.
  stylisticSets: NamedFeature[];
  // The character variants, labeled from GSUB featureParams
  // featUiLabelNameId.
  characterVariants: NamedFeature[];
  // Whether the face has a swash feature (swsh or cswh; the CSS swash()
  // notation activates both).
  hasSwash: boolean;
  // Whether the face has a stylistic-alternates (salt) feature, which the
  // CSS stylistic() notation activates.
  hasStylistic: boolean;
  // Whether the face has an ornaments (ornm) feature, which the CSS
  // ornaments() notation activates.
  hasOrnaments: boolean;
  // Whether the face has an alternate-annotation-forms (nalt) feature,
  // which the CSS annotation() notation activates.
  hasAnnotation: boolean;
  // Whether the face has a historical-forms (hist) feature, which the plain
  // CSS historical-forms keyword activates.
  hasHistoricalForms: boolean;
}

export const EMPTY_FONT_ALTERNATES: FontAlternates = {
  stylisticSets: [],
  characterVariants: [],
  hasSwash: false,
  hasStylistic: false,
  hasOrnaments: false,
  hasAnnotation: false,
  hasHistoricalForms: false,
};

// The precomputed alternates of the bundled text faces, keyed by font file
// name. Only faces with at least one alternate feature have an entry. The
// artifact is generated from the real font files by the drift-guard test in
// FontAlternatesService.test.ts; regenerate it with vitest -u after
// changing a bundled font.
const BUNDLED_ALTERNATES: Record<string, FontAlternates> =
  bundledFontAlternates;

// The plain-switch features, by the GSUB feature tag that turns each one on.
// The CSS swash() notation activates both swash features, so either tag
// answers for it.
export type FontAlternatesSwitch =
  | 'hasSwash'
  | 'hasStylistic'
  | 'hasOrnaments'
  | 'hasAnnotation'
  | 'hasHistoricalForms';

const FEATURE_TAG_SWITCHES: Record<string, FontAlternatesSwitch> = {
  swsh: 'hasSwash',
  cswh: 'hasSwash',
  salt: 'hasStylistic',
  ornm: 'hasOrnaments',
  nalt: 'hasAnnotation',
  hist: 'hasHistoricalForms',
};

const UNICODE_PLATFORM_ID = 0;
const WINDOWS_PLATFORM_ID = 3;
const WINDOWS_ENGLISH_US_LANGUAGE_ID = 0x0409;

// Collect the alternate features a parsed font advertises, across every
// script and language system, with the sets' and variants' UI names when the
// font provides them.
export function readFontAlternates(font: Font): FontAlternates {
  const { GSUB, name } = font.opentype.tables;

  if (GSUB == null) {
    return EMPTY_FONT_ALTERNATES;
  }

  const sets = new Map<number, string | null>();
  const characterVariants = new Map<number, string | null>();
  const switches = {
    hasSwash: false,
    hasStylistic: false,
    hasOrnaments: false,
    hasAnnotation: false,
    hasHistoricalForms: false,
  };

  // Fonts carry featureParams names in many languages, and name.get()
  // returns whichever record sorts first (for Source Serif that is
  // Bulgarian, since Windows language IDs order it before en-US), so prefer
  // an English record. Unicode- and Windows-platform records are UTF-16,
  // which lib-font has already decoded; other platforms fall back to
  // name.get()'s platform-specific decoding.
  const featureName = (nameId: number | undefined) => {
    if (!nameId) {
      return null;
    }

    const records = name.nameRecords.filter(
      (record) => record.nameID === nameId,
    );

    const english =
      records.find(
        (record) =>
          record.platformID === WINDOWS_PLATFORM_ID &&
          record.languageID === WINDOWS_ENGLISH_US_LANGUAGE_ID,
      ) ?? records.find((record) => record.platformID === UNICODE_PLATFORM_ID);

    return english?.string ?? name.get(nameId) ?? null;
  };

  for (const scriptTag of GSUB.getSupportedScripts()) {
    const scriptTable = GSUB.getScriptTable(scriptTag);

    for (const langSysTag of GSUB.getSupportedLangSys(scriptTable)) {
      const langSysTable = GSUB.getLangSysTable(scriptTable, langSysTag);

      if (langSysTable == null) {
        continue;
      }

      for (const feature of GSUB.getFeatures(langSysTable)) {
        if (feature == null) {
          continue;
        }

        const featureSwitch = FEATURE_TAG_SWITCHES[feature.featureTag];

        if (featureSwitch != null) {
          switches[featureSwitch] = true;
          continue;
        }

        const set = parseStylisticSetTag(feature.featureTag);

        if (set != null) {
          if (!sets.has(set)) {
            sets.set(set, featureName(feature.getFeatureParams()?.UINameID));
          }

          continue;
        }

        const variant = parseCharacterVariantTag(feature.featureTag);

        if (variant != null && !characterVariants.has(variant)) {
          characterVariants.set(
            variant,
            featureName(feature.getFeatureParams()?.featUiLabelNameId),
          );
        }
      }
    }
  }

  const byNumber = (entries: Map<number, string | null>) =>
    [...entries.entries()]
      .sort(([a], [b]) => a - b)
      .map(([number, featureLabel]) => ({ number, name: featureLabel }));

  return {
    stylisticSets: byNumber(sets),
    characterVariants: byNumber(characterVariants),
    ...switches,
  };
}

async function readSystemFaceAlternates(
  data: FontData,
  sourceName: string,
): Promise<FontAlternates> {
  // lib-font is only needed for system faces (never on web, where the
  // bundled artifact serves everything), so load it on demand instead of in
  // the startup bundle, alongside the (independent) face bytes. lib-font does
  // not support TTC/OTC containers; those faces intentionally resolve to the
  // empty capability through the caller's parse-error path.
  const [{ Font }, blob] = await Promise.all([import('lib-font'), data.blob()]);
  const font = new Font(sourceName, { skipStyleSheet: true });

  await font.fromDataBuffer(await blob.arrayBuffer(), sourceName);

  return readFontAlternates(font);
}

// Parsed system faces, keyed by face name. Bundled faces never enter it:
// they answer from the build-time artifact.
const systemFaceCache = new Map<string, Promise<FontAlternates>>();

// The alternate features of the face that (fontFamily, fontStyle) resolves
// to. Bundled faces come from the build-time artifact; system faces read
// their bytes from the Local Font Access FontData. Unknown faces have
// nothing readable and resolve to the empty capability.
export function getFontAlternates(
  fontFamily: string,
  fontStyle: string | null,
): Promise<FontAlternates> {
  const fileName = fontCatalog.getBundledFaceFileName(fontFamily, fontStyle);

  if (fileName != null) {
    return Promise.resolve(
      BUNDLED_ALTERNATES[fileName] ?? EMPTY_FONT_ALTERNATES,
    );
  }

  // Bundled neume faces intentionally have no alternates artifact. Do not
  // fall through to an identically named local installation: its salt feature
  // is notation plumbing, not a usable text alternate.
  if (fontCatalog.isBundledFamily(fontFamily)) {
    return Promise.resolve(EMPTY_FONT_ALTERNATES);
  }

  const data = fontCatalog.getSystemFaceData(fontFamily, fontStyle);

  if (data == null) {
    return Promise.resolve(EMPTY_FONT_ALTERNATES);
  }

  const sourceName =
    data.postscriptName || data.fullName || `${data.family} ${data.style}`;

  let entry = systemFaceCache.get(sourceName);

  if (entry == null) {
    entry = readSystemFaceAlternates(data, sourceName).catch((error) => {
      console.error(error);
      return EMPTY_FONT_ALTERNATES;
    });

    systemFaceCache.set(sourceName, entry);
  }

  return entry;
}
