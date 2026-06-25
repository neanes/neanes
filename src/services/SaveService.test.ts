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
import { Score } from '@/models/Score';

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

  it('saves document properties and omits default chapter-opening headers/footers flag', () => {
    const score = new Score();
    const savedPageSetup = new PageSetup_v1();
    const savedDocumentProperties = {
      title: undefined as string | undefined,
      author: undefined as string | undefined,
    };

    score.documentProperties.title = 'Great Canon';
    score.documentProperties.author = 'St. Andrew of Crete';

    SaveService.SaveDocumentProperties(
      savedDocumentProperties,
      score.documentProperties,
    );
    SaveService.SavePageSetup(savedPageSetup, score.pageSetup);

    expect(savedDocumentProperties.title).toBe('Great Canon');
    expect(savedDocumentProperties.author).toBe('St. Andrew of Crete');
    expect(savedPageSetup.headerFooterDifferentChapterOpening).toBeUndefined();
  });

  it('loads and saves running marker fields and chapter-opening headers/footers flag', () => {
    const pageSetup = new PageSetup();
    const legacyPageSetup = new PageSetup_v1();
    const textBox = new TextBoxElement();
    const textBoxSave = new TextBoxElement_v1();
    const richTextBox = new RichTextBoxElement();
    const richTextBoxSave = new RichTextBoxElement_v1();

    legacyPageSetup.headerFooterDifferentChapterOpening = false;
    textBoxSave.runningMarkerRole = 'chapter';
    textBoxSave.runningMarkerText = ' Chapter 1 ';
    richTextBoxSave.runningMarkerRole = 'section';
    richTextBoxSave.runningMarkerText = ' Section A ';

    SaveService.LoadPageSetup_v1(pageSetup, legacyPageSetup);
    SaveService.LoadTextBox_v1('1.1', textBox, textBoxSave, pageSetup);
    SaveService.LoadRichTextBox_v1(richTextBox, richTextBoxSave);

    expect(pageSetup.headerFooterDifferentChapterOpening).toBe(false);
    expect(textBox.runningMarkerRole).toBe('chapter');
    expect(textBox.runningMarkerText).toBe('Chapter 1');
    expect(richTextBox.runningMarkerRole).toBe('section');
    expect(richTextBox.runningMarkerText).toBe('Section A');

    const savedTextBox = new TextBoxElement_v1();
    const savedRichTextBox = new RichTextBoxElement_v1();
    const savedPageSetup = new PageSetup_v1();

    SaveService.SaveTextBox(savedTextBox, textBox);
    SaveService.SaveRichTextBox(savedRichTextBox, richTextBox);
    SaveService.SavePageSetup(savedPageSetup, pageSetup);

    expect(savedTextBox.runningMarkerRole).toBe('chapter');
    expect(savedTextBox.runningMarkerText).toBe('Chapter 1');
    expect(savedRichTextBox.runningMarkerRole).toBe('section');
    expect(savedRichTextBox.runningMarkerText).toBe('Section A');
    expect(savedPageSetup.headerFooterDifferentChapterOpening).toBe(false);
  });

  it('loads and saves chapter-opening header and footer variants', () => {
    const score = new Score();
    const chapterHeader = new TextBoxElement();
    const chapterFooter = new RichTextBoxElement();

    (globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

    chapterHeader.multipanel = true;
    chapterHeader.contentCenter = '$:chapter';
    chapterFooter.multipanel = true;
    chapterFooter.contentCenter = '<p style="text-align:center;">$p</p>';

    score.headers.chapterOpening.elements[0] = chapterHeader;
    score.footers.chapterOpening.elements[0] = chapterFooter;

    const saved = SaveService.SaveScoreToJson(score);
    const loaded = SaveService.LoadScore_v1(saved);

    expect(
      (saved.headers.chapterOpening.elements[0] as TextBoxElement_v1)
        .contentCenter,
    ).toBe('$:chapter');
    expect(
      (saved.footers.chapterOpening.elements[0] as RichTextBoxElement_v1)
        .contentCenter,
    ).toBe('<p style="text-align:center;">$p</p>');
    expect(
      (loaded.headers.chapterOpening.elements[0] as TextBoxElement)
        .contentCenter,
    ).toBe('$:chapter');
    expect(
      (loaded.footers.chapterOpening.elements[0] as RichTextBoxElement)
        .contentCenter,
    ).toBe('<p style="text-align:center;">$p</p>');
  });

  it('falls back to default header/footer when chapter-opening save data has no element', () => {
    const score = new Score();

    (globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

    (
      score.headers.default.elements[0] as TextBoxElement
    ).contentCenter = 'Default Header';
    (
      score.footers.default.elements[0] as TextBoxElement
    ).contentCenter = 'Default Footer';

    const saved = SaveService.SaveScoreToJson(score);

    saved.headers.chapterOpening.elements = [];
    saved.footers.chapterOpening.elements = [];

    const loaded = SaveService.LoadScore_v1(saved);

    expect(
      (loaded.headers.chapterOpening.elements[0] as TextBoxElement)
        .contentCenter,
    ).toBe('Default Header');
    expect(
      (loaded.footers.chapterOpening.elements[0] as TextBoxElement)
        .contentCenter,
    ).toBe('Default Footer');
  });
});
