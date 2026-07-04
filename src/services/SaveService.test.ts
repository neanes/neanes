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
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  type BuiltInParagraphStyleId,
  createDefaultParagraphStyles,
  ParagraphStyle,
  type ParagraphStyleOverrides,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import {
  DropCapElement as DropCapElement_v1,
  NoteElement as NoteElement_v1,
  RichTextBoxElement as RichTextBoxElement_v1,
  TextBoxElement as TextBoxElement_v1,
} from '@/models/save/v1/Element';
import { PageSetup as PageSetup_v1 } from '@/models/save/v1/PageSetup';
import { ParagraphStyle as ParagraphStyle_v1 } from '@/models/save/v1/Style';
import { Score } from '@/models/Score';
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

function loadLegacyDefaultParagraphStyle(
  pageSetupOverrides: Partial<PageSetup_v1> = {},
) {
  return loadLegacyBuiltInStyle(
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    pageSetupOverrides,
  );
}

function loadLegacyBuiltInStyle(
  styleId: string,
  pageSetupOverrides: Partial<PageSetup_v1> = {},
) {
  const score = SaveService.LoadScoreFromJson(
    createLegacyScore(pageSetupOverrides),
  );

  return resolveParagraphStyle(score.paragraphStyles, styleId);
}

function createParagraphStylesWithBuiltInOverrides(
  overridesByStyleId: Partial<
    Record<BuiltInParagraphStyleId, ParagraphStyleOverrides>
  >,
) {
  const styles = createDefaultParagraphStyles();

  for (const style of styles) {
    const overrides = overridesByStyleId[style.id as BuiltInParagraphStyleId];

    if (overrides != null) {
      style.overrides = { ...style.overrides, ...overrides };
    }
  }

  return styles;
}

function loadLegacyElement(
  legacyElement: DropCapElement_v1 | NoteElement_v1 | TextBoxElement_v1,
  paragraphStyles?: ParagraphStyle[],
) {
  const saved = createLegacyScore({
    textBoxDefaultFontFamily: 'Source Serif',
  });

  saved.staff.elements = [legacyElement];

  if (paragraphStyles != null) {
    saved.paragraphStyles = paragraphStyles.map((style) =>
      SaveService.SaveParagraphStyle(style),
    );
  }

  return SaveService.LoadScore_v1(saved).staff.elements[0];
}

function loadLegacyTextBox(
  legacy: TextBoxElement_v1,
  paragraphStyles?: ParagraphStyle[],
) {
  return loadLegacyElement(legacy, paragraphStyles) as TextBoxElement;
}

function loadLegacyNote(
  legacy: NoteElement_v1,
  paragraphStyles?: ParagraphStyle[],
) {
  return loadLegacyElement(legacy, paragraphStyles) as NoteElement;
}

function loadLegacyDropCap(
  legacy: DropCapElement_v1,
  paragraphStyles?: ParagraphStyle[],
) {
  return loadLegacyElement(legacy, paragraphStyles) as DropCapElement;
}

describe('SaveService font styles', () => {
  it('loads legacy text box bold/italic booleans as a font style', () => {
    const legacy = new TextBoxElement_v1();

    legacy.useDefaultStyle = false;
    legacy.bold = true;
    legacy.italic = true;

    const element = loadLegacyTextBox(legacy);

    expect(element.fontStyle).toBe('Bold Italic');
  });

  it('loads legacy page setup weight/style pairs as font styles', () => {
    const lyricsStyle = loadLegacyBuiltInStyle(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
      {
        lyricsDefaultFontWeight: '600',
      },
    );
    const dropCapStyle = loadLegacyBuiltInStyle(
      BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
      {
        dropCapDefaultFontWeight: '700',
        dropCapDefaultFontStyle: 'italic',
      },
    );
    const defaultParagraphStyle = loadLegacyDefaultParagraphStyle({
      textBoxDefaultFontStyle: 'italic',
    });

    expect(dropCapStyle.fontStyle).toBe('Bold Italic');
    expect(lyricsStyle.fontStyle).toBe('Semibold');
    expect(defaultParagraphStyle.fontStyle).toBe('Italic');
  });

  it('loads legacy page setup face names as base families and styles', () => {
    const lyricsStyle = loadLegacyBuiltInStyle(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
      {
        lyricsDefaultFontFamily: 'Minion Pro Semibold',
      },
    );
    const dropCapStyle = loadLegacyBuiltInStyle(
      BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
      {
        dropCapDefaultFontFamily: 'Minion Pro Semibold',
      },
    );
    const defaultParagraphStyle = loadLegacyDefaultParagraphStyle({
      textBoxDefaultFontFamily: 'Minion Pro Semibold',
    });

    expect(lyricsStyle.fontFamily).toBe('Minion Pro');
    expect(lyricsStyle.fontStyle).toBe('Semibold');
    expect(dropCapStyle.fontFamily).toBe('Minion Pro');
    expect(dropCapStyle.fontStyle).toBe('Semibold');
    expect(defaultParagraphStyle.fontFamily).toBe('Minion Pro');
    expect(defaultParagraphStyle.fontStyle).toBe('Semibold');
  });

  it('merges legacy page setup numeric weights into face-name styles', () => {
    const defaultParagraphStyle = loadLegacyDefaultParagraphStyle({
      textBoxDefaultFontFamily: 'Source Serif Caption',
      textBoxDefaultFontWeight: '600',
    });

    expect(defaultParagraphStyle.fontFamily).toBe('Source Serif');
    expect(defaultParagraphStyle.fontStyle).toBe('Caption Semibold');
  });

  it('remaps legacy numeric weights to the catalog face spelling', () => {
    const defaultParagraphStyle = loadLegacyDefaultParagraphStyle({
      textBoxDefaultFontFamily: 'Source Serif',
      textBoxDefaultFontWeight: '200',
    });

    expect(defaultParagraphStyle.fontStyle).toBe('ExtraLight');
  });

  it('loads legacy lyrics weight/style pairs as a font style', () => {
    const legacy = new NoteElement_v1();

    legacy.lyricsUseDefaultStyle = false;
    legacy.lyricsFontWeight = '700';
    legacy.lyricsFontStyle = 'italic';

    const element = loadLegacyNote(legacy);

    expect(element.lyricsFontStyle).toBe('Bold Italic');
  });

  it('loads legacy lyrics face names as base families and styles', () => {
    const legacy = new NoteElement_v1();

    legacy.lyricsUseDefaultStyle = false;
    legacy.lyricsFontFamily = 'Minion Pro Semibold';

    const element = loadLegacyNote(legacy);

    expect(element.lyricsFontFamily).toBe('Minion Pro');
    expect(element.lyricsFontStyle).toBe('Semibold');
  });

  it('loads legacy drop-cap face names as base families and styles', () => {
    const legacy = new DropCapElement_v1();

    legacy.fontFamily = 'Minion Pro Semibold';

    const element = loadLegacyDropCap(legacy);

    expect(element.fontFamily).toBe('Minion Pro');
    expect(element.fontStyle).toBe('Semibold');
  });

  it('loads legacy text box face names as base families and styles', () => {
    const legacy = new TextBoxElement_v1();

    legacy.useDefaultStyle = false;
    legacy.fontFamily = 'Minion Pro Semibold';

    const element = loadLegacyTextBox(legacy);

    expect(element.fontFamily).toBe('Minion Pro');
    expect(element.fontStyle).toBe('Semibold');
  });

  it('loads current font face style fields', () => {
    const pageSetup = new PageSetup();
    const dropCap = new DropCapElement();
    const dropCapSave = new DropCapElement_v1();
    const note = new NoteElement();
    const noteSave = new NoteElement_v1();
    const textBox = new TextBoxElement();
    const textBoxSave = new TextBoxElement_v1();

    dropCapSave.fontSubfamily = 'Semibold';
    noteSave.lyricsUseDefaultStyle = false;
    noteSave.lyricsFontSubfamily = 'Bold Italic';
    textBoxSave.useDefaultStyle = false;
    textBoxSave.fontSubfamily = 'Caption Semibold';

    const lyricsStyle = loadLegacyBuiltInStyle(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
      {
        lyricsDefaultFontSubfamily: 'Semibold',
      },
    );
    const dropCapStyle = loadLegacyBuiltInStyle(
      BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
      {
        dropCapDefaultFontSubfamily: 'Caption',
      },
    );
    SaveService.LoadDropCap_v1(dropCap, dropCapSave, pageSetup);
    SaveService.LoadNote_v1(note, noteSave);
    SaveService.LoadTextBox_v1(textBox, textBoxSave);
    const defaultParagraphStyle = loadLegacyDefaultParagraphStyle({
      textBoxDefaultFontSubfamily: 'Bold Italic',
    });

    expect(lyricsStyle.fontStyle).toBe('Semibold');
    expect(dropCapStyle.fontStyle).toBe('Caption');
    expect(defaultParagraphStyle.fontStyle).toBe('Bold Italic');
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

  it('omits the default lyrics paragraph style id when saving notes', () => {
    const element = new NoteElement();
    const saved = new NoteElement_v1();

    SaveService.SaveNote(saved, element);

    expect(saved.lyricsParagraphStyleId).toBeUndefined();
  });

  it('saves non-default note lyrics paragraph style ids explicitly', () => {
    const element = new NoteElement();
    const saved = new NoteElement_v1();

    element.lyricsParagraphStyleId = 'custom-lyrics';

    SaveService.SaveNote(saved, element);

    expect(saved.lyricsParagraphStyleId).toBe('custom-lyrics');
  });

  it('saves explicit text-box normal line height as null', () => {
    const element = new TextBoxElement();
    const saved = new TextBoxElement_v1();

    element.lineHeight = null;

    SaveService.SaveTextBox(saved, element);

    expect(saved.lineHeight).toBeNull();
  });

  it('loads explicit and omitted text-box line height values as-is', () => {
    const omitted = new TextBoxElement_v1();
    const explicit = new TextBoxElement_v1();
    const omittedElement = new TextBoxElement();
    const explicitElement = new TextBoxElement();

    explicit.lineHeight = null;

    SaveService.LoadTextBox_v1(omittedElement, omitted);
    SaveService.LoadTextBox_v1(explicitElement, explicit);

    expect(omittedElement.lineHeight).toBeUndefined();
    expect(explicitElement.lineHeight).toBeNull();
  });

  it('round-trips explicit normal text-box line height through inherited numeric paragraph styles', () => {
    const paragraphStyles = createParagraphStylesWithBuiltInOverrides({
      [BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText]: {
        lineHeight: 1.7,
      },
    });
    const element = new TextBoxElement();
    const saved = new TextBoxElement_v1();

    element.lineHeight = null;

    SaveService.SaveTextBox(saved, element);

    const loaded = new TextBoxElement();
    SaveService.LoadTextBox_v1(loaded, saved);

    expect(saved.lineHeight).toBeNull();
    expect(loaded.lineHeight).toBeNull();
    expect(
      resolveParagraphStyle(
        paragraphStyles,
        loaded.paragraphStyleId,
        loaded.getParagraphStyleOverrides(),
      ).lineHeight,
    ).toBeNull();
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

  it('loads sparse current notes without legacy page setup defaults as Lyrics', () => {
    const legacy = createLegacyScore();
    const note = new NoteElement_v1();

    note.lyricsFontFamily = 'Minion Pro';
    note.lyricsFontSubfamily = 'Regular';

    legacy.staff.elements = [note];

    const loaded = SaveService.LoadScore_v1(legacy);
    const element = loaded.staff.elements[0] as NoteElement;

    expect(element.lyricsParagraphStyleId).toBe('lyrics');
    expect(element.lyricsFontFamily).toBe('Minion Pro');
    expect(element.lyricsFontStyle).toBe('Regular');
  });

  it('migrates legacy note lyric overrides when page setup defaults are present', () => {
    const legacy = createLegacyScore({
      lyricsDefaultFontFamily: 'Minion Pro',
    });
    const note = new NoteElement_v1();

    note.lyricsFontFamily = 'Minion Pro';
    note.lyricsFontSubfamily = 'Regular';

    legacy.staff.elements = [note];

    const loaded = SaveService.LoadScore_v1(legacy);
    const element = loaded.staff.elements[0] as NoteElement;

    expect(element.lyricsParagraphStyleId).toBe('lyrics');
    expect(element.lyricsFontFamily).toBeNull();
    expect(element.lyricsFontStyle).toBeNull();
  });

  it('assigns built-in style ids when loading legacy text boxes', () => {
    const legacyBody = new TextBoxElement_v1();
    const legacyInline = new TextBoxElement_v1();

    legacyInline.inline = true;

    const body = loadLegacyTextBox(legacyBody);
    const inline = loadLegacyTextBox(legacyInline);

    expect(body.paragraphStyleId).toBe('default-text');
    expect(inline.paragraphStyleId).toBe('lyrics');
  });

  it('omits default paragraph style ids when saving text boxes and drop caps', () => {
    const body = new TextBoxElement();
    const inline = new TextBoxElement();
    const dropCap = new DropCapElement();
    const savedBody = new TextBoxElement_v1();
    const savedInline = new TextBoxElement_v1();
    const savedDropCap = new DropCapElement_v1();

    inline.inline = true;
    inline.paragraphStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics;

    SaveService.SaveTextBox(savedBody, body);
    SaveService.SaveTextBox(savedInline, inline);
    SaveService.SaveDropCap(savedDropCap, dropCap);

    expect(savedBody.paragraphStyleId).toBeUndefined();
    expect(savedInline.paragraphStyleId).toBeUndefined();
    expect(savedDropCap.paragraphStyleId).toBeUndefined();
  });

  it('saves non-default text box and drop-cap paragraph style ids explicitly', () => {
    const body = new TextBoxElement();
    const dropCap = new DropCapElement();
    const savedBody = new TextBoxElement_v1();
    const savedDropCap = new DropCapElement_v1();

    body.paragraphStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.Header;
    dropCap.paragraphStyleId = 'custom-drop-cap';

    SaveService.SaveTextBox(savedBody, body);
    SaveService.SaveDropCap(savedDropCap, dropCap);

    expect(savedBody.paragraphStyleId).toBe(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Header,
    );
    expect(savedDropCap.paragraphStyleId).toBe('custom-drop-cap');
  });

  it('loads old scores without paragraphStyles by seeding defaults', () => {
    const loaded = SaveService.LoadScoreFromJson(createLegacyScore());

    expect(loaded.paragraphStyles.length).toBeGreaterThan(0);
  });

  it('fills missing built-in paragraph styles when only custom styles are saved', () => {
    const saved = createLegacyScore();
    const customStyle = new ParagraphStyle();

    customStyle.id = 'custom-style';
    customStyle.displayName = 'Custom Style';
    customStyle.parentStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
    customStyle.overrides.fontSize = 99;

    saved.paragraphStyles = [SaveService.SaveParagraphStyle(customStyle)];

    const loaded = SaveService.LoadScore_v1(saved);
    const builtInIds = Object.values(BUILT_IN_PARAGRAPH_STYLE_IDS);

    expect(
      loaded.paragraphStyles
        .slice(0, builtInIds.length)
        .map((style) => style.id),
    ).toEqual(builtInIds);
    expect(loaded.paragraphStyles.at(-1)?.id).toBe('custom-style');
  });

  it('fills missing built-in paragraph styles when only one built-in style is saved', () => {
    const saved = createLegacyScore();
    const titleStyle = new ParagraphStyle();

    titleStyle.id = BUILT_IN_PARAGRAPH_STYLE_IDS.Title;
    titleStyle.displayName = 'Custom Title';
    titleStyle.parentStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
    titleStyle.overrides.fontSize = 77;

    saved.paragraphStyles = [SaveService.SaveParagraphStyle(titleStyle)];

    const loaded = SaveService.LoadScore_v1(saved);
    const builtInIds = Object.values(BUILT_IN_PARAGRAPH_STYLE_IDS);

    expect(
      loaded.paragraphStyles
        .slice(0, builtInIds.length)
        .map((style) => style.id),
    ).toEqual(builtInIds);
    expect(
      resolveParagraphStyle(
        loaded.paragraphStyles,
        BUILT_IN_PARAGRAPH_STYLE_IDS.Title,
      ).fontSize,
    ).toBe(77);
  });

  it('round-trips a custom parentless paragraph style without saving parentStyleId', () => {
    const style = new ParagraphStyle();

    style.id = 'custom-root';
    style.displayName = 'Custom Root';
    style.parentStyleId = null;
    style.overrides.fontSize = 18;

    const saved = SaveService.SaveParagraphStyle(style);
    const loaded = SaveService.LoadParagraphStyle_v1(saved);

    expect(saved.parentStyleId).toBeUndefined();
    expect(loaded.parentStyleId).toBeNull();
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
    const chapterStyle = new ParagraphStyle();

    chapterStyle.id = BUILT_IN_PARAGRAPH_STYLE_IDS.Chapter;
    chapterStyle.displayName = 'Chapter';
    chapterStyle.parentStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;

    saved.paragraphStyles = [SaveService.SaveParagraphStyle(chapterStyle)];

    const loaded = SaveService.LoadScore_v1(saved);
    const defaultParagraphStyle = resolveParagraphStyle(
      loaded.paragraphStyles,
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );

    expect(defaultParagraphStyle.fontFamily).toBe('Minion Pro');
    expect(defaultParagraphStyle.fontStyle).toBe('Semibold Italic');
    expect(defaultParagraphStyle.fontSize).toBe(42);
    expect(defaultParagraphStyle.color).toBe('#123456');
    expect(defaultParagraphStyle.strokeWidth).toBe(3);
    expect(defaultParagraphStyle.lineHeight).toBe(1.7);
  });

  it('keeps a saved built-in paragraph style instead of overwriting it with generated defaults', () => {
    const saved = createLegacyScore({
      textBoxDefaultFontFamily: 'Source Serif',
      textBoxDefaultFontStyle: 'italic',
      textBoxDefaultFontSize: 42,
    });
    const defaultParagraphStyle = new ParagraphStyle();

    defaultParagraphStyle.id = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
    defaultParagraphStyle.displayName = 'Default Text';
    defaultParagraphStyle.overrides.fontFamily = 'Alegreya';
    defaultParagraphStyle.overrides.fontSize = 64;
    defaultParagraphStyle.overrides.fontStyle = 'Semibold';

    saved.paragraphStyles = [
      SaveService.SaveParagraphStyle(defaultParagraphStyle),
    ];

    const loaded = SaveService.LoadScore_v1(saved);
    const resolvedDefaultText = resolveParagraphStyle(
      loaded.paragraphStyles,
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );

    expect(resolvedDefaultText.fontFamily).toBe('Alegreya');
    expect(resolvedDefaultText.fontSize).toBe(64);
    expect(resolvedDefaultText.fontStyle).toBe('Semibold');
  });

  it('preserves legacy non-default text box styling as element overrides', () => {
    const legacy = new TextBoxElement_v1();

    legacy.useDefaultStyle = false;
    legacy.fontFamily = 'Minion Pro';
    legacy.fontSubfamily = 'Semibold';
    legacy.fontSize = 18;
    legacy.color = '#123456';
    legacy.strokeWidth = 2;
    legacy.lineHeight = 1.5;

    const element = loadLegacyTextBox(legacy);

    expect(element.fontFamily).toBe('Minion Pro');
    expect(element.fontStyle).toBe('Semibold');
    expect(element.fontSize).toBe(18);
    expect(element.color).toBe('#123456');
    expect(element.strokeWidth).toBe(2);
    expect(element.lineHeight).toBe(1.5);
  });

  it('keeps a legacy regular font style as an explicit override', () => {
    const paragraphStyles = createParagraphStylesWithBuiltInOverrides({
      [BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText]: { fontStyle: 'Italic' },
    });
    const legacy = new TextBoxElement_v1();

    legacy.useDefaultStyle = false;
    legacy.fontSubfamily = 'Regular';

    const element = loadLegacyTextBox(legacy, paragraphStyles);

    expect(element.fontStyle).toBe('Regular');
    expect(
      resolveParagraphStyle(
        paragraphStyles,
        element.paragraphStyleId,
        element.getParagraphStyleOverrides(),
      ).fontStyle,
    ).toBe('Regular');
  });

  it('defaults legacy non-default text boxes to an explicit regular override', () => {
    const paragraphStyles = createParagraphStylesWithBuiltInOverrides({
      [BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText]: { fontStyle: 'Italic' },
    });
    const legacy = new TextBoxElement_v1();

    legacy.useDefaultStyle = false;

    const element = loadLegacyTextBox(legacy, paragraphStyles);

    expect(element.paragraphStyleId).toBe('default-text');
    expect(element.fontStyle).toBe('Regular');
    expect(
      resolveParagraphStyle(
        paragraphStyles,
        element.paragraphStyleId,
        element.getParagraphStyleOverrides(),
      ).fontStyle,
    ).toBe('Regular');
  });

  it('keeps legacy css normal font style as an explicit regular override', () => {
    const paragraphStyles = createParagraphStylesWithBuiltInOverrides({
      [BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText]: { fontStyle: 'Italic' },
    });
    const legacy = new TextBoxElement_v1() as TextBoxElement_v1 & {
      fontStyle?: string;
    };

    legacy.useDefaultStyle = false;
    legacy.fontStyle = 'normal';

    const element = loadLegacyTextBox(legacy, paragraphStyles);

    expect(element.fontStyle).toBe('Regular');
    expect(
      resolveParagraphStyle(
        paragraphStyles,
        element.paragraphStyleId,
        element.getParagraphStyleOverrides(),
      ).fontStyle,
    ).toBe('Regular');
  });

  it('keeps legacy css italic font style as an explicit italic override', () => {
    const paragraphStyles = createParagraphStylesWithBuiltInOverrides({
      [BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText]: { fontStyle: 'Regular' },
    });
    const legacy = new TextBoxElement_v1() as TextBoxElement_v1 & {
      fontStyle?: string;
    };

    legacy.useDefaultStyle = false;
    legacy.fontStyle = 'italic';

    const element = loadLegacyTextBox(legacy, paragraphStyles);

    expect(element.fontStyle).toBe('Italic');
    expect(
      resolveParagraphStyle(
        paragraphStyles,
        element.paragraphStyleId,
        element.getParagraphStyleOverrides(),
      ).fontStyle,
    ).toBe('Italic');
  });

  it('combines legacy css font style with bold text box flags', () => {
    const paragraphStyles = createParagraphStylesWithBuiltInOverrides({
      [BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText]: { fontStyle: 'Italic' },
    });
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

    const normalBold = loadLegacyTextBox(legacyNormalBold, paragraphStyles);
    const italicBold = loadLegacyTextBox(legacyItalicBold, paragraphStyles);

    expect(normalBold.fontStyle).toBe('Bold');
    expect(italicBold.fontStyle).toBe('Bold Italic');
  });

  it('preserves legacy non-default text box styling when false was omitted', () => {
    const legacy = new TextBoxElement_v1();

    legacy.fontFamily = 'Minion Pro';
    legacy.fontSubfamily = 'Semibold';
    legacy.fontSize = 18;
    legacy.color = '#123456';
    legacy.strokeWidth = 2;
    legacy.lineHeight = 1.5;

    const element = loadLegacyTextBox(legacy);

    expect(element.fontFamily).toBe('Minion Pro');
    expect(element.fontStyle).toBe('Semibold');
    expect(element.fontSize).toBe(18);
    expect(element.color).toBe('#123456');
    expect(element.strokeWidth).toBe(2);
    expect(element.lineHeight).toBe(1.5);
  });

  it('loads only saved legacy text box overrides', () => {
    const legacy = new TextBoxElement_v1();

    legacy.useDefaultStyle = false;
    legacy.fontSize = 18;

    const element = loadLegacyTextBox(legacy);

    expect(element.fontFamily).toBeNull();
    expect(element.fontStyle).toBeNull();
    expect(element.fontSize).toBe(18);
    expect(element.color).toBeNull();
    expect(element.strokeWidth).toBeNull();
    expect(element.lineHeight).toBeUndefined();
  });

  it('keeps legacy default-styled text boxes inherited', () => {
    const paragraphStyles = createParagraphStylesWithBuiltInOverrides({
      [BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText]: {
        fontFamily: 'Minion Pro',
        fontSize: 42,
        fontStyle: 'Semibold',
        color: '#654321',
        strokeWidth: 3,
        lineHeight: 1.7,
      },
    });
    const legacy = new TextBoxElement_v1();

    legacy.useDefaultStyle = true;
    legacy.fontFamily = 'Source Serif';
    legacy.fontSize = 16;
    legacy.color = '#000000';
    legacy.strokeWidth = 0;

    const element = loadLegacyTextBox(legacy, paragraphStyles);

    expect(element.fontFamily).toBeNull();
    expect(element.fontSize).toBeNull();
    expect(element.fontStyle).toBeNull();
    expect(element.strokeWidth).toBeNull();
    expect(element.color).toBeNull();
    expect(element.lineHeight).toBeUndefined();
  });

  it('loads saved paragraph-style text box overrides without useDefaultStyle', () => {
    const element = new TextBoxElement();
    const saved = new TextBoxElement_v1();

    saved.paragraphStyleId = 'title';
    saved.fontFamily = 'Minion Pro';
    saved.fontSubfamily = 'Semibold';
    saved.fontSize = 18;
    saved.color = '#123456';
    saved.strokeWidth = 2;
    saved.lineHeight = 1.5;

    SaveService.LoadTextBox_v1(element, saved);

    expect(element.paragraphStyleId).toBe('title');
    expect(element.fontFamily).toBe('Minion Pro');
    expect(element.fontStyle).toBe('Semibold');
    expect(element.fontSize).toBe(18);
    expect(element.color).toBe('#123456');
    expect(element.strokeWidth).toBe(2);
    expect(element.lineHeight).toBe(1.5);
  });

  it('loads only saved paragraph-style text box overrides', () => {
    const element = new TextBoxElement();
    const saved = new TextBoxElement_v1();

    saved.paragraphStyleId = 'title';
    saved.fontSize = 18;

    SaveService.LoadTextBox_v1(element, saved);

    expect(element.paragraphStyleId).toBe('title');
    expect(element.fontFamily).toBeNull();
    expect(element.fontStyle).toBeNull();
    expect(element.fontSize).toBe(18);
    expect(element.color).toBeNull();
    expect(element.strokeWidth).toBeNull();
    expect(element.lineHeight).toBeUndefined();
  });

  it('keeps saved paragraph-style text boxes inherited when no overrides exist', () => {
    const element = new TextBoxElement();
    const saved = new TextBoxElement_v1();

    saved.paragraphStyleId = 'title';

    SaveService.LoadTextBox_v1(element, saved);

    expect(element.paragraphStyleId).toBe('title');
    expect(element.fontFamily).toBeNull();
    expect(element.fontSize).toBeNull();
    expect(element.fontStyle).toBeNull();
    expect(element.strokeWidth).toBeNull();
    expect(element.color).toBeNull();
    expect(element.lineHeight).toBeUndefined();
  });

  it('saves and loads paragraph-style alignment', () => {
    const style = new ParagraphStyle();
    style.id = 'custom';
    style.displayName = 'Custom';
    style.overrides.alignment = TextBoxAlignment.Right;

    const saved = SaveService.SaveParagraphStyle(style);
    const loaded = SaveService.LoadParagraphStyle_v1(saved);

    expect(saved.alignment).toBe(TextBoxAlignment.Right);
    expect(loaded.overrides.alignment).toBe(TextBoxAlignment.Right);
  });

  it('saves and loads paragraph-style text decoration', () => {
    const style = new ParagraphStyle();
    style.id = 'custom';
    style.displayName = 'Custom';
    style.overrides.textDecoration = 'underline';

    const saved = SaveService.SaveParagraphStyle(style);
    const loaded = SaveService.LoadParagraphStyle_v1(saved);

    expect(saved.textDecoration).toBe('underline');
    expect(loaded.overrides.textDecoration).toBe('underline');
    expect(resolveParagraphStyle([loaded], loaded.id).textDecoration).toBe(
      'underline',
    );
  });

  it('loads old paragraph styles without text decoration as null', () => {
    const saved = new ParagraphStyle_v1();
    saved.id = 'legacy';
    saved.displayName = 'Legacy';

    const loaded = SaveService.LoadParagraphStyle_v1(saved);

    expect(
      resolveParagraphStyle([loaded], loaded.id).textDecoration,
    ).toBeNull();
  });

  it('defaults missing text-box alignment to the paragraph style', () => {
    const element = new TextBoxElement();
    const saved = new TextBoxElement_v1();
    const paragraphStyles = [new ParagraphStyle()];

    paragraphStyles[0].id = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
    paragraphStyles[0].overrides.alignment = TextBoxAlignment.Center;
    saved.paragraphStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
    saved.alignment = undefined;

    SaveService.LoadTextBox_v1(element, saved);

    expect(element.alignment).toBeNull();
    expect(
      resolveParagraphStyle(
        paragraphStyles,
        element.paragraphStyleId,
        element.getParagraphStyleOverrides(),
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

    expect('paragraphStyleId' in saved).toBe(false);
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
    SaveService.LoadTextBox_v1(textBox, textBoxSave);
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
    const lyricsStyle = loadLegacyBuiltInStyle(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
      {
        lyricsDefaultFontFamily: 'Minion Pro Semibold',
        lyricsDefaultFontSize: 33,
        lyricsDefaultColor: '#123456',
        lyricsDefaultStrokeWidth: 2,
      },
    );

    expect(lyricsStyle.fontFamily).toBe('Minion Pro');
    expect(lyricsStyle.fontStyle).toBe('Semibold');
    expect(lyricsStyle.fontSize).toBe(33);
    expect(lyricsStyle.color).toBe('#123456');
    expect(lyricsStyle.strokeWidth).toBe(2);
  });

  it('loads legacy drop-cap defaults into the built-in Drop Cap style', () => {
    const dropCapStyle = loadLegacyBuiltInStyle(
      BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
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

  it('loads omitted and explicit drop-cap line height values as-is', () => {
    const pageSetup = new PageSetup();
    const omitted = new DropCapElement_v1();
    const explicit = new DropCapElement_v1();
    const omittedElement = new DropCapElement();
    const explicitElement = new DropCapElement();

    explicit.lineHeight = null;

    SaveService.LoadDropCap_v1(omittedElement, omitted, pageSetup);
    SaveService.LoadDropCap_v1(explicitElement, explicit, pageSetup);

    expect(omittedElement.lineHeight).toBeUndefined();
    expect(explicitElement.lineHeight).toBeNull();
  });

  it('uses built-in Lyrics style as the fallback for legacy note overrides', () => {
    const paragraphStyles = createParagraphStylesWithBuiltInOverrides({
      [BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics]: {
        fontFamily: 'Minion Pro',
        fontStyle: 'Semibold',
        fontSize: 15,
        color: '#abcdef',
        strokeWidth: 3,
      },
    });
    const legacy = new NoteElement_v1();

    legacy.lyricsUseDefaultStyle = false;
    legacy.lyricsFontSubfamily = 'Italic';

    const element = loadLegacyNote(legacy, paragraphStyles);

    const resolvedLyricsStyle = resolveParagraphStyle(
      paragraphStyles,
      element.lyricsParagraphStyleId,
      element.getParagraphStyleOverrides(),
    );

    expect(element.lyricsFontFamily).toBeNull();
    expect(element.lyricsFontStyle).toBe('Italic');
    expect(element.lyricsFontSize).toBeNull();
    expect(element.lyricsColor).toBeNull();
    expect(element.lyricsStrokeWidth).toBeNull();
    expect(resolvedLyricsStyle.fontFamily).toBe('Minion Pro');
    expect(resolvedLyricsStyle.fontStyle).toBe('Italic');
    expect(resolvedLyricsStyle.fontSize).toBe(15);
    expect(resolvedLyricsStyle.color).toBe('#abcdef');
    expect(resolvedLyricsStyle.strokeWidth).toBe(3);
  });

  it('uses built-in Drop Cap style as the fallback for legacy drop-cap overrides', () => {
    const paragraphStyles = createParagraphStylesWithBuiltInOverrides({
      [BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap]: {
        fontFamily: 'Minion Pro',
        fontStyle: 'Semibold',
        fontSize: 80,
        color: '#fedcba',
        strokeWidth: 5,
        lineHeight: 1.25,
      },
    });
    const legacy = new DropCapElement_v1();

    legacy.fontFamily = undefined as unknown as string;
    legacy.fontSize = undefined as unknown as number;
    legacy.color = undefined as unknown as string;
    legacy.strokeWidth = undefined as unknown as number;
    legacy.fontSubfamily = 'Italic';
    legacy.lineHeight = undefined;

    const element = loadLegacyDropCap(legacy, paragraphStyles);

    const resolvedDropCapStyle = resolveParagraphStyle(
      paragraphStyles,
      element.paragraphStyleId,
      element.getParagraphStyleOverrides(),
    );

    expect(element.fontFamily).toBeNull();
    expect(element.fontStyle).toBe('Italic');
    expect(element.fontSize).toBeNull();
    expect(element.color).toBeNull();
    expect(element.strokeWidth).toBeNull();
    expect(element.lineHeight).toBeUndefined();
    expect(resolvedDropCapStyle.fontFamily).toBe('Minion Pro');
    expect(resolvedDropCapStyle.fontStyle).toBe('Italic');
    expect(resolvedDropCapStyle.fontSize).toBe(80);
    expect(resolvedDropCapStyle.color).toBe('#fedcba');
    expect(resolvedDropCapStyle.strokeWidth).toBe(5);
    expect(resolvedDropCapStyle.lineHeight).toBe(1.25);
  });

  it('keeps legacy explicit normal drop-cap line height as an override', () => {
    const paragraphStyles = createParagraphStylesWithBuiltInOverrides({
      [BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap]: {
        lineHeight: 1.7,
      },
    });
    const legacy = new DropCapElement_v1();

    legacy.lineHeight = null;

    const element = loadLegacyDropCap(legacy, paragraphStyles);

    expect(element.lineHeight).toBeNull();
    expect(
      resolveParagraphStyle(
        paragraphStyles,
        element.paragraphStyleId,
        element.getParagraphStyleOverrides(),
      ).lineHeight,
    ).toBeNull();
  });

  it('saves explicit normal drop-cap line height as null', () => {
    const element = new DropCapElement();
    const saved = new DropCapElement_v1();

    element.lineHeight = null;

    SaveService.SaveDropCap(saved, element);

    expect(saved.lineHeight).toBeNull();
  });

  it('round-trips explicit normal drop-cap line height through inherited numeric paragraph styles', () => {
    const paragraphStyles = createParagraphStylesWithBuiltInOverrides({
      [BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap]: {
        lineHeight: 1.7,
      },
    });
    const element = new DropCapElement();
    const saved = new DropCapElement_v1();

    element.lineHeight = null;

    SaveService.SaveDropCap(saved, element);

    const loaded = new DropCapElement();
    SaveService.LoadDropCap_v1(loaded, saved, new PageSetup());

    expect(saved.lineHeight).toBeNull();
    expect(loaded.lineHeight).toBeNull();
    expect(
      resolveParagraphStyle(
        paragraphStyles,
        loaded.paragraphStyleId,
        loaded.getParagraphStyleOverrides(),
      ).lineHeight,
    ).toBeNull();
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
