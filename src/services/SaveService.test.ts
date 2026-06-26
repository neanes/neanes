import { describe, expect, it } from 'vitest';

import {
  DropCapElement,
  NoteElement,
  RichTextBoxElement,
  TextBoxElement,
} from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import {
  DropCapElement as DropCapElement_v1,
  NoteElement as NoteElement_v1,
  RichTextBoxElement as RichTextBoxElement_v1,
  TextBoxElement as TextBoxElement_v1,
} from '@/models/save/v1/Element';
import { PageSetup as PageSetup_v1 } from '@/models/save/v1/PageSetup';
import { getRichTextLanguage } from '@/utils/richTextLanguage';

import { SaveService } from './SaveService';

describe('SaveService font styles', () => {
  it('loads legacy text box bold/italic booleans as a font style', () => {
    const pageSetup = new PageSetup();
    const element = new TextBoxElement();
    const legacy = new TextBoxElement_v1();

    legacy.bold = true;
    legacy.italic = true;

    SaveService.LoadTextBox_v1('1.1', element, legacy, pageSetup);

    expect(element.fontStyle).toBe('Bold Italic');
  });

  it('loads legacy page setup weight/style pairs as font styles', () => {
    const pageSetup = new PageSetup();
    const legacy = new PageSetup_v1();

    legacy.dropCapDefaultFontWeight = '700';
    legacy.dropCapDefaultFontStyle = 'italic';
    legacy.lyricsDefaultFontWeight = '600';
    legacy.textBoxDefaultFontStyle = 'italic';

    SaveService.LoadPageSetup_v1(pageSetup, legacy);

    expect(pageSetup.dropCapDefaultFontStyle).toBe('Bold Italic');
    expect(pageSetup.lyricsDefaultFontStyle).toBe('Semibold');
    expect(pageSetup.textBoxDefaultFontStyle).toBe('Italic');
  });

  it('loads legacy page setup face names as base families and styles', () => {
    const pageSetup = new PageSetup();
    const legacy = new PageSetup_v1();

    legacy.lyricsDefaultFontFamily = 'Minion Pro Semibold';
    legacy.dropCapDefaultFontFamily = 'Minion Pro Semibold';
    legacy.textBoxDefaultFontFamily = 'Minion Pro Semibold';

    SaveService.LoadPageSetup_v1(pageSetup, legacy);

    expect(pageSetup.lyricsDefaultFontFamily).toBe('Minion Pro');
    expect(pageSetup.lyricsDefaultFontStyle).toBe('Semibold');
    expect(pageSetup.dropCapDefaultFontFamily).toBe('Minion Pro');
    expect(pageSetup.dropCapDefaultFontStyle).toBe('Semibold');
    expect(pageSetup.textBoxDefaultFontFamily).toBe('Minion Pro');
    expect(pageSetup.textBoxDefaultFontStyle).toBe('Semibold');
  });

  it('merges legacy page setup numeric weights into face-name styles', () => {
    const pageSetup = new PageSetup();
    const legacy = new PageSetup_v1();

    legacy.textBoxDefaultFontFamily = 'Source Serif Caption';
    legacy.textBoxDefaultFontWeight = '600';

    SaveService.LoadPageSetup_v1(pageSetup, legacy);

    expect(pageSetup.textBoxDefaultFontFamily).toBe('Source Serif');
    expect(pageSetup.textBoxDefaultFontStyle).toBe('Caption Semibold');
  });

  it('remaps legacy numeric weights to the catalog face spelling', () => {
    const pageSetup = new PageSetup();
    const legacy = new PageSetup_v1();

    legacy.textBoxDefaultFontFamily = 'Source Serif';
    legacy.textBoxDefaultFontWeight = '200';

    SaveService.LoadPageSetup_v1(pageSetup, legacy);

    expect(pageSetup.textBoxDefaultFontStyle).toBe('ExtraLight');
  });

  it('loads legacy lyrics weight/style pairs as a font style', () => {
    const element = new NoteElement();
    const legacy = new NoteElement_v1();

    legacy.lyricsUseDefaultStyle = false;
    legacy.lyricsFontWeight = '700';
    legacy.lyricsFontStyle = 'italic';

    SaveService.LoadNote_v1(element, legacy);

    expect(element.lyricsFontStyle).toBe('Bold Italic');
  });

  it('loads legacy lyrics face names as base families and styles', () => {
    const element = new NoteElement();
    const legacy = new NoteElement_v1();

    legacy.lyricsUseDefaultStyle = false;
    legacy.lyricsFontFamily = 'Minion Pro Semibold';

    SaveService.LoadNote_v1(element, legacy);

    expect(element.lyricsFontFamily).toBe('Minion Pro');
    expect(element.lyricsFontStyle).toBe('Semibold');
  });

  it('loads legacy drop-cap face names as base families and styles', () => {
    const pageSetup = new PageSetup();
    const element = new DropCapElement();
    const legacy = new DropCapElement_v1();

    legacy.fontFamily = 'Minion Pro Semibold';

    SaveService.LoadDropCap_v1(element, legacy, pageSetup);

    expect(element.fontFamily).toBe('Minion Pro');
    expect(element.fontStyle).toBe('Semibold');
  });

  it('loads legacy text box face names as base families and styles', () => {
    const pageSetup = new PageSetup();
    const element = new TextBoxElement();
    const legacy = new TextBoxElement_v1();

    legacy.fontFamily = 'Minion Pro Semibold';

    SaveService.LoadTextBox_v1('1.1', element, legacy, pageSetup);

    expect(element.fontFamily).toBe('Minion Pro');
    expect(element.fontStyle).toBe('Semibold');
  });

  it('loads current font face style fields', () => {
    const pageSetup = new PageSetup();
    const pageSetupSave = new PageSetup_v1();
    const dropCap = new DropCapElement();
    const dropCapSave = new DropCapElement_v1();
    const note = new NoteElement();
    const noteSave = new NoteElement_v1();
    const textBox = new TextBoxElement();
    const textBoxSave = new TextBoxElement_v1();

    pageSetupSave.lyricsDefaultFontSubfamily = 'Semibold';
    pageSetupSave.dropCapDefaultFontSubfamily = 'Caption';
    pageSetupSave.textBoxDefaultFontSubfamily = 'Bold Italic';
    dropCapSave.fontSubfamily = 'Semibold';
    noteSave.lyricsUseDefaultStyle = false;
    noteSave.lyricsFontSubfamily = 'Bold Italic';
    textBoxSave.fontSubfamily = 'Caption Semibold';

    SaveService.LoadPageSetup_v1(pageSetup, pageSetupSave);
    SaveService.LoadDropCap_v1(dropCap, dropCapSave, pageSetup);
    SaveService.LoadNote_v1(note, noteSave);
    SaveService.LoadTextBox_v1('1.1', textBox, textBoxSave, pageSetup);

    expect(pageSetup.lyricsDefaultFontStyle).toBe('Semibold');
    expect(pageSetup.dropCapDefaultFontStyle).toBe('Caption');
    expect(pageSetup.textBoxDefaultFontStyle).toBe('Bold Italic');
    expect(dropCap.fontStyle).toBe('Semibold');
    expect(note.lyricsFontStyle).toBe('Bold Italic');
    expect(textBox.fontStyle).toBe('Caption Semibold');
  });

  it('saves font face styles instead of legacy text box booleans', () => {
    const element = new TextBoxElement();
    const saved = new TextBoxElement_v1();

    element.fontStyle = 'Semibold';

    SaveService.SaveTextBox(saved, element);

    expect(saved.fontSubfamily).toBe('Semibold');
    expect(saved.bold).toBeUndefined();
    expect(saved.italic).toBeUndefined();
  });

  it('loads legacy rich text rtl as persisted language metadata', () => {
    const element = new RichTextBoxElement();
    const legacy = new RichTextBoxElement_v1();

    (legacy as RichTextBoxElement_v1 & { rtl?: boolean }).rtl = true;

    SaveService.LoadRichTextBox_v1(element, legacy);

    expect(getRichTextLanguage(element)).toBe('ar:rtl');
    expect(element.languageCode).toBe('ar');
    expect(element.textDirection).toBe('rtl');
  });

  it('saves rich text language fields instead of legacy rtl', () => {
    const element = new RichTextBoxElement();
    const saved = new RichTextBoxElement_v1();

    element.languageCode = 'ar';
    element.textDirection = 'rtl';

    SaveService.SaveRichTextBox(saved, element);

    expect(saved.languageCode).toBe('ar');
    expect(saved.textDirection).toBe('rtl');
    expect((saved as RichTextBoxElement_v1 & { rtl?: boolean }).rtl).toBe(
      undefined,
    );
  });
});
