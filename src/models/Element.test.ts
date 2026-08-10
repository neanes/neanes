import { describe, expect, it } from 'vitest';

import {
  canKeepWithNext,
  DropCapElement,
  EmptyElement,
  ImageBoxElement,
  isAutomaticBreakProhibited,
  LineBreakType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  supportsKeepWithNext,
  TempoElement,
  TextBoxElement,
} from './Element';
import { Tie, VocalExpressionNeume } from './Neumes';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  ParagraphStyle,
  type ParagraphStyleOverrides,
  resolveParagraphStyle,
} from './ParagraphStyle';

describe('canKeepWithNext', () => {
  it('allows an optional break after notes', () => {
    expect(canKeepWithNext(new NoteElement(), new NoteElement())).toBe(true);
  });

  it('rejects unsupported element types', () => {
    expect(canKeepWithNext(new MartyriaElement(), new NoteElement())).toBe(
      false,
    );
    expect(canKeepWithNext(new TempoElement(), new NoteElement())).toBe(false);
    expect(canKeepWithNext(new DropCapElement(), new NoteElement())).toBe(
      false,
    );
    expect(canKeepWithNext(new TextBoxElement(), new NoteElement())).toBe(
      false,
    );
    expect(canKeepWithNext(new RichTextBoxElement(), new NoteElement())).toBe(
      false,
    );
    const image = new ImageBoxElement();
    image.inline = true;
    expect(canKeepWithNext(image, new NoteElement())).toBe(false);
  });

  it('rejects a keep after an explicit line break', () => {
    const element = new NoteElement();
    element.lineBreak = true;

    expect(canKeepWithNext(element, new NoteElement())).toBe(false);
  });

  it('rejects a keep after an explicit page break', () => {
    const element = new NoteElement();
    element.pageBreak = true;

    expect(canKeepWithNext(element, new NoteElement())).toBe(false);
  });

  it('rejects a block element as the next element', () => {
    const block = new ModeKeyElement();

    expect(canKeepWithNext(new NoteElement(), block)).toBe(false);
  });

  it('rejects a keep on or before the terminal empty element', () => {
    // The empty element is always last, so pass it a following element to
    // exercise its own guard rather than the missing-next-element one.
    expect(canKeepWithNext(new EmptyElement(), new NoteElement())).toBe(false);
    expect(canKeepWithNext(new NoteElement(), null)).toBe(false);
    expect(canKeepWithNext(new NoteElement(), new EmptyElement())).toBe(false);
  });

  it('rejects a boundary before a martyria', () => {
    const note = new NoteElement();
    const martyria = new MartyriaElement();

    expect(isAutomaticBreakProhibited(note, martyria)).toBe(true);
    expect(canKeepWithNext(note, martyria)).toBe(false);
  });

  it('rejects a boundary across a tie', () => {
    const heteron = new NoteElement();
    const yfen = new NoteElement();
    heteron.vocalExpressionNeume = VocalExpressionNeume.HeteronConnecting;
    yfen.tie = Tie.YfenAbove;

    expect(isAutomaticBreakProhibited(heteron, new NoteElement())).toBe(true);
    expect(canKeepWithNext(heteron, new NoteElement())).toBe(false);
    expect(canKeepWithNext(yfen, new NoteElement())).toBe(false);
  });
});

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
  it.each([
    { label: 'note', createElement: () => new NoteElement() },
    { label: 'martyria', createElement: () => new MartyriaElement() },
    { label: 'tempo', createElement: () => new TempoElement() },
    { label: 'text box', createElement: () => new TextBoxElement() },
    { label: 'rich-text box', createElement: () => new RichTextBoxElement() },
    { label: 'drop cap', createElement: () => new DropCapElement() },
    { label: 'image box', createElement: () => new ImageBoxElement() },
    { label: 'mode key', createElement: () => new ModeKeyElement() },
    { label: 'empty element', createElement: () => new EmptyElement() },
  ])('drops the $label break state when cloning', ({ createElement }) => {
    const element = createElement();
    element.lineBreak = true;
    element.lineBreakType = LineBreakType.Center;
    element.pageBreak = true;
    if (supportsKeepWithNext(element)) {
      element.keepWithNext = true;
    }

    const clone = element.clone();

    expect(clone.lineBreak).toBe(false);
    expect(clone.lineBreakType).toBeNull();
    expect(clone.pageBreak).toBe(false);
    expect(clone).not.toHaveProperty('keepWithNext', true);
  });

  it('copies all break state when replacing an element type', () => {
    const source = new NoteElement();
    const replacement = new NoteElement();
    source.lineBreak = true;
    source.lineBreakType = LineBreakType.Center;
    source.pageBreak = true;
    source.keepWithNext = true;

    replacement.copyBreakStateFrom(source);

    expect(replacement.lineBreak).toBe(true);
    expect(replacement.lineBreakType).toBe(LineBreakType.Center);
    expect(replacement.pageBreak).toBe(true);
    expect(replacement.keepWithNext).toBe(true);
  });

  it('drops keep-with-next when replacing with a martyria', () => {
    const source = new NoteElement();
    const replacement = new MartyriaElement();
    source.keepWithNext = true;

    replacement.copyBreakStateFrom(source);

    expect(replacement).not.toHaveProperty('keepWithNext');
  });

  it('does not include break constraints in copied formatting', () => {
    const note = new NoteElement();
    const textBox = new TextBoxElement();
    note.keepWithNext = true;

    expect(note.getClipboardProperties(true)).not.toHaveProperty(
      'keepWithNext',
    );
    expect(textBox.getClipboardProperties()).not.toHaveProperty('keepWithNext');
    expect(textBox.cloneFormat()).not.toHaveProperty('keepWithNext');
  });

  it('does not include line or page breaks in martyria clipboard data', () => {
    const martyria = new MartyriaElement();

    expect(martyria.getClipboardProperties()).not.toHaveProperty('lineBreak');
    expect(martyria.getClipboardProperties()).not.toHaveProperty(
      'lineBreakType',
    );
    expect(martyria.getClipboardProperties()).not.toHaveProperty('pageBreak');
  });

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
