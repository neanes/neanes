import { describe, expect, it } from 'vitest';

import { ModeKeyElement } from '@/models/Element';
import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  createDefaultInitialMartyriaTypography,
  DEFAULT_INITIAL_MARTYRIA_STYLE_ID,
} from '@/models/InitialMartyriaBuiltInStyles';
import { createInitialMartyriaStyle } from '@/models/InitialMartyriaGrammar';
import {
  getInitialMartyriaFixedSeparatorSize,
  resolveInitialMartyriaStyleAppearances,
  resolveModeKeyInitialMartyriaStyle,
} from '@/models/InitialMartyriaResolver';
import { INITIAL_MARTYRIA_NUMERAL_STYLES } from '@/models/InitialMartyriaStyle';
import { PageSetup } from '@/models/PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  ParagraphStyle,
  type ParagraphStyleOverrides,
} from '@/models/ParagraphStyle';
import { Unit } from '@/utils/Unit';

import { attestedStructures } from './InitialMartyriaStyle.testData';
import {
  elementForTemplate,
  glyphFontSize,
  paragraphStyles,
  resolve,
  styleFor,
} from './InitialMartyriaStyle.testHelpers';

function createInitialMartyriaParagraphStyle(
  id: string,
  overrides: ParagraphStyleOverrides,
) {
  const style = new ParagraphStyle();
  style.id = id;
  style.parentStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria;
  style.overrides = overrides;
  return style;
}

describe('InitialMartyriaResolver', () => {
  it('sizes fixed separators from the primary text font size', () => {
    for (const separator of [
      'plagalAbbreviation',
      'modeSign',
      'startingNote',
      'noteCluster',
    ] as const) {
      expect(getInitialMartyriaFixedSeparatorSize(separator, 20)).toBe(8.6);
    }
    expect(getInitialMartyriaFixedSeparatorSize('wordSpace', 20)).toBeNull();
  });

  it('resolves inherited, explicit, and missing style references', () => {
    const custom = createInitialMartyriaStyle({
      displayName: 'Parish',
      basedOn: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekTraditionalSign,
      structure: attestedStructures['greek-mode-names'],
      ...createDefaultInitialMartyriaTypography(),
    });
    const initialMartyriaStyles = [custom];
    const builtInId =
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishTraditionalSign;
    const pageSetup = new PageSetup();
    pageSetup.initialMartyriaStyleId = builtInId;
    const element = new ModeKeyElement();

    expect(
      resolveModeKeyInitialMartyriaStyle({
        element,
        pageSetup,
        paragraphStyles,
        initialMartyriaStyles,
      }).style.id,
    ).toBe(builtInId);

    element.initialMartyriaStyleId = custom.id;
    expect(
      resolveModeKeyInitialMartyriaStyle({
        element,
        pageSetup,
        paragraphStyles,
        initialMartyriaStyles,
      }).style.id,
    ).toBe(custom.id);

    element.initialMartyriaStyleId = 'missing';
    expect(
      resolveModeKeyInitialMartyriaStyle({
        element,
        pageSetup,
        paragraphStyles,
        initialMartyriaStyles,
      }).style.id,
    ).toBe(DEFAULT_INITIAL_MARTYRIA_STYLE_ID);

    element.initialMartyriaStyleId = null;
    pageSetup.initialMartyriaStyleId = 'missing';
    expect(
      resolveModeKeyInitialMartyriaStyle({
        element,
        pageSetup,
        paragraphStyles,
        initialMartyriaStyles,
      }).style.id,
    ).toBe(DEFAULT_INITIAL_MARTYRIA_STYLE_ID);
  });

  it('folds element overrides into the resolved style appearances', () => {
    const pageSetup = new PageSetup();
    pageSetup.initialMartyriaStyleId =
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishTraditionalSign;
    const element = new ModeKeyElement();

    const inherited = resolveModeKeyInitialMartyriaStyle({
      element,
      pageSetup,
      paragraphStyles,
      initialMartyriaStyles: [],
    });
    expect(inherited.mainAppearance).toMatchObject({
      fontFamily: 'Source Serif',
      fontSize: Unit.fromPt(12),
      color: '#ED0000',
      strokeWidth: 0,
    });
    expect(inherited.greekAppearance).toMatchObject({
      fontFamily: 'GFS Didot Classic',
      fontSize: Unit.fromPt(14.5),
      color: '#ED0000',
    });

    element.fontSize = 30;
    element.color = '#123456';
    element.strokeWidth = 0.5;
    const overridden = resolveModeKeyInitialMartyriaStyle({
      element,
      pageSetup,
      paragraphStyles,
      initialMartyriaStyles: [],
    });
    expect(overridden.mainAppearance).toMatchObject({
      fontFamily: 'Source Serif',
      fontSize: 30,
      color: '#123456',
      strokeWidth: 0.5,
    });
    expect(overridden.greekAppearance).toMatchObject({
      fontSize: 30,
      color: '#123456',
      strokeWidth: 0.5,
    });
  });

  it('resolves regular and Greek text through their own paragraph styles', () => {
    const style = styleFor(attestedStructures['traditional-greek']);
    const resolved = resolveInitialMartyriaStyleAppearances(
      style,
      paragraphStyles,
    );

    expect(resolved.mainAppearance).toMatchObject({
      fontFamily: 'Source Serif',
      fontSize: Unit.fromPt(12),
    });
    expect(resolved.greekAppearance).toMatchObject({
      fontFamily: 'GFS Didot Classic',
      fontSize: Unit.fromPt(14.5),
    });
    expect(resolved.primaryAppearance).toBe(resolved.greekAppearance);

    const english = resolveInitialMartyriaStyleAppearances(
      styleFor(attestedStructures['english-sign-first']),
      paragraphStyles,
    );
    expect(english.primaryAppearance).toBe(english.mainAppearance);
  });

  it('applies the style appearance to text and musical glyphs', () => {
    const style = styleFor(attestedStructures['english-sign-first']);
    const customMain = createInitialMartyriaParagraphStyle('custom-main', {
      fontFamily: 'GFS Didot',
      fontSize: 18,
      color: '#123456',
      strokeWidth: 0.25,
      fontVariantCaps: 'small-caps',
      fontVariantNumeric: 'oldstyle-nums proportional-nums',
      fontVariantLigatures: 'no-common-ligatures',
      fontVariantAlternates: 'historical-forms',
    });
    style.paragraphStyleId = customMain.id;
    const styles = [...paragraphStyles, customMain];

    const resolved = resolveInitialMartyriaStyleAppearances(style, styles);
    const runs = resolve(style, elementForTemplate(100), styles).runs;

    expect(resolved.mainAppearance).toMatchObject({
      fontFamily: 'GFS Didot',
      fontSize: 18,
      color: '#123456',
      strokeWidth: 0.25,
      fontVariantCaps: 'small-caps',
      fontVariantNumeric: 'oldstyle-nums proportional-nums',
      fontVariantLigatures: 'no-common-ligatures',
      fontVariantAlternates: 'historical-forms',
    });
    const glyphRuns = runs.filter((run) => run.kind === 'glyph');
    expect(glyphRuns.length).toBeGreaterThan(0);
    for (const run of glyphRuns) {
      expect(run.semantic).toBe('modeSign');
      // Glyphs are set in the music font at the glyph size and take only the
      // text's color and stroke.
      expect(run.appearance).toEqual({
        fontFamily: 'Neanes',
        fontStyle: 'Regular',
        fontSize: glyphFontSize,
        color: '#123456',
        strokeWidth: 0.25,
        strokeColor: resolved.mainAppearance.strokeColor,
        fontVariantCaps: 'normal',
        fontVariantNumeric: 'normal',
        fontVariantLigatures: 'normal',
        fontVariantAlternates: 'normal',
      });
    }
    const pitchRun = runs.find((run) => run.kind === 'startingPitch')!;
    expect(pitchRun.appearance).toMatchObject({
      fontFamily: 'Neanes',
      fontSize: glyphFontSize,
      color: '#123456',
      strokeWidth: 0.25,
    });
  });

  it('uses the Greek font for original note names and permanent Greek text', () => {
    const style = styleFor(attestedStructures['english-sign-first']);
    const customGreek = createInitialMartyriaParagraphStyle('custom-greek', {
      fontFamily: 'GFS Didot',
    });
    style.greekParagraphStyleId = customGreek.id;
    const styles = [...paragraphStyles, customGreek];

    const originalRuns = resolve(style, elementForTemplate(500), styles).runs;
    const originalPitch = originalRuns.find(
      (run) => run.kind === 'startingPitch',
    );
    expect(originalPitch?.kind).toBe('startingPitch');
    if (originalPitch?.kind === 'startingPitch') {
      expect(originalPitch.noteText.appearance.fontFamily).toBe('GFS Didot');
    }

    const plagal = originalRuns.find(
      (run) =>
        run.kind === 'text' &&
        run.content.layout === 'stackedCharacters' &&
        run.content.topCharacter === 'λ' &&
        run.content.bottomCharacter === 'π',
    );
    expect(plagal?.kind).toBe('text');
    if (plagal?.kind === 'text') {
      expect(plagal.languageTag).toBe('el');
      expect(plagal.appearance.fontFamily).toBe('GFS Didot');
    }
  });

  it('keeps Greek typography independent of regular text typography', () => {
    const style = styleFor(attestedStructures['english-sign-first']);
    const customMain = createInitialMartyriaParagraphStyle('custom-main', {
      fontFamily: 'Alegreya',
    });
    style.paragraphStyleId = customMain.id;
    const styles = [...paragraphStyles, customMain];

    const resolved = resolveInitialMartyriaStyleAppearances(style, styles);
    expect(resolved.mainAppearance.fontFamily).toBe('Alegreya');
    expect(resolved.greekAppearance.fontFamily).toBe('GFS Didot Classic');

    const runs = resolve(style, elementForTemplate(500), styles).runs;
    const originalPitch = runs.find((run) => run.kind === 'startingPitch');
    expect(originalPitch?.kind).toBe('startingPitch');
    if (originalPitch?.kind === 'startingPitch') {
      expect(originalPitch.noteText.appearance.fontFamily).toBe(
        'GFS Didot Classic',
      );
    }
    const plagal = runs.find(
      (run) => run.kind === 'text' && run.semantic === 'plagalAbbreviation',
    );
    expect(plagal?.kind).toBe('text');
    if (plagal?.kind === 'text') {
      expect(plagal.appearance.fontFamily).toBe('GFS Didot Classic');
    }
  });

  it('uses one font for every Greek style text role', () => {
    const style = styleFor(attestedStructures['traditional-greek']);
    const customGreek = createInitialMartyriaParagraphStyle('custom-greek', {
      fontFamily: 'GFS Porson',
    });
    style.greekParagraphStyleId = customGreek.id;
    const styles = [...paragraphStyles, customGreek];

    const resolved = resolveInitialMartyriaStyleAppearances(style, styles);
    const runs = resolve(style, elementForTemplate(500), styles).runs;

    expect(resolved.mainAppearance.fontFamily).toBe('Source Serif');
    expect(resolved.greekAppearance.fontFamily).toBe('GFS Porson');
    expect(
      runs
        .filter((run) => run.kind === 'text')
        .every((run) => run.appearance.fontFamily === 'GFS Porson'),
    ).toBe(true);
    const startingPitch = runs.find((run) => run.kind === 'startingPitch');
    expect(startingPitch?.kind).toBe('startingPitch');
    if (startingPitch?.kind === 'startingPitch') {
      expect(startingPitch.noteText.appearance.fontFamily).toBe('GFS Porson');
    }
  });

  it('uses Greek typography for a Greek style and its musical glyphs', () => {
    const style = styleFor(attestedStructures['traditional-greek']);
    const customGreek = createInitialMartyriaParagraphStyle('custom-greek', {
      fontFamily: 'GFS Porson',
      fontSize: 18,
      color: '#123456',
      strokeWidth: 0.5,
      strokeColor: '#654321',
    });
    style.greekParagraphStyleId = customGreek.id;
    const styles = [...paragraphStyles, customGreek];

    const resolved = resolveInitialMartyriaStyleAppearances(style, styles);
    const runs = resolve(style, elementForTemplate(500), styles).runs;
    const glyphRuns = runs.filter(
      (run) => run.kind === 'glyph' || run.kind === 'startingPitch',
    );

    expect(resolved.primaryAppearance).toBe(resolved.greekAppearance);
    expect(resolved.primaryAppearance).toMatchObject({
      fontFamily: 'GFS Porson',
      fontSize: 18,
      color: '#123456',
      strokeWidth: 0.5,
      strokeColor: '#654321',
    });
    expect(glyphRuns.length).toBeGreaterThan(0);
    for (const run of glyphRuns) {
      expect(run.appearance).toMatchObject({
        color: '#123456',
        strokeWidth: 0.5,
        strokeColor: '#654321',
      });
    }
  });

  it('does not apply ordinal forms to Greek-script digits', () => {
    const style = styleFor({
      ...attestedStructures['greek-mode-names'],
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    });
    const customGreek = createInitialMartyriaParagraphStyle('custom-greek', {
      fontVariantNumeric: 'oldstyle-nums',
    });
    style.greekParagraphStyleId = customGreek.id;
    style.useOrdinalForms = true;

    const numeral = resolve(style, elementForTemplate(100), [
      ...paragraphStyles,
      customGreek,
    ]).runs.find((run) => run.kind === 'text' && run.semantic === 'numeral');

    expect(numeral?.kind).toBe('text');
    if (numeral?.kind === 'text') {
      expect(numeral.appearance.fontVariantNumeric).toBe('oldstyle-nums');
    }
  });
});
