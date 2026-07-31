import bundledFonts from '@/assets/fonts/bundled-fonts.generated.json';
import type { FontAlternates } from '@/services/FontAlternatesService';

// What the app reads out of the bundled font binaries, so that nothing has to
// parse a font file at runtime: the PostScript name of every face, and the
// alternate-glyph features it has. The artifact is generated from the real
// fonts by the drift-guard test in FontAlternatesService.test.ts, which derives
// its key set from the catalog's own file names; regenerate it with
//   npx vitest run src/services/FontAlternatesService.test.ts -u
// after changing a bundled font.
export interface BundledFontEntry {
  postscriptName: string;
  alternates: FontAlternates;
}

const BUNDLED_FONTS: Record<string, BundledFontEntry> = bundledFonts;

// Look up a face by the file name the catalog maps it to. Every file name the
// catalog knows has an entry, because the artifact is generated from that same
// mapping, so a miss means the artifact is stale rather than that this face has
// nothing to report -- say so instead of degrading silently.
export function bundledFontEntry(fileName: string): BundledFontEntry {
  const entry = BUNDLED_FONTS[fileName];

  if (entry == null) {
    throw new Error(
      `${fileName} is missing from bundled-fonts.generated.json. Regenerate it with: npx vitest run src/services/FontAlternatesService.test.ts -u`,
    );
  }

  return entry;
}
