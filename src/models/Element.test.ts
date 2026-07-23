import { describe, expect, it } from 'vitest';

import { DropCapElement, NoteElement, TextBoxElement } from './Element';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  ParagraphStyle,
  type ParagraphStyleOverrides,
  resolveParagraphStyle,
} from './ParagraphStyle';

function createStyle(id: string, overrides: ParagraphStyleOverrides) {
  return Object.assign(new ParagraphStyle(), { id, overrides });
}

function resolveElementStyle(
  styles: ParagraphStyle[],
  styleId: string,
  element: NoteElement | TextBoxElement | DropCapElement,
) {
  return resolveParagraphStyle(
    styles,
    styleId,
    element.getParagraphStyleOverrides(),
  );
}

describe('Element clipboard and paragraph-style overrides', () => {
  it('keeps lyric underline state in clipboard data and paragraph-style overrides', () => {
    const note = new NoteElement();
    note.lyricsParagraphStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics;
    note.lyricsTextDecoration = 'underline';

    const styles = [
      createStyle(BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics, {
        textDecoration: 'underline',
      }),
    ];

    expect(note.getClipboardProperties(true)).toMatchObject({
      lyricsTextDecoration: 'underline',
    });
    expect(
      resolveElementStyle(styles, note.lyricsParagraphStyleId, note)
        .textDecoration,
    ).toBe('underline');

    note.lyricsTextDecoration = 'none';

    expect(
      resolveElementStyle(styles, note.lyricsParagraphStyleId, note)
        .textDecoration,
    ).toBeNull();
  });

  it('keeps text-box line height in clipboard data and explicit underline clears in overrides', () => {
    const textBox = new TextBoxElement();
    textBox.lineHeight = 1.5;
    textBox.underline = false;

    expect(textBox.getClipboardProperties()).toMatchObject({
      lineHeight: 1.5,
      underline: false,
    });
    expect(
      resolveElementStyle(
        [
          createStyle(BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText, {
            textDecoration: 'underline',
          }),
        ],
        textBox.paragraphStyleId,
        textBox,
      ).textDecoration,
    ).toBeNull();

    textBox.underline = true;

    expect(
      resolveElementStyle(
        [
          createStyle(BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText, {
            textDecoration: null,
          }),
        ],
        textBox.paragraphStyleId,
        textBox,
      ).textDecoration,
    ).toBe('underline');
  });

  it.each([
    {
      label: 'text-box',
      createElement: () => new TextBoxElement(),
      styleId: BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    },
    {
      label: 'drop-cap',
      createElement: () => new DropCapElement(),
      styleId: BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
    },
  ])(
    'keeps $label font variants in clipboard data and maps them to overrides',
    ({ createElement, styleId }) => {
      const element = createElement();
      element.fontVariantCaps = 'all-small-caps';
      element.fontVariantNumeric = 'normal';
      element.fontVariantLigatures = null;
      element.fontVariantAlternates = 'historical-forms';

      expect(element.getClipboardProperties()).toMatchObject({
        fontVariantCaps: 'all-small-caps',
        fontVariantNumeric: 'normal',
        fontVariantLigatures: null,
        fontVariantAlternates: 'historical-forms',
      });

      const styles = [
        createStyle(styleId, {
          fontVariantCaps: 'small-caps',
          fontVariantNumeric: 'oldstyle-nums',
          fontVariantLigatures: 'discretionary-ligatures',
        }),
      ];
      const resolved = resolveElementStyle(
        styles,
        element.paragraphStyleId,
        element,
      );

      expect(resolved.fontVariantCaps).toBe('all-small-caps');
      // An element-level 'normal' is an explicit reset of the style value.
      expect(resolved.fontVariantNumeric).toBeNull();
      // A null element value inherits the style value.
      expect(resolved.fontVariantLigatures).toBe('discretionary-ligatures');
      expect(resolved.fontVariantAlternates).toBe('historical-forms');
    },
  );

  it('keeps lyric font variants in clipboard data and maps them to overrides', () => {
    const note = new NoteElement();
    note.lyricsFontVariantCaps = 'all-small-caps';
    note.lyricsFontVariantNumeric = 'normal';
    note.lyricsFontVariantLigatures = null;
    note.lyricsFontVariantAlternates = 'normal';

    expect(note.getClipboardProperties(true)).toMatchObject({
      lyricsFontVariantCaps: 'all-small-caps',
      lyricsFontVariantNumeric: 'normal',
      lyricsFontVariantLigatures: null,
      lyricsFontVariantAlternates: 'normal',
    });
    expect(note.cloneFormat()).toMatchObject({
      lyricsFontVariantCaps: 'all-small-caps',
      lyricsFontVariantNumeric: 'normal',
      lyricsFontVariantLigatures: null,
      lyricsFontVariantAlternates: 'normal',
    });

    const styles = [
      createStyle(BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics, {
        fontVariantCaps: 'small-caps',
        fontVariantNumeric: 'oldstyle-nums',
        fontVariantLigatures: 'discretionary-ligatures',
        fontVariantAlternates: 'historical-forms',
      }),
    ];
    const resolved = resolveElementStyle(
      styles,
      note.lyricsParagraphStyleId,
      note,
    );

    expect(resolved.fontVariantCaps).toBe('all-small-caps');
    // A per-note 'normal' is an explicit reset of the style value.
    expect(resolved.fontVariantNumeric).toBeNull();
    // A null per-note value inherits the style value.
    expect(resolved.fontVariantLigatures).toBe('discretionary-ligatures');
    expect(resolved.fontVariantAlternates).toBeNull();
  });

  it.each([
    {
      label: 'text-box',
      createElement: () => new TextBoxElement(),
      styleId: BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    },
    {
      label: 'drop-cap',
      createElement: () => new DropCapElement(),
      styleId: BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
    },
  ])(
    'preserves inherited, explicit normal, and numeric $label line height overrides',
    ({ createElement, styleId }) => {
      const styles = [createStyle(styleId, { lineHeight: 1.7 })];
      const element = createElement();

      element.lineHeight = undefined;

      expect(
        resolveElementStyle(styles, element.paragraphStyleId, element)
          .lineHeight,
      ).toBe(1.7);

      element.lineHeight = null;

      expect(element.getClipboardProperties()).toMatchObject({
        lineHeight: null,
      });
      expect(
        resolveElementStyle(styles, element.paragraphStyleId, element)
          .lineHeight,
      ).toBeNull();

      element.lineHeight = 2.25;

      expect(
        resolveElementStyle(styles, element.paragraphStyleId, element)
          .lineHeight,
      ).toBe(2.25);
    },
  );
});
