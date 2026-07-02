import { describe, expect, it } from 'vitest';

import { DropCapElement, NoteElement, TextBoxElement } from './Element';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  ParagraphStyle,
  resolveParagraphStyle,
} from './ParagraphStyle';

describe('Element clipboard and paragraph-style overrides', () => {
  it('keeps lyric underline state in clipboard data and paragraph-style overrides', () => {
    const note = new NoteElement();
    note.lyricsParagraphStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics;
    note.lyricsTextDecoration = 'underline';

    expect(note.getClipboardProperties(true)).toMatchObject({
      lyricsTextDecoration: 'underline',
    });
    expect(
      resolveParagraphStyle(
        [
          Object.assign(new ParagraphStyle(), {
            id: BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
            overrides: { textDecoration: 'underline' as const },
          }),
        ],
        note.lyricsParagraphStyleId,
        note.getParagraphStyleOverrides(),
      ).textDecoration,
    ).toBe('underline');

    note.lyricsTextDecoration = 'none';

    expect(
      resolveParagraphStyle(
        [
          Object.assign(new ParagraphStyle(), {
            id: BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
            overrides: { textDecoration: 'underline' as const },
          }),
        ],
        note.lyricsParagraphStyleId,
        note.getParagraphStyleOverrides(),
      ).textDecoration,
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
      resolveParagraphStyle(
        [
          Object.assign(new ParagraphStyle(), {
            id: BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
            overrides: { textDecoration: 'underline' as const },
          }),
        ],
        textBox.paragraphStyleId,
        textBox.getParagraphStyleOverrides(),
      ).textDecoration,
    ).toBeNull();

    textBox.underline = true;

    expect(
      resolveParagraphStyle(
        [
          Object.assign(new ParagraphStyle(), {
            id: BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
            overrides: { textDecoration: null },
          }),
        ],
        textBox.paragraphStyleId,
        textBox.getParagraphStyleOverrides(),
      ).textDecoration,
    ).toBe('underline');
  });

  it('preserves inherited, explicit normal, and numeric text-box line height overrides', () => {
    const paragraphStyles = [
      Object.assign(new ParagraphStyle(), {
        id: BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
        overrides: { lineHeight: 1.7 },
      }),
    ];
    const textBox = new TextBoxElement();

    textBox.lineHeight = undefined;

    expect(
      resolveParagraphStyle(
        paragraphStyles,
        textBox.paragraphStyleId,
        textBox.getParagraphStyleOverrides(),
      ).lineHeight,
    ).toBe(1.7);

    textBox.lineHeight = null;

    expect(textBox.getClipboardProperties()).toMatchObject({
      lineHeight: null,
    });
    expect(
      resolveParagraphStyle(
        paragraphStyles,
        textBox.paragraphStyleId,
        textBox.getParagraphStyleOverrides(),
      ).lineHeight,
    ).toBeNull();

    textBox.lineHeight = 2.25;

    expect(
      resolveParagraphStyle(
        paragraphStyles,
        textBox.paragraphStyleId,
        textBox.getParagraphStyleOverrides(),
      ).lineHeight,
    ).toBe(2.25);
  });

  it('preserves inherited, explicit normal, and numeric drop-cap line height overrides', () => {
    const paragraphStyles = [
      Object.assign(new ParagraphStyle(), {
        id: BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
        overrides: { lineHeight: 1.7 },
      }),
    ];
    const dropCap = new DropCapElement();

    dropCap.lineHeight = undefined;

    expect(
      resolveParagraphStyle(
        paragraphStyles,
        dropCap.paragraphStyleId,
        dropCap.getParagraphStyleOverrides(),
      ).lineHeight,
    ).toBe(1.7);

    dropCap.lineHeight = null;

    expect(dropCap.getClipboardProperties()).toMatchObject({
      lineHeight: null,
    });
    expect(
      resolveParagraphStyle(
        paragraphStyles,
        dropCap.paragraphStyleId,
        dropCap.getParagraphStyleOverrides(),
      ).lineHeight,
    ).toBeNull();

    dropCap.lineHeight = 2.25;

    expect(
      resolveParagraphStyle(
        paragraphStyles,
        dropCap.paragraphStyleId,
        dropCap.getParagraphStyleOverrides(),
      ).lineHeight,
    ).toBe(2.25);
  });
});
