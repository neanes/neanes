import { isDeepStrictEqual } from 'node:util';

import { describe, expect, it } from 'vitest';

import type { FontAlternates } from './FontAlternatesService';
import {
  EMPTY_FONT_ALTERNATES,
  readFontAlternates,
} from './FontAlternatesService';
import { fontCatalog } from './FontCatalog';
import { loadBundledFont } from './loadBundledFont.testHelper';

// These tests parse the real bundled fonts, so they also pin down the sets
// the alternates UI offers for them.
describe('FontAlternatesService', () => {
  it('reads named stylistic sets from Old Standard', async () => {
    const { stylisticSets } = readFontAlternates(
      await loadBundledFont('OldStandard-Regular.otf'),
    );

    expect(stylisticSets).toEqual([
      { number: 1, name: 'Localized Forms for Romanian' },
      { number: 2, name: 'Insular Forms for Old English' },
      { number: 5, name: 'Closed Greek Theta' },
      { number: 6, name: 'Medial/Final Forms for Greek' },
      { number: 12, name: 'Optional Serbian Variant Forms' },
      { number: 14, name: 'Localized Forms for Old Slavonic' },
      { number: 15, name: 'Old Cyrillic I and N' },
    ]);
  });

  it('reads the per-face set list, not a family-wide one', async () => {
    const { stylisticSets } = readFontAlternates(
      await loadBundledFont('OldStandard-Italic.otf'),
    );
    const numbers = stylisticSets.map((set) => set.number);

    // The italic face has ss11 and lacks ss15, unlike the regular face.
    expect(numbers).toContain(11);
    expect(numbers).not.toContain(15);
  });

  it('reads character variants and the stylistic-alternates flag from Old Standard', async () => {
    const { characterVariants, hasStylistic, hasSwash } = readFontAlternates(
      await loadBundledFont('OldStandard-Regular.otf'),
    );

    // Old Standard's cv01 carries no featureParams, so it has no name and
    // the UI falls back to a generic numbered label.
    expect(characterVariants).toEqual([{ number: 1, name: null }]);
    expect(hasStylistic).toBe(true);
    expect(hasSwash).toBe(false);
  });

  it('reads unnamed stylistic sets and the empty variant axes from Source Serif', async () => {
    const alternates = readFontAlternates(
      await loadBundledFont('SourceSerif4-It.otf'),
    );

    // The italic face has ss01-ss03; ss03 carries no featureParams.
    expect(alternates.stylisticSets.map((set) => set.number)).toEqual([
      1, 2, 3,
    ]);
    expect(alternates.stylisticSets[2]).toEqual({ number: 3, name: null });
    expect(alternates.characterVariants).toEqual([]);
    expect(alternates.hasStylistic).toBe(false);
  });

  it('reads the historical-forms flag from GFS Didot', async () => {
    expect(readFontAlternates(await loadBundledFont('GFSDidot.otf'))).toEqual({
      ...EMPTY_FONT_ALTERNATES,
      hasHistoricalForms: true,
    });
  });

  it('reads the empty capability from a font without alternates', async () => {
    expect(
      readFontAlternates(await loadBundledFont('NotoNaskhArabic-Regular.otf')),
    ).toEqual(EMPTY_FONT_ALTERNATES);
  });

  // bundled-font-alternates.generated.json is the precomputed artifact that
  // getFontAlternates serves bundled faces from. This test recomputes it from
  // the real font files, so it fails when a bundled font changes or a face
  // stops mapping to a file on disk. Regenerate the artifact with
  //   npx vitest run src/services/FontAlternatesService.test.ts -u
  it('keeps the bundled font alternates artifact in sync', async () => {
    const fileNames = new Set<string>();

    for (const family of fontCatalog.bundledTextFamilies()) {
      const unmappedStyles: string[] = [];

      for (const style of fontCatalog.getStyles(family)) {
        const fileName = fontCatalog.getBundledFaceFileName(family, style);

        if (fileName != null) {
          fileNames.add(fileName);
        } else {
          unmappedStyles.push(style);
        }
      }

      // Every bundled text face must map to a font file. Assert this even when
      // a family has lost all its mappings, since an empty artifact entry would
      // otherwise let that case pass silently.
      expect(unmappedStyles, family).toEqual([]);
    }

    const artifact: Record<string, FontAlternates> = {};

    for (const fileName of [...fileNames].sort()) {
      const alternates = readFontAlternates(await loadBundledFont(fileName));

      if (!isDeepStrictEqual(alternates, EMPTY_FONT_ALTERNATES)) {
        artifact[fileName] = alternates;
      }
    }

    await expect(JSON.stringify(artifact, null, 2) + '\n').toMatchFileSnapshot(
      '../assets/fonts/bundled-font-alternates.generated.json',
    );
  });
});
