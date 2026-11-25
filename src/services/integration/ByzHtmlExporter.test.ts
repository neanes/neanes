import { describe, expect, it } from 'vitest';

import {
  getModeKeyModelAttributes,
  replaceModeKeysInHtml,
  serializeModeKeyAttributes,
} from '@/ckeditor-plugins/insertmodekey/modekeydata';
import {
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  TextBoxAlignment,
  TextBoxElement,
} from '@/models/Element';
import { styleFromWording } from '@/models/InitialMartyriaStyle.testHelpers';
import { modeKeyTemplates } from '@/models/ModeKeys';
import {
  Fthora,
  GorgonNeume,
  Ison,
  ModeSign,
  QuantitativeNeume,
  TempoSign,
  TimeNeume,
} from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  ParagraphStyle,
} from '@/models/ParagraphStyle';
import { Score } from '@/models/Score';
import { fontCatalog } from '@/services/FontCatalog';
import { setRichTextLanguage } from '@/utils/richTextLanguage';
import { Unit } from '@/utils/Unit';

import glyphnames from '../../assets/fonts/sbmufl/glyphnames.json';
import type { SbmuflGlyphName } from './../NeumeMappingService';
import { ByzHtmlExporter, createByzHtmlDocument } from './ByzHtmlExporter';

function createComputedTextBox(overrides: Partial<TextBoxElement> = {}) {
  const element = new TextBoxElement();

  element.computedAlignment = TextBoxAlignment.Left;
  element.computedColor = '#000000';
  element.computedFontFamily = 'Source Serif';
  element.computedFontSize = Unit.fromPt(12);
  element.computedFontWeight = '400';
  element.computedFontStyle = 'normal';
  element.computedStrokeWidth = 0;
  element.computedLineHeight = null;

  return Object.assign(element, overrides);
}

function embeddedModeKeyHtml(element = new ModeKeyElement(), content = '') {
  const payload = serializeModeKeyAttributes(
    getModeKeyModelAttributes(element),
  );
  return `<span class="neanes-ck-mode-key" data-neanes-mode-key="${payload}">${content}</span>`;
}

describe('ByzHtmlExporter', () => {
  it('exports the low Ga ison indicator', () => {
    const exporter = new ByzHtmlExporter();
    const note = new NoteElement();
    note.ison = Ison.GaLow;

    const html = exporter.exportNote(note, new PageSetup(), [], 0);

    expect(html).toContain('<x-ii-ga-low');
    expect(html).not.toContain('undefined');
  });

  it('exports a right-aligned martyria fthora after its quantitative neume', () => {
    const exporter = new ByzHtmlExporter();
    const martyria = new MartyriaElement();
    martyria.alignRight = true;
    martyria.quantitativeNeume = QuantitativeNeume.OligonPlusKentimaAbove;
    martyria.quantitativeNeumeFthora = Fthora.Zygos_Top;
    martyria.quantitativeNeumeSpacing = Unit.fromPt(6);

    const html = exporter.exportMartyria(martyria, new PageSetup(), 0);
    const quantitativeNeumeIndex = html.indexOf('<x-o3');
    const fthoraIndex = html.indexOf('<x-f-zygos');

    expect(quantitativeNeumeIndex).toBeGreaterThan(-1);
    expect(fthoraIndex).toBeGreaterThan(quantitativeNeumeIndex);
    expect(html).toContain('style="margin-left: 6pt;"');
  });

  it('exports spacing before the right martyria tempo', () => {
    const exporter = new ByzHtmlExporter();
    const martyria = new MartyriaElement();
    martyria.tempoRight = TempoSign.Moderate;
    martyria.tempoRightSpacing = Unit.fromPt(4);

    const html = exporter.exportMartyria(martyria, new PageSetup(), 0);

    expect(html).toContain('style="margin-left: 4pt;"');
  });

  it('should have a tag mapping for every glyphname', () => {
    const exporter = new ByzHtmlExporter();

    const exceptions: SbmuflGlyphName[] = [
      'fthoraDiatonicNiLow',
      'fthoraDiatonicPa',
      'fthoraDiatonicVou',
      'fthoraDiatonicGa',
      'fthoraDiatonicDi',
      'fthoraDiatonicKe',
      'fthoraDiatonicZo',
      'fthoraDiatonicNiHigh',
      'fthoraHardChromaticPa',
      'fthoraHardChromaticDi',
      'fthoraSoftChromaticDi',
      'fthoraSoftChromaticKe',
      'fthoraEnharmonic',
      'chroaZygos',
      'chroaKliton',
      'chroaSpathi',
    ];

    expect(
      Object.keys(glyphnames)
        .filter((x) => !exceptions.includes(x as SbmuflGlyphName))
        .every((x) => exporter.getTag(x as SbmuflGlyphName) !== undefined),
    ).toBe(true);
  });

  it('exports rich text box language from element metadata', () => {
    const exporter = new ByzHtmlExporter();
    const element = new RichTextBoxElement();

    element.content = '<p><span lang="ar" dir="rtl">Hello</span></p>';
    setRichTextLanguage(element, 'ar', 'rtl');

    expect(exporter.exportRichTextBox(element, new PageSetup(), 0)).toBe(
      '<div class="byz---rich-text-box" lang="ar" dir="rtl"><p><span lang="ar" dir="rtl">Hello</span></p></div\n>',
    );
  });

  it('replaces an embedded mode key containing the CKEditor filler', () => {
    const modeKey = ModeKeyElement.createFromTemplate(modeKeyTemplates[0]);
    const html = `<p>Before ${embeddedModeKeyHtml(modeKey, '&nbsp;')} after</p>`;

    const replaced = replaceModeKeysInHtml(
      html,
      ({ attributes }) =>
        `<converted data-mode="${attributes.mode}"></converted>`,
    );

    expect(replaced).toBe(
      `<p>Before <converted data-mode="${modeKey.mode}"></converted> after</p>`,
    );
  });

  it('exports both active fields of an inline rich text box', () => {
    const exporter = new ByzHtmlExporter();
    const element = new RichTextBoxElement();

    element.inline = true;
    element.content = '<p>Top content</p>';
    element.contentBottom = `<p>Bottom content ${embeddedModeKeyHtml()}</p>`;

    const html = exporter.exportRichTextBox(element, new PageSetup(), 0);

    expect(html).toContain('byz--text-box-inline-top');
    expect(html).toContain('<p>Top content</p>');
    expect(html).toContain('byz--text-box-inline-bottom');
    expect(html).toContain('<p>Bottom content');
    expect(html).toContain('<span class="byz--mode-key" lang="el" dir="ltr"');
    expect(html).toContain('<x-mode-word-echos');
    expect(html).not.toContain('data-neanes-mode-key=');
  });

  it('exports all active fields of a multipanel rich text box', () => {
    const exporter = new ByzHtmlExporter();
    const element = new RichTextBoxElement();

    element.multipanel = true;
    element.contentLeft = `<p>Left content ${embeddedModeKeyHtml()}</p>`;
    element.contentCenter = `<p>Center content ${embeddedModeKeyHtml()}</p>`;
    element.contentRight = `<p>Right content ${embeddedModeKeyHtml()}</p>`;

    const html = exporter.exportRichTextBox(element, new PageSetup(), 0);

    expect(html).toContain('byz--text-box-multipanel');
    expect(html).toContain(
      'class="byz--text-box-multipanel-left"><p>Left content',
    );
    expect(html).toContain(
      'class="byz--text-box-multipanel-center"><p>Center content',
    );
    expect(html).toContain(
      'class="byz--text-box-multipanel-right"><p>Right content',
    );
    expect(html.match(/<x-mode-word-echos/gu)).toHaveLength(3);
    expect(html).not.toContain('data-neanes-mode-key=');
  });

  it('exports standalone and embedded mode keys with the original Greek BYZHTML tags', () => {
    const exporter = new ByzHtmlExporter();
    const score = new Score();
    const style = {
      ...styleFromWording('englishModeNames'),
      id: 'custom-english',
    };
    score.initialMartyriaStyles = [style];
    score.defaultInitialMartyriaStyleId = style.id;

    const modeKey = ModeKeyElement.createFromTemplate(modeKeyTemplates[0]);
    modeKey.initialMartyriaStyleId = style.id;
    modeKey.fthoraAboveNote = Fthora.DiatonicPa_Top;
    modeKey.quantitativeNeumeAboveNote = ModeSign.OligonPlusKentima;
    modeKey.note2 = ModeSign.Thi;
    modeKey.fthoraAboveNote2 = Fthora.SoftChromaticThi_Top;
    modeKey.quantitativeNeumeRight = QuantitativeNeume.OligonPlusKentimaAbove;
    modeKey.fthoraAboveQuantitativeNeumeRight = Fthora.Zygos_Top;
    modeKey.timeNeumeAboveQuantitativeNeumeRight = TimeNeume.Klasma_Top;
    modeKey.quantitativeNeumeRight2 = QuantitativeNeume.Ison;
    modeKey.gorgonAboveQuantitativeNeumeRight2 = GorgonNeume.Argon;

    const richText = new RichTextBoxElement();
    richText.content = `<p>Before ${embeddedModeKeyHtml(modeKey, '&nbsp;')} after</p>`;
    score.staff.elements = [modeKey, richText];

    const html = exporter.exportElements(
      score.staff.elements,
      score.pageSetup,
      score.paragraphStyles,
      0,
    );

    expect(html).toContain('<div class="byz--mode-key" lang="el" dir="ltr"');
    expect(html).toContain(
      'Before <span class="byz--mode-key" lang="el" dir="ltr"',
    );
    const tags = [
      '<x-mode-word-echos',
      '<x-mode-first',
      '<x-mode-pa',
      '<x-f-d-pa',
      '<x-mode-oligon-kentima-above',
      '<x-mode-di',
      '<x-f-sc-di',
      '<x-o3',
      '<x-kl',
      '<x-f-zygos',
      '<x-i',
      '<x-argon',
    ];
    expect(html.match(/<x-[a-z0-9-]+/gu)).toEqual([...tags, ...tags]);
    expect(html).not.toContain('byz--initial-martyria-');
    expect(html).not.toContain('data-neanes-mode-key=');
  });

  it('exports paragraph-style text boxes with inline underline text decoration', () => {
    const exporter = new ByzHtmlExporter();
    const element = createComputedTextBox({
      content: 'Styled text',
      paragraphStyleId: 'custom-style',
    });

    const customStyle = new ParagraphStyle();
    customStyle.id = 'custom-style';
    customStyle.overrides.textDecoration = 'underline';

    expect(
      exporter.exportTextBox(element, new PageSetup(), [customStyle], 0),
    ).toContain('text-decoration: underline;');
  });

  it('exports explicit underline clears against an underlined default as none', () => {
    const exporter = new ByzHtmlExporter();
    const style = new ParagraphStyle();

    style.id = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
    style.overrides.textDecoration = 'underline';

    const element = createComputedTextBox({
      content: 'Styled text',
      underline: false,
    });

    expect(
      exporter.exportTextBox(element, new PageSetup(), [style], 0),
    ).toContain('text-decoration: none;');
  });

  it('exports both lines of an inline text box', () => {
    const exporter = new ByzHtmlExporter();
    const element = new TextBoxElement();

    element.inline = true;
    element.content = 'Inline text';
    element.contentBottom = 'Inline bottom';
    element.paragraphStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics;
    element.computedAlignment = TextBoxAlignment.Center;

    const html = exporter.exportTextBox(element, new PageSetup(), [], 0);

    expect(html).toContain(
      '<div class="byz--text-box-inline-top" style="height: 15pt;">Inline text</div>',
    );
    expect(html).toContain(
      '<div class="byz--text-box-inline-bottom" style="top: -3.6pt;">Inline bottom</div>',
    );
  });

  it('exports computed styles for inline text boxes with explicit paragraph-style overrides', () => {
    const exporter = new ByzHtmlExporter();
    const element = createComputedTextBox({
      inline: true,
      content: 'Inline override',
      fontSize: Unit.fromPt(16),
      color: '#abcdef',
      fontFamily: 'Alegreya',
      fontStyle: 'Bold Italic',
      strokeWidth: 1.5,
      computedAlignment: TextBoxAlignment.Right,
      computedColor: '#123456',
      computedFontFamily: 'Alegreya',
      computedFontSize: Unit.fromPt(18),
      computedFontWeight: '700',
      computedFontStyle: 'italic',
      computedStrokeWidth: 2,
      computedLineHeight: 1.4,
    });

    expect(exporter.exportTextBox(element, new PageSetup(), [], 0)).toContain(
      `color: #123456;font-family: 'Alegreya', 'Source Serif';font-size: 18pt;font-weight: 700;font-style: italic;`,
    );
  });

  it('exports all panels of a multipanel rich text box', () => {
    const exporter = new ByzHtmlExporter();
    const element = new RichTextBoxElement();

    element.multipanel = true;
    element.contentLeft = '<p>Left</p>';
    element.contentCenter = '<p>Center</p>';
    element.contentRight = '<p>Right</p>';

    const html = exporter.exportRichTextBox(element, new PageSetup(), 0);

    expect(html).toContain(
      '<div class="byz--text-box-multipanel-left"><p>Left</p></div>',
    );
    expect(html).toContain(
      '<div class="byz--text-box-multipanel-center"><p>Center</p></div>',
    );
    expect(html).toContain(
      '<div class="byz--text-box-multipanel-right"><p>Right</p></div>',
    );
  });

  it('keeps fixed-width inline rich text boxes inside the active neume paragraph', () => {
    const exporter = new ByzHtmlExporter();
    const inline = new RichTextBoxElement();

    inline.inline = true;
    inline.customWidth = 100;
    inline.content = '<p>Top</p>';
    inline.contentBottom = '<p>Bottom</p>';

    const html = exporter.exportElements(
      [new NoteElement(), inline, new NoteElement()],
      new PageSetup(),
      [],
      0,
    );

    expect(html.match(/class="byz--neume-paragraph/g)).toHaveLength(1);
    expect(html.indexOf('<p>Top</p>')).toBeLessThan(html.lastIndexOf('</div'));
    expect(html).toContain('<p>Bottom</p>');
  });

  it('ends the line after a full-width inline rich text box', () => {
    const exporter = new ByzHtmlExporter();
    const inline = new RichTextBoxElement();

    inline.inline = true;
    inline.content = '<p>Top</p>';
    inline.contentBottom = '<p>Bottom</p>';

    const html = exporter.exportElements(
      [inline, new NoteElement()],
      new PageSetup(),
      [],
      0,
    );

    expect(html.match(/class="byz--neume-paragraph/g)).toHaveLength(2);
  });

  it('lets a following right-aligned martyria end the full-width line', () => {
    const exporter = new ByzHtmlExporter();
    const inline = new RichTextBoxElement();
    const martyria = new MartyriaElement();

    inline.inline = true;
    inline.content = '<p>Top</p>';
    martyria.alignRight = true;

    const html = exporter.exportElements(
      [new NoteElement(), inline, martyria, new NoteElement()],
      new PageSetup(),
      [],
      0,
    );

    expect(html.match(/class="byz--neume-paragraph/g)).toHaveLength(2);
  });

  it('exports all registered exact faces and alternate mappings', () => {
    const registeredFamily = 'Previously Registered Export Family';
    const registeredFace = fontCatalog.resolveFace(registeredFamily, 'Caption');
    const unregisteredFamily = 'Unregistered Regular Export Family';

    fontCatalog.resolveFace(unregisteredFamily, 'Regular');

    const html = createByzHtmlDocument(
      "body { font-family: 'Source Serif'; }",
      '<p>Text</p>',
      false,
    );

    expect(html).toContain(
      `@font-face { font-family: "${registeredFace.cssFamily}"`,
    );
    expect(html).toMatch(
      new RegExp(`@font-feature-values [^{]*"${registeredFace.cssFamily}"`),
    );
    expect(html).not.toContain(unregisteredFamily);
  });
});
