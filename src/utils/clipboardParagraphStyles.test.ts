// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import {
  AlternateLineElement,
  AnnotationElement,
  DropCapElement,
  NoteElement,
  RichTextBoxElement,
  TextBoxElement,
} from '@/models/Element';
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

  it('rewrites copied rich text box HTML classes to destination styles', () => {
    const customStyle = new ParagraphStyle();
    customStyle.id = 'destination-custom';
    const paragraphStyles = [...createDefaultParagraphStyles(), customStyle];

    const richTextBox = new RichTextBoxElement();
    richTextBox.multipanel = true;
    richTextBox.content = '<p class="neanes-style-source-id">Body</p>';
    richTextBox.contentBottom =
      '<p class="caption neanes-style-destination-custom">Bottom</p>';
    richTextBox.contentLeft = '<p class="lead">Left</p>';
    richTextBox.contentCenter =
      '<p class="neanes-style-source-id center">Center</p>';
    richTextBox.contentRight =
      '<p class="neanes-style-source-id right">Right</p>';

    const inlineRichTextBox = new RichTextBoxElement();
    inlineRichTextBox.inline = true;
    inlineRichTextBox.content = '<p class="neanes-style-source-id">Inline</p>';

    sanitizeClipboardElementParagraphStyleIds(richTextBox, paragraphStyles);
    sanitizeClipboardElementParagraphStyleIds(
      inlineRichTextBox,
      paragraphStyles,
    );

    expect(richTextBox.content).toBe(
      '<p class="neanes-style-default-text">Body</p>',
    );
    expect(richTextBox.contentBottom).toBe(
      '<p class="caption neanes-style-destination-custom">Bottom</p>',
    );
    expect(richTextBox.contentLeft).toBe('<p class="lead">Left</p>');
    expect(richTextBox.contentCenter).toBe(
      '<p class="center neanes-style-default-text">Center</p>',
    );
    expect(richTextBox.contentRight).toBe(
      '<p class="right neanes-style-default-text">Right</p>',
    );
    expect(inlineRichTextBox.content).toBe(
      '<p class="neanes-style-lyrics">Inline</p>',
    );
  });

  it('rewrites copied annotation html classes to annotation fallback styles', () => {
    const paragraphStyles = createDefaultParagraphStyles();

    const annotation = new AnnotationElement();
    annotation.text = '<p class="lead neanes-style-source-id">Note</p>';

    sanitizeClipboardElementParagraphStyleIds(annotation, paragraphStyles);

    expect(annotation.text).toBe(
      '<p class="lead neanes-style-annotation">Note</p>',
    );
  });

  it('sanitizes note annotations inside alternate lines through recursion', () => {
    const paragraphStyles = createDefaultParagraphStyles();

    const note = new NoteElement();
    const alternateLine = new AlternateLineElement();
    const alternateNote = new NoteElement();
    const annotation = new AnnotationElement();
    annotation.text = '<p class="neanes-style-source-id">Alt note</p>';
    alternateNote.annotations.push(annotation);
    alternateLine.elements.push(alternateNote);
    note.alternateLines.push(alternateLine);

    sanitizeClipboardElementParagraphStyleIds(note, paragraphStyles);

    expect(annotation.text).toBe(
      '<p class="neanes-style-annotation">Alt note</p>',
    );
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
