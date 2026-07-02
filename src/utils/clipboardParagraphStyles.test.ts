import { describe, expect, it } from 'vitest';

import { DropCapElement, NoteElement, TextBoxElement } from '@/models/Element';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultParagraphStyles,
  ParagraphStyle,
} from '@/models/ParagraphStyle';

import {
  sanitizeClipboardElementParagraphStyleIds,
  sanitizeClipboardNoteFormatParagraphStyleId,
  sanitizeClipboardTextBoxFormatParagraphStyleId,
} from './clipboardParagraphStyles';

describe('clipboard paragraph style sanitization', () => {
  it('falls back unknown pasted element style ids to the element slot default', () => {
    const paragraphStyles = createDefaultParagraphStyles();

    const textBox = new TextBoxElement();
    textBox.paragraphStyleId = 'source-custom-text';
    sanitizeClipboardElementParagraphStyleIds(textBox, paragraphStyles);

    expect(textBox.paragraphStyleId).toBe(
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );

    const inlineTextBox = new TextBoxElement();
    inlineTextBox.inline = true;
    inlineTextBox.paragraphStyleId = 'source-custom-inline-text';
    sanitizeClipboardElementParagraphStyleIds(inlineTextBox, paragraphStyles);

    expect(inlineTextBox.paragraphStyleId).toBe(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
    );

    const dropCap = new DropCapElement();
    dropCap.paragraphStyleId = 'source-custom-drop-cap';
    sanitizeClipboardElementParagraphStyleIds(dropCap, paragraphStyles);

    expect(dropCap.paragraphStyleId).toBe(BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap);

    const note = new NoteElement();
    note.lyricsParagraphStyleId = 'source-custom-lyrics';
    sanitizeClipboardElementParagraphStyleIds(note, paragraphStyles);

    expect(note.lyricsParagraphStyleId).toBe(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
    );
  });

  it('keeps pasted element style ids that exist in the destination score', () => {
    const customStyle = new ParagraphStyle();
    customStyle.id = 'destination-custom';
    const paragraphStyles = [...createDefaultParagraphStyles(), customStyle];

    const textBox = new TextBoxElement();
    textBox.paragraphStyleId = customStyle.id;

    sanitizeClipboardElementParagraphStyleIds(textBox, paragraphStyles);

    expect(textBox.paragraphStyleId).toBe(customStyle.id);
  });

  it('sanitizes copied text-box format style ids without mutating the stored format', () => {
    const paragraphStyles = createDefaultParagraphStyles();
    const format: Partial<TextBoxElement> = {
      inline: true,
      paragraphStyleId: 'source-custom-format',
    };

    const sanitized = sanitizeClipboardTextBoxFormatParagraphStyleId(
      format,
      paragraphStyles,
    );

    expect(sanitized.paragraphStyleId).toBe(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
    );
    expect(format.paragraphStyleId).toBe('source-custom-format');
  });

  it('sanitizes copied note format style ids without mutating the stored format', () => {
    const paragraphStyles = createDefaultParagraphStyles();
    const format: Partial<NoteElement> = {
      lyricsParagraphStyleId: 'source-custom-format',
    };

    const sanitized = sanitizeClipboardNoteFormatParagraphStyleId(
      format,
      paragraphStyles,
    );

    expect(sanitized.lyricsParagraphStyleId).toBe(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
    );
    expect(format.lyricsParagraphStyleId).toBe('source-custom-format');
  });
});
