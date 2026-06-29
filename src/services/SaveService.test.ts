import { describe, expect, it } from 'vitest';

import {
  DropCapElement,
  NoteElement,
  RichTextBoxElement,
  TextBoxAlignment,
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
import {
  BUILT_IN_TEXT_STYLE_IDS,
  createTextStylesFromDefaults,
  resolveTextStyle,
  TextStyle,
} from '@/models/TextStyle';
import { getRichTextLanguage } from '@/utils/richTextLanguage';

import { SaveService } from './SaveService';

function createLegacyScore(pageSetupOverrides: Partial<PageSetup_v1> = {}) {
  return {
    version: '1.1',
    appVersion: 'test',
    pageSetup: Object.assign(new PageSetup_v1(), pageSetupOverrides),
    headers: {
      default: { elements: [new TextBoxElement_v1()] },
      chapterOpening: { elements: [new TextBoxElement_v1()] },
      even: { elements: [new TextBoxElement_v1()] },
      odd: { elements: [new TextBoxElement_v1()] },
      firstPage: { elements: [new TextBoxElement_v1()] },
    },
    footers: {
      default: { elements: [new TextBoxElement_v1()] },
      chapterOpening: { elements: [new TextBoxElement_v1()] },
      even: { elements: [new TextBoxElement_v1()] },
      odd: { elements: [new TextBoxElement_v1()] },
      firstPage: { elements: [new TextBoxElement_v1()] },
    },
    staff: { elements: [], lyrics: { text: '' } },
  } as any;
}

function loadLegacyDefaultTextStyle(
  pageSetupOverrides: Partial<PageSetup_v1> = {},
) {
  const score = SaveService.LoadScoreFromJson(
    createLegacyScore(pageSetupOverrides),
  );

  return resolveTextStyle(
    score.textStyles,
    BUILT_IN_TEXT_STYLE_IDS.DefaultText,
  );
}

function loadLegacyBuiltInStyle(
  styleId: string,
  pageSetupOverrides: Partial<PageSetup_v1> = {},
) {
  const score = SaveService.LoadScoreFromJson(
    createLegacyScore(pageSetupOverrides),
  );

  return resolveTextStyle(score.textStyles, styleId);
}

describe('SaveService font styles', () => {
  it('loads legacy text box bold/italic booleans as a font style', () => {
    const pageSetup = new PageSetup();
    const element = new TextBoxElement();
    const legacy = new TextBoxElement_v1();

    legacy.useDefaultStyle = false;
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
    const lyricsStyle = loadLegacyBuiltInStyle(BUILT_IN_TEXT_STYLE_IDS.Lyrics, {
      lyricsDefaultFontWeight: '600',
    });
    const dropCapStyle = loadLegacyBuiltInStyle(
      BUILT_IN_TEXT_STYLE_IDS.DropCap,
      {
        dropCapDefaultFontWeight: '700',
        dropCapDefaultFontStyle: 'italic',
      },
    );
    const defaultTextStyle = loadLegacyDefaultTextStyle({
      textBoxDefaultFontStyle: 'italic',
    });

    expect(dropCapStyle.fontStyle).toBe('Bold Italic');
    expect(lyricsStyle.fontStyle).toBe('Semibold');
    expect(defaultTextStyle.fontStyle).toBe('Italic');
  });

  it('loads legacy page setup face names as base families and styles', () => {
    const pageSetup = new PageSetup();
    const legacy = new PageSetup_v1();

    legacy.lyricsDefaultFontFamily = 'Minion Pro Semibold';
    legacy.dropCapDefaultFontFamily = 'Minion Pro Semibold';
    legacy.textBoxDefaultFontFamily = 'Minion Pro Semibold';

    SaveService.LoadPageSetup_v1(pageSetup, legacy);
    const lyricsStyle = loadLegacyBuiltInStyle(BUILT_IN_TEXT_STYLE_IDS.Lyrics, {
      lyricsDefaultFontFamily: 'Minion Pro Semibold',
    });
    const dropCapStyle = loadLegacyBuiltInStyle(
      BUILT_IN_TEXT_STYLE_IDS.DropCap,
      {
        dropCapDefaultFontFamily: 'Minion Pro Semibold',
      },
    );
    const defaultTextStyle = loadLegacyDefaultTextStyle({
      textBoxDefaultFontFamily: 'Minion Pro Semibold',
    });

    expect(lyricsStyle.fontFamily).toBe('Minion Pro');
    expect(lyricsStyle.fontStyle).toBe('Semibold');
    expect(dropCapStyle.fontFamily).toBe('Minion Pro');
    expect(dropCapStyle.fontStyle).toBe('Semibold');
    expect(defaultTextStyle.fontFamily).toBe('Minion Pro');
    expect(defaultTextStyle.fontStyle).toBe('Semibold');
  });

  it('merges legacy page setup numeric weights into face-name styles', () => {
    const pageSetup = new PageSetup();
    const legacy = new PageSetup_v1();

    legacy.textBoxDefaultFontFamily = 'Source Serif Caption';
    legacy.textBoxDefaultFontWeight = '600';

    SaveService.LoadPageSetup_v1(pageSetup, legacy);
    const defaultTextStyle = loadLegacyDefaultTextStyle({
      textBoxDefaultFontFamily: 'Source Serif Caption',
      textBoxDefaultFontWeight: '600',
    });

    expect(defaultTextStyle.fontFamily).toBe('Source Serif');
    expect(defaultTextStyle.fontStyle).toBe('Caption Semibold');
  });

  it('remaps legacy numeric weights to the catalog face spelling', () => {
    const pageSetup = new PageSetup();
    const legacy = new PageSetup_v1();

    legacy.textBoxDefaultFontFamily = 'Source Serif';
    legacy.textBoxDefaultFontWeight = '200';

    SaveService.LoadPageSetup_v1(pageSetup, legacy);
    const defaultTextStyle = loadLegacyDefaultTextStyle({
      textBoxDefaultFontFamily: 'Source Serif',
      textBoxDefaultFontWeight: '200',
    });

    expect(defaultTextStyle.fontStyle).toBe('ExtraLight');
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

    legacy.useDefaultStyle = false;
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
    textBoxSave.useDefaultStyle = false;
    textBoxSave.fontSubfamily = 'Caption Semibold';

    SaveService.LoadPageSetup_v1(pageSetup, pageSetupSave);
    const lyricsStyle = loadLegacyBuiltInStyle(BUILT_IN_TEXT_STYLE_IDS.Lyrics, {
      lyricsDefaultFontSubfamily: 'Semibold',
    });
    const dropCapStyle = loadLegacyBuiltInStyle(
      BUILT_IN_TEXT_STYLE_IDS.DropCap,
      {
        dropCapDefaultFontSubfamily: 'Caption',
      },
    );
    SaveService.LoadDropCap_v1(dropCap, dropCapSave, pageSetup);
    SaveService.LoadNote_v1(note, noteSave);
    SaveService.LoadTextBox_v1('1.1', textBox, textBoxSave, pageSetup);
    const defaultTextStyle = loadLegacyDefaultTextStyle({
      textBoxDefaultFontSubfamily: 'Bold Italic',
    });

    expect(lyricsStyle.fontStyle).toBe('Semibold');
    expect(dropCapStyle.fontStyle).toBe('Caption');
    expect(defaultTextStyle.fontStyle).toBe('Bold Italic');
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

  it('assigns built-in style ids when loading legacy text boxes', () => {
    const pageSetup = new PageSetup();
    const body = new TextBoxElement();
    const inline = new TextBoxElement();
    const legacyBody = new TextBoxElement_v1();
    const legacyInline = new TextBoxElement_v1();

    legacyInline.inline = true;

    SaveService.LoadTextBox_v1('1.1', body, legacyBody, pageSetup);
    SaveService.LoadTextBox_v1('1.1', inline, legacyInline, pageSetup);

    expect(body.textStyleId).toBe('default-text');
    expect(inline.textStyleId).toBe('lyrics');
  });

  it('loads old scores without textStyles by seeding defaults', () => {
    const legacy = {
      version: '1.1',
      appVersion: 'test',
      pageSetup: new PageSetup_v1(),
      headers: {
        default: { elements: [new TextBoxElement_v1()] },
        chapterOpening: { elements: [new TextBoxElement_v1()] },
        even: { elements: [new TextBoxElement_v1()] },
        odd: { elements: [new TextBoxElement_v1()] },
        firstPage: { elements: [new TextBoxElement_v1()] },
      },
      footers: {
        default: { elements: [new TextBoxElement_v1()] },
        chapterOpening: { elements: [new TextBoxElement_v1()] },
        even: { elements: [new TextBoxElement_v1()] },
        odd: { elements: [new TextBoxElement_v1()] },
        firstPage: { elements: [new TextBoxElement_v1()] },
      },
      staff: { elements: [], lyrics: { text: '' } },
    } as any;

    const loaded = SaveService.LoadScoreFromJson(legacy);

    expect(loaded.textStyles.length).toBeGreaterThan(0);
  });

  it('fills missing built-in paragraph styles when only custom styles are saved', () => {
    const saved = createLegacyScore();
    const customStyle = new TextStyle();

    customStyle.id = 'custom-style';
    customStyle.displayName = 'Custom Style';
    customStyle.parentStyleId = BUILT_IN_TEXT_STYLE_IDS.DefaultText;
    customStyle.overrides.fontSize = 99;

    saved.textStyles = [SaveService.SaveTextStyle(customStyle)];

    const loaded = SaveService.LoadScore_v1(saved);
    const builtInIds = Object.values(BUILT_IN_TEXT_STYLE_IDS);

    expect(
      loaded.textStyles.slice(0, builtInIds.length).map((style) => style.id),
    ).toEqual(builtInIds);
    expect(loaded.textStyles.at(-1)?.id).toBe('custom-style');
  });

  it('fills missing built-in paragraph styles when only one built-in style is saved', () => {
    const saved = createLegacyScore();
    const titleStyle = new TextStyle();

    titleStyle.id = BUILT_IN_TEXT_STYLE_IDS.Title;
    titleStyle.displayName = 'Custom Title';
    titleStyle.builtIn = true;
    titleStyle.parentStyleId = BUILT_IN_TEXT_STYLE_IDS.DefaultText;
    titleStyle.overrides.fontSize = 77;

    saved.textStyles = [SaveService.SaveTextStyle(titleStyle)];

    const loaded = SaveService.LoadScore_v1(saved);
    const builtInIds = Object.values(BUILT_IN_TEXT_STYLE_IDS);

    expect(
      loaded.textStyles.slice(0, builtInIds.length).map((style) => style.id),
    ).toEqual(builtInIds);
    expect(
      resolveTextStyle(loaded.textStyles, BUILT_IN_TEXT_STYLE_IDS.Title)
        .fontSize,
    ).toBe(77);
  });

  it('fills a missing default-text style from legacy page setup text box defaults', () => {
    const saved = createLegacyScore({
      textBoxDefaultFontFamily: 'Minion Pro Semibold',
      textBoxDefaultFontStyle: 'italic',
      textBoxDefaultFontSize: 42,
      textBoxDefaultColor: '#123456',
      textBoxDefaultStrokeWidth: 3,
      textBoxDefaultLineHeight: 1.7,
    });
    const chapterStyle = new TextStyle();

    chapterStyle.id = BUILT_IN_TEXT_STYLE_IDS.Chapter;
    chapterStyle.displayName = 'Chapter';
    chapterStyle.builtIn = true;
    chapterStyle.parentStyleId = BUILT_IN_TEXT_STYLE_IDS.DefaultText;

    saved.textStyles = [SaveService.SaveTextStyle(chapterStyle)];

    const loaded = SaveService.LoadScore_v1(saved);
    const defaultTextStyle = resolveTextStyle(
      loaded.textStyles,
      BUILT_IN_TEXT_STYLE_IDS.DefaultText,
    );

    expect(defaultTextStyle.fontFamily).toBe('Minion Pro');
    expect(defaultTextStyle.fontStyle).toBe('Semibold Italic');
    expect(defaultTextStyle.fontSize).toBe(42);
    expect(defaultTextStyle.color).toBe('#123456');
    expect(defaultTextStyle.strokeWidth).toBe(3);
    expect(defaultTextStyle.lineHeight).toBe(1.7);
  });

  it('keeps a saved built-in paragraph style instead of overwriting it with generated defaults', () => {
    const saved = createLegacyScore({
      textBoxDefaultFontFamily: 'Source Serif',
      textBoxDefaultFontStyle: 'italic',
      textBoxDefaultFontSize: 42,
    });
    const defaultTextStyle = new TextStyle();

    defaultTextStyle.id = BUILT_IN_TEXT_STYLE_IDS.DefaultText;
    defaultTextStyle.displayName = 'Default Text';
    defaultTextStyle.builtIn = true;
    defaultTextStyle.overrides.fontFamily = 'Alegreya';
    defaultTextStyle.overrides.fontSize = 64;
    defaultTextStyle.overrides.fontStyle = 'Semibold';

    saved.textStyles = [SaveService.SaveTextStyle(defaultTextStyle)];

    const loaded = SaveService.LoadScore_v1(saved);
    const resolvedDefaultText = resolveTextStyle(
      loaded.textStyles,
      BUILT_IN_TEXT_STYLE_IDS.DefaultText,
    );

    expect(resolvedDefaultText.fontFamily).toBe('Alegreya');
    expect(resolvedDefaultText.fontSize).toBe(64);
    expect(resolvedDefaultText.fontStyle).toBe('Semibold');
  });

  it('preserves legacy non-default text box styling as element overrides', () => {
    const pageSetup = new PageSetup();
    const element = new TextBoxElement();
    const legacy = new TextBoxElement_v1();

    legacy.useDefaultStyle = false;
    legacy.fontFamily = 'Minion Pro';
    legacy.fontSubfamily = 'Semibold';
    legacy.fontSize = 18;
    legacy.color = '#123456';
    legacy.strokeWidth = 2;
    legacy.lineHeight = 1.5;

    SaveService.LoadTextBox_v1('1.1', element, legacy, pageSetup);

    expect(element.fontFamily).toBe('Minion Pro');
    expect(element.fontStyle).toBe('Semibold');
    expect(element.fontSize).toBe(18);
    expect(element.color).toBe('#123456');
    expect(element.strokeWidth).toBe(2);
    expect(element.lineHeight).toBe(1.5);
  });

  it('keeps a legacy regular font style as an explicit override', () => {
    const pageSetup = new PageSetup();
    const textStyles = createTextStylesFromDefaults(pageSetup, {
      textBoxDefaultFontStyle: 'Italic',
    });
    const element = new TextBoxElement();
    const legacy = new TextBoxElement_v1();

    legacy.useDefaultStyle = false;
    legacy.fontSubfamily = 'Regular';

    SaveService.LoadTextBox_v1('1.1', element, legacy, textStyles);

    expect(element.fontStyle).toBe('Regular');
    expect(
      resolveTextStyle(
        textStyles,
        element.textStyleId,
        element.getTextStyleOverrides(),
      ).fontStyle,
    ).toBe('Regular');
  });

  it('defaults legacy non-default text boxes to an explicit regular override', () => {
    const pageSetup = new PageSetup();
    const textStyles = createTextStylesFromDefaults(pageSetup, {
      textBoxDefaultFontStyle: 'Italic',
    });
    const element = new TextBoxElement();
    const legacy = new TextBoxElement_v1();

    legacy.useDefaultStyle = false;

    SaveService.LoadTextBox_v1('1.1', element, legacy, textStyles);

    expect(element.textStyleId).toBe('default-text');
    expect(element.fontStyle).toBe('Regular');
    expect(
      resolveTextStyle(
        textStyles,
        element.textStyleId,
        element.getTextStyleOverrides(),
      ).fontStyle,
    ).toBe('Regular');
  });

  it('keeps legacy css normal font style as an explicit regular override', () => {
    const pageSetup = new PageSetup();
    const textStyles = createTextStylesFromDefaults(pageSetup, {
      textBoxDefaultFontStyle: 'Italic',
    });
    const element = new TextBoxElement();
    const legacy = new TextBoxElement_v1() as TextBoxElement_v1 & {
      fontStyle?: string;
    };

    legacy.useDefaultStyle = false;
    legacy.fontStyle = 'normal';

    SaveService.LoadTextBox_v1('1.1', element, legacy, textStyles);

    expect(element.fontStyle).toBe('Regular');
    expect(
      resolveTextStyle(
        textStyles,
        element.textStyleId,
        element.getTextStyleOverrides(),
      ).fontStyle,
    ).toBe('Regular');
  });

  it('keeps legacy css italic font style as an explicit italic override', () => {
    const pageSetup = new PageSetup();
    const textStyles = createTextStylesFromDefaults(pageSetup, {
      textBoxDefaultFontStyle: 'Regular',
    });
    const element = new TextBoxElement();
    const legacy = new TextBoxElement_v1() as TextBoxElement_v1 & {
      fontStyle?: string;
    };

    legacy.useDefaultStyle = false;
    legacy.fontStyle = 'italic';

    SaveService.LoadTextBox_v1('1.1', element, legacy, textStyles);

    expect(element.fontStyle).toBe('Italic');
    expect(
      resolveTextStyle(
        textStyles,
        element.textStyleId,
        element.getTextStyleOverrides(),
      ).fontStyle,
    ).toBe('Italic');
  });

  it('combines legacy css font style with bold text box flags', () => {
    const pageSetup = new PageSetup();
    const textStyles = createTextStylesFromDefaults(pageSetup, {
      textBoxDefaultFontStyle: 'Italic',
    });
    const normalBold = new TextBoxElement();
    const italicBold = new TextBoxElement();
    const legacyNormalBold = new TextBoxElement_v1() as TextBoxElement_v1 & {
      fontStyle?: string;
    };
    const legacyItalicBold = new TextBoxElement_v1() as TextBoxElement_v1 & {
      fontStyle?: string;
    };

    legacyNormalBold.useDefaultStyle = false;
    legacyNormalBold.fontStyle = 'normal';
    legacyNormalBold.bold = true;
    legacyItalicBold.useDefaultStyle = false;
    legacyItalicBold.fontStyle = 'italic';
    legacyItalicBold.bold = true;

    SaveService.LoadTextBox_v1('1.1', normalBold, legacyNormalBold, textStyles);
    SaveService.LoadTextBox_v1('1.1', italicBold, legacyItalicBold, textStyles);

    expect(normalBold.fontStyle).toBe('Bold');
    expect(italicBold.fontStyle).toBe('Bold Italic');
  });

  it('preserves legacy non-default text box styling when false was omitted', () => {
    const pageSetup = new PageSetup();
    const element = new TextBoxElement();
    const legacy = new TextBoxElement_v1();

    legacy.fontFamily = 'Minion Pro';
    legacy.fontSubfamily = 'Semibold';
    legacy.fontSize = 18;
    legacy.color = '#123456';
    legacy.strokeWidth = 2;
    legacy.lineHeight = 1.5;

    SaveService.LoadTextBox_v1('1.1', element, legacy, pageSetup);

    expect(element.fontFamily).toBe('Minion Pro');
    expect(element.fontStyle).toBe('Semibold');
    expect(element.fontSize).toBe(18);
    expect(element.color).toBe('#123456');
    expect(element.strokeWidth).toBe(2);
    expect(element.lineHeight).toBe(1.5);
  });

  it('loads only saved legacy text box overrides', () => {
    const pageSetup = new PageSetup();
    const element = new TextBoxElement();
    const legacy = new TextBoxElement_v1();

    legacy.useDefaultStyle = false;
    legacy.fontSize = 18;

    SaveService.LoadTextBox_v1('1.1', element, legacy, pageSetup);

    expect(element.fontFamily).toBeNull();
    expect(element.fontStyle).toBe('Regular');
    expect(element.fontSize).toBe(18);
    expect(element.color).toBeNull();
    expect(element.strokeWidth).toBeNull();
    expect(element.lineHeight).toBeNull();
  });

  it('keeps legacy default-styled text boxes inherited', () => {
    const pageSetup = new PageSetup();
    const textStyles = createTextStylesFromDefaults(pageSetup, {
      textBoxDefaultFontFamily: 'Minion Pro',
      textBoxDefaultFontSize: 42,
      textBoxDefaultFontStyle: 'Semibold',
      textBoxDefaultColor: '#654321',
      textBoxDefaultStrokeWidth: 3,
      textBoxDefaultLineHeight: 1.7,
    });
    const element = new TextBoxElement();
    const legacy = new TextBoxElement_v1();

    legacy.useDefaultStyle = true;
    legacy.fontFamily = 'Source Serif';
    legacy.fontSize = 16;
    legacy.color = '#000000';
    legacy.strokeWidth = 0;

    SaveService.LoadTextBox_v1('1.1', element, legacy, textStyles);

    expect(element.fontFamily).toBeNull();
    expect(element.fontSize).toBeNull();
    expect(element.fontStyle).toBeNull();
    expect(element.strokeWidth).toBeNull();
    expect(element.color).toBeNull();
    expect(element.lineHeight).toBeNull();
  });

  it('loads saved paragraph-style text box overrides without useDefaultStyle', () => {
    const pageSetup = new PageSetup();
    const element = new TextBoxElement();
    const saved = new TextBoxElement_v1();

    saved.textStyleId = 'title';
    saved.fontFamily = 'Minion Pro';
    saved.fontSubfamily = 'Semibold';
    saved.fontSize = 18;
    saved.color = '#123456';
    saved.strokeWidth = 2;
    saved.lineHeight = 1.5;

    SaveService.LoadTextBox_v1('1.2', element, saved, pageSetup);

    expect(element.textStyleId).toBe('title');
    expect(element.fontFamily).toBe('Minion Pro');
    expect(element.fontStyle).toBe('Semibold');
    expect(element.fontSize).toBe(18);
    expect(element.color).toBe('#123456');
    expect(element.strokeWidth).toBe(2);
    expect(element.lineHeight).toBe(1.5);
  });

  it('loads only saved paragraph-style text box overrides', () => {
    const pageSetup = new PageSetup();
    const element = new TextBoxElement();
    const saved = new TextBoxElement_v1();

    saved.textStyleId = 'title';
    saved.fontSize = 18;

    SaveService.LoadTextBox_v1('1.2', element, saved, pageSetup);

    expect(element.textStyleId).toBe('title');
    expect(element.fontFamily).toBeNull();
    expect(element.fontStyle).toBeNull();
    expect(element.fontSize).toBe(18);
    expect(element.color).toBeNull();
    expect(element.strokeWidth).toBeNull();
    expect(element.lineHeight).toBeNull();
  });

  it('keeps saved paragraph-style text boxes inherited when no overrides exist', () => {
    const pageSetup = new PageSetup();
    const element = new TextBoxElement();
    const saved = new TextBoxElement_v1();

    saved.textStyleId = 'title';

    SaveService.LoadTextBox_v1('1.2', element, saved, pageSetup);

    expect(element.textStyleId).toBe('title');
    expect(element.fontFamily).toBeNull();
    expect(element.fontSize).toBeNull();
    expect(element.fontStyle).toBeNull();
    expect(element.strokeWidth).toBeNull();
    expect(element.color).toBeNull();
    expect(element.lineHeight).toBeNull();
  });

  it('saves and loads paragraph-style alignment', () => {
    const style = new TextStyle();
    style.id = 'custom';
    style.displayName = 'Custom';
    style.overrides.alignment = TextBoxAlignment.Right;

    const saved = SaveService.SaveTextStyle(style);
    const loaded = SaveService.LoadTextStyle_v1(saved);

    expect(saved.alignment).toBe(TextBoxAlignment.Right);
    expect(loaded.overrides.alignment).toBe(TextBoxAlignment.Right);
  });

  it('defaults missing text-box alignment to the paragraph style', () => {
    const pageSetup = new PageSetup();
    const element = new TextBoxElement();
    const saved = new TextBoxElement_v1();
    const textStyles = [new TextStyle()];

    textStyles[0].id = BUILT_IN_TEXT_STYLE_IDS.DefaultText;
    textStyles[0].overrides.alignment = TextBoxAlignment.Center;
    saved.textStyleId = BUILT_IN_TEXT_STYLE_IDS.DefaultText;
    saved.alignment = undefined;

    SaveService.LoadTextBox_v1('1.2', element, saved, pageSetup);

    expect(element.alignment).toBeNull();
    expect(
      resolveTextStyle(
        textStyles,
        element.textStyleId,
        element.getTextStyleOverrides(),
      ).alignment,
    ).toBe(TextBoxAlignment.Center);
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

  it('does not save an object-level paragraph style for rich text boxes', () => {
    const element = new RichTextBoxElement();
    const saved = new RichTextBoxElement_v1();

    SaveService.SaveRichTextBox(saved, element);

    expect('textStyleId' in saved).toBe(false);
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

  it('loads and saves chapter-opening horizontal-rule exclusions', () => {
    const pageSetup = new PageSetup();
    const legacyPageSetup = new PageSetup_v1();

    legacyPageSetup.showHeaderHorizontalRule = true;
    legacyPageSetup.excludeHeaderHorizontalRuleChapterOpening = true;
    legacyPageSetup.showFooterHorizontalRule = true;
    legacyPageSetup.excludeFooterHorizontalRuleChapterOpening = true;

    SaveService.LoadPageSetup_v1(pageSetup, legacyPageSetup);

    expect(pageSetup.excludeHeaderHorizontalRuleChapterOpening).toBe(true);
    expect(pageSetup.excludeFooterHorizontalRuleChapterOpening).toBe(true);

    const savedPageSetup = new PageSetup_v1();

    SaveService.SavePageSetup(savedPageSetup, pageSetup);

    expect(savedPageSetup.excludeHeaderHorizontalRuleChapterOpening).toBe(true);
    expect(savedPageSetup.excludeFooterHorizontalRuleChapterOpening).toBe(true);
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

    (score.headers.default.elements[0] as TextBoxElement).contentCenter =
      'Default Header';
    (score.footers.default.elements[0] as TextBoxElement).contentCenter =
      'Default Footer';

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

  it('loads legacy lyrics defaults into the built-in Lyrics style', () => {
    const lyricsStyle = loadLegacyBuiltInStyle(BUILT_IN_TEXT_STYLE_IDS.Lyrics, {
      lyricsDefaultFontFamily: 'Minion Pro Semibold',
      lyricsDefaultFontSize: 33,
      lyricsDefaultColor: '#123456',
      lyricsDefaultStrokeWidth: 2,
    });

    expect(lyricsStyle.fontFamily).toBe('Minion Pro');
    expect(lyricsStyle.fontStyle).toBe('Semibold');
    expect(lyricsStyle.fontSize).toBe(33);
    expect(lyricsStyle.color).toBe('#123456');
    expect(lyricsStyle.strokeWidth).toBe(2);
  });

  it('loads legacy drop-cap defaults into the built-in Drop Cap style', () => {
    const dropCapStyle = loadLegacyBuiltInStyle(
      BUILT_IN_TEXT_STYLE_IDS.DropCap,
      {
        dropCapDefaultFontFamily: 'Minion Pro Semibold',
        dropCapDefaultFontSize: 72,
        dropCapDefaultColor: '#654321',
        dropCapDefaultStrokeWidth: 4,
        dropCapDefaultLineHeight: 1.5,
      },
    );

    expect(dropCapStyle.fontFamily).toBe('Minion Pro');
    expect(dropCapStyle.fontStyle).toBe('Semibold');
    expect(dropCapStyle.fontSize).toBe(72);
    expect(dropCapStyle.color).toBe('#654321');
    expect(dropCapStyle.strokeWidth).toBe(4);
    expect(dropCapStyle.lineHeight).toBe(1.5);
  });

  it('uses built-in Lyrics style as the fallback for legacy note overrides', () => {
    const textStyles = createTextStylesFromDefaults(new PageSetup(), {
      lyricsDefaultFontFamily: 'Minion Pro',
      lyricsDefaultFontStyle: 'Semibold',
      lyricsDefaultFontSize: 15,
      lyricsDefaultColor: '#abcdef',
      lyricsDefaultStrokeWidth: 3,
    });
    const element = new NoteElement();
    const legacy = new NoteElement_v1();

    legacy.lyricsUseDefaultStyle = false;
    legacy.lyricsFontSubfamily = 'Italic';

    SaveService.LoadNote_v1(element, legacy, textStyles);

    expect(element.lyricsFontFamily).toBe('Minion Pro');
    expect(element.lyricsFontStyle).toBe('Italic');
    expect(element.lyricsFontSize).toBe(15);
    expect(element.lyricsColor).toBe('#abcdef');
    expect(element.lyricsStrokeWidth).toBe(3);
  });

  it('uses built-in Drop Cap style as the fallback for legacy drop-cap overrides', () => {
    const pageSetup = new PageSetup();
    const textStyles = createTextStylesFromDefaults(pageSetup, {
      dropCapDefaultFontFamily: 'Minion Pro',
      dropCapDefaultFontStyle: 'Semibold',
      dropCapDefaultFontSize: 80,
      dropCapDefaultColor: '#fedcba',
      dropCapDefaultStrokeWidth: 5,
      dropCapDefaultLineHeight: 1.25,
    });
    const element = new DropCapElement();
    const legacy = new DropCapElement_v1();

    legacy.fontFamily = undefined as unknown as string;
    legacy.fontSize = undefined as unknown as number;
    legacy.color = undefined as unknown as string;
    legacy.strokeWidth = undefined as unknown as number;
    legacy.fontSubfamily = 'Italic';
    legacy.lineHeight = undefined;

    SaveService.LoadDropCap_v1(element, legacy, pageSetup, textStyles);

    expect(element.fontFamily).toBe('Minion Pro');
    expect(element.fontStyle).toBe('Italic');
    expect(element.fontSize).toBe(80);
    expect(element.color).toBe('#fedcba');
    expect(element.strokeWidth).toBe(5);
    expect(element.lineHeight).toBe(1.25);
  });

  it('round-trips drop-cap line span through page setup', () => {
    const score = new Score();

    (globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

    score.pageSetup.dropCapDefaultLineSpan = 4;

    const saved = SaveService.SaveScoreToJson(score);
    const loaded = SaveService.LoadScore_v1(saved);

    expect(saved.pageSetup.dropCapDefaultLineSpan).toBe(4);
    expect(loaded.pageSetup.dropCapDefaultLineSpan).toBe(4);
  });
});
