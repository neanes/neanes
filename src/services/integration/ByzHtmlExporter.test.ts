import { describe, expect, it } from 'vitest';

import {
  getModeKeyModelAttributes,
  serializeModeKeyAttributes,
} from '@/ckeditor-plugins/insertmodekey/modekeydata';
import {
  MartyriaElement,
  ModeKeyElement,
  RichTextBoxElement,
  TextBoxAlignment,
  TextBoxElement,
} from '@/models/Element';
import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  builtInInitialMartyriaStyles,
} from '@/models/InitialMartyriaBuiltInStyles';
import type { InitialMartyriaLayout } from '@/models/InitialMartyriaLayout';
import {
  getInitialMartyriaContext,
  resolveInitialMartyriaStyle,
  resolveModeKeyInitialMartyriaStyle,
  resolveScoreInitialMartyriaStyle,
} from '@/models/InitialMartyriaResolver';
import type { InitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import {
  Fthora,
  ModeSign,
  QuantitativeNeume,
  TempoSign,
} from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultParagraphStyles,
  ParagraphStyle,
} from '@/models/ParagraphStyle';
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

function embeddedModeKeyHtml(element = new ModeKeyElement()) {
  const payload = serializeModeKeyAttributes(
    getModeKeyModelAttributes(element),
  );
  return `<span class="neanes-ck-mode-key" data-neanes-mode-key="${payload}"></span>`;
}

describe('ByzHtmlExporter', () => {
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

    expect(exporter.exportRichTextBox(element, 0)).toBe(
      '<div class="byz---rich-text-box" lang="ar" dir="rtl"><p><span lang="ar" dir="rtl">Hello</span></p></div\n>',
    );
  });

  it('exports both active fields of an inline rich text box', () => {
    const exporter = new ByzHtmlExporter();
    const element = new RichTextBoxElement();

    element.inline = true;
    element.content = '<p>Top content</p>';
    element.contentBottom = `<p>Bottom content ${embeddedModeKeyHtml()}</p>`;

    const html = exporter.exportRichTextBox(element, 0);

    expect(html).toContain('byz--rich-text-box-inline-top');
    expect(html).toContain('<p>Top content</p>');
    expect(html).toContain('byz--rich-text-box-inline-bottom');
    expect(html).toContain('<p>Bottom content');
    expect(html).toContain('data-neanes-mode-key=');
  });

  it('exports all active fields of a multipanel rich text box', () => {
    const exporter = new ByzHtmlExporter();
    const element = new RichTextBoxElement();

    element.multipanel = true;
    element.contentLeft = `<p>Left content ${embeddedModeKeyHtml()}</p>`;
    element.contentCenter = `<p>Center content ${embeddedModeKeyHtml()}</p>`;
    element.contentRight = `<p>Right content ${embeddedModeKeyHtml()}</p>`;

    const html = exporter.exportRichTextBox(element, 0);

    expect(html).toContain('byz--rich-text-box-multipanel');
    expect(html).toContain('data-panel="left"><p>Left content');
    expect(html).toContain('data-panel="center"><p>Center content');
    expect(html).toContain('data-panel="right"><p>Right content');
    expect(html.match(/data-neanes-mode-key=/gu)).toHaveLength(3);
  });

  it('exports an embedded mode key from its resolved custom style runs', () => {
    const exporter = new ByzHtmlExporter();
    const builtIn = builtInInitialMartyriaStyles.find(
      (style) =>
        style.id === BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNames,
    )!;
    const customStyle: InitialMartyriaStyle = {
      ...builtIn,
      id: 'custom-text-only',
      displayName: 'Custom text only',
      basedOn: builtIn.id,
      structure: { ...builtIn.structure },
    };
    const modeKey = ModeKeyElement.createFromTemplate(
      modeKeyTemplates.find((template) => template.mode === 1)!,
    );
    modeKey.initialMartyriaStyleId = customStyle.id;
    modeKey.fthoraAboveNote = Fthora.DiatonicPa_Top;
    modeKey.quantitativeNeumeAboveNote = ModeSign.OligonPlusKentima;
    const pageSetup = new PageSetup();
    const paragraphStyles = createDefaultParagraphStyles();
    const resolvedStyle = resolveModeKeyInitialMartyriaStyle({
      element: modeKey,
      pageSetup,
      paragraphStyles,
      initialMartyriaStyles: [customStyle],
    });
    const resolution = resolveInitialMartyriaStyle({
      context: getInitialMartyriaContext(modeKey),
      resolvedStyle,
      pageSetup,
      glyphFontSize: 20,
    });
    const pitchGeometry = {
      width: 20,
      top: -10,
      bottom: 5,
      text: { left: 0 },
      fthora: { left: 4, baseline: -12 },
      quantitative: { left: 6, baseline: -20 },
    };
    modeKey.computedInitialMartyriaLayout = {
      resolution,
      primaryAppearance: resolvedStyle.primaryAppearance,
      runs: resolution.runs.map((run) => ({
        separatorBefore: {
          kind: 'none',
          width: 0,
          wordSpaceFont: null,
        },
        fontSize: run.appearance.fontSize,
        baselineShift: 0,
        stackedCharacters: null,
        pitch:
          run.kind === 'startingPitch'
            ? {
                textFontSize: run.noteText.appearance.fontSize,
                primary: run.cluster.primary == null ? null : pitchGeometry,
                secondary: run.cluster.secondary == null ? null : pitchGeometry,
                clusterSeparatorWidth: 4,
                trailingGlueWidth: 4,
              }
            : null,
      })),
      trailingSeparator: {
        kind: 'none',
        width: 0,
        wordSpaceFont: null,
      },
      neumeBaselineCorrection: 0,
      accessory: {
        fontSize: 20,
        baselineOffset: 0,
        tempoMarginLeft: 8,
      },
      ambitus: null,
    } satisfies InitialMartyriaLayout;
    const defaultAppearance = resolveScoreInitialMartyriaStyle({
      pageSetup,
      paragraphStyles,
      initialMartyriaStyles: [customStyle],
    }).primaryAppearance;

    const html = exporter.exportModeKey(modeKey, defaultAppearance, 0, true);

    expect(html).toContain('byz--initial-martyria-text');
    expect(html).toContain('First');
    expect(html).toContain('Mode');
    expect(html).toContain(
      `byz--initial-martyria-pitch-mark byz--f" style="display: inline-block;position: relative;width: 0;left: ${Unit.toPt(4)}pt;top: ${Unit.toPt(-12)}pt;`,
    );
    expect(html).toContain(
      `byz--initial-martyria-pitch-mark" style="display: inline-block;position: relative;width: 0;left: ${Unit.toPt(6)}pt;top: ${Unit.toPt(-20)}pt;`,
    );
    expect(html).not.toContain(
      'byz--initial-martyria-pitch-mark" style="position: absolute;',
    );
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

    expect(exporter.exportTextBox(element, [customStyle], 0)).toContain(
      'text-decoration: underline;',
    );
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

    expect(exporter.exportTextBox(element, [style], 0)).toContain(
      'text-decoration: none;',
    );
  });

  it('keeps inherited inline text boxes on the shared inline CSS defaults', () => {
    const exporter = new ByzHtmlExporter();
    const element = new TextBoxElement();

    element.inline = true;
    element.content = 'Inline text';
    element.paragraphStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics;
    element.computedAlignment = TextBoxAlignment.Center;

    expect(exporter.exportTextBox(element, [], 0)).toBe(
      `<div dir="auto" class="byz--text-box byz--text-box-inline" style="text-align: center;">Inline text</div
>`,
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

    expect(exporter.exportTextBox(element, [], 0)).toBe(
      `<div dir="auto" class="byz--text-box byz--text-box-inline" style="color: #123456;font-family: 'Alegreya', 'Source Serif';font-size: 18pt;font-weight: 700;font-style: italic;font-variant-caps: normal;font-variant-numeric: normal;font-variant-ligatures: normal;font-variant-alternates: normal;line-height: 1.4;-webkit-text-stroke-width: 2;-webkit-text-stroke-color: currentcolor;text-align: right;">Inline override</div\n>`,
    );
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
