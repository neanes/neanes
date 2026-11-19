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
  getInitialMartyriaParagraphStyleUsage,
  getInitialMartyriaSeparatorAfter,
  getInitialMartyriaSeparatorBefore,
  initialMartyriaStructureSupportsOrdinalForms,
  resolveInitialMartyriaStyleAppearances,
  resolveModeKeyInitialMartyriaStyle,
} from '@/models/InitialMartyriaResolver';
import {
  INITIAL_MARTYRIA_LETTERINGS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaLettering,
  type InitialMartyriaStructure,
} from '@/models/InitialMartyriaStyle';
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
    expect(getInitialMartyriaFixedSeparatorSize(20)).toBe(8.6);
  });

  it.each([
    'traditional-greek',
    'romanian-glas',
    'english-sign-first',
    'english-plagal-class-ordinal-words',
  ] as const)('uses fixed gaps beside the mode glyph in %s', (preset) => {
    const resolution = resolve(
      styleFor(attestedStructures[preset]),
      elementForTemplate(100),
    );
    const signIndex = resolution.runs.findIndex(
      (run) => run.kind === 'glyph' && run.semantic === 'modeSign',
    );

    expect(signIndex).toBeGreaterThanOrEqual(0);
    expect(getInitialMartyriaSeparatorBefore(resolution, signIndex)).toBe(
      signIndex === 0 ? 'none' : 'fixed',
    );
    expect(getInitialMartyriaSeparatorAfter(resolution, signIndex)).toBe(
      'fixed',
    );
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
      fontSize: Unit.fromPt(14.5),
      color: '#ED0000',
      strokeWidth: 0,
    });
    expect(inherited.greekAppearance).toMatchObject({
      fontFamily: 'GFS Didot',
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
      fontSize: Unit.fromPt(14.5),
    });
    expect(resolved.greekAppearance).toMatchObject({
      fontFamily: 'GFS Didot',
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
      expect(originalPitch.noteText!.appearance.fontFamily).toBe('GFS Didot');
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
    expect(resolved.greekAppearance.fontFamily).toBe('GFS Didot');

    const runs = resolve(style, elementForTemplate(500), styles).runs;
    const originalPitch = runs.find((run) => run.kind === 'startingPitch');
    expect(originalPitch?.kind).toBe('startingPitch');
    if (originalPitch?.kind === 'startingPitch') {
      expect(originalPitch.noteText!.appearance.fontFamily).toBe('GFS Didot');
    }
    const plagal = runs.find(
      (run) => run.kind === 'text' && run.semantic === 'plagalAbbreviation',
    );
    expect(plagal?.kind).toBe('text');
    if (plagal?.kind === 'text') {
      expect(plagal.appearance.fontFamily).toBe('GFS Didot');
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
      expect(startingPitch.noteText!.appearance.fontFamily).toBe('GFS Porson');
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

  it('sets music-font lettering in the Greek paragraph style alone', () => {
    const style = {
      ...styleFor(attestedStructures['traditional-greek']),
      lettering: INITIAL_MARTYRIA_LETTERINGS.MusicFont,
    };
    const customRegular = createInitialMartyriaParagraphStyle(
      'custom-regular',
      { color: '#ABCDEF', strokeWidth: 1.5, strokeColor: '#FEDCBA' },
    );
    const customGreek = createInitialMartyriaParagraphStyle('custom-greek', {
      fontSize: 18,
      color: '#123456',
      strokeWidth: 0.5,
      strokeColor: '#654321',
    });
    style.paragraphStyleId = customRegular.id;
    style.greekParagraphStyleId = customGreek.id;
    const styles = [...paragraphStyles, customRegular, customGreek];

    const resolved = resolveInitialMartyriaStyleAppearances(style, styles);
    expect(resolved.primaryAppearance).toBe(resolved.greekAppearance);
    expect(resolved.primaryAppearance).toMatchObject({
      fontSize: 18,
      color: '#123456',
      strokeWidth: 0.5,
      strokeColor: '#654321',
    });

    const runs = resolve(style, elementForTemplate(500), styles).runs;
    expect(runs.length).toBeGreaterThan(0);
    for (const run of runs) {
      expect(run.kind).not.toBe('text');
      expect(run.appearance).toMatchObject({
        color: '#123456',
        strokeWidth: 0.5,
        strokeColor: '#654321',
      });
    }
  });

  describe('getInitialMartyriaParagraphStyleUsage', () => {
    function usageFor(
      structure: InitialMartyriaStructure,
      lettering: InitialMartyriaLettering = INITIAL_MARTYRIA_LETTERINGS.Text,
    ) {
      return getInitialMartyriaParagraphStyleUsage({ structure, lettering });
    }

    it('reads only the Greek style for music-font lettering', () => {
      expect(
        usageFor(
          attestedStructures['traditional-greek'],
          INITIAL_MARTYRIA_LETTERINGS.MusicFont,
        ),
      ).toEqual({ regular: false, greek: true });
    });

    it('reads only the Greek style for Greek text', () => {
      expect(usageFor(attestedStructures['greek-mode-names'])).toEqual({
        regular: false,
        greek: true,
      });
    });

    it('reads both styles when note names stay in Greek', () => {
      expect(usageFor(attestedStructures['english-mode-names'])).toEqual({
        regular: true,
        greek: true,
      });
    });

    it('reads only the regular style for transliterated text', () => {
      expect(
        usageFor({
          ...attestedStructures['english-mode-names'],
          transliterateNoteNames: true,
        }),
      ).toEqual({ regular: true, greek: false });
    });

    it('still reads the Greek style for a transliterated plagal sign', () => {
      expect(
        usageFor({
          ...attestedStructures['english-sign-first'],
          transliterateNoteNames: true,
        }),
      ).toEqual({ regular: true, greek: true });
      expect(
        usageFor({
          ...attestedStructures['english-plagal-class-ordinal-words'],
          transliterateNoteNames: true,
        }),
      ).toEqual({ regular: true, greek: true });
    });
  });

  it('offers ordinal forms only for digit ordinals with a raisable suffix', () => {
    expect(
      initialMartyriaStructureSupportsOrdinalForms(
        attestedStructures['english-ordinal-plagal-text'],
      ),
    ).toBe(true);
    expect(
      initialMartyriaStructureSupportsOrdinalForms(
        attestedStructures['english-ordinal'],
      ),
    ).toBe(false);
    for (const structure of [
      attestedStructures['church-slavonic-glas-number'],
      attestedStructures['spanish-tono-roman-numeral'],
      {
        ...attestedStructures['russian-glas-number'],
        numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      },
      attestedStructures['arabic-ordinal-digits'],
    ]) {
      expect(initialMartyriaStructureSupportsOrdinalForms(structure)).toBe(
        false,
      );
    }
  });

  it('does not apply ordinal forms to digits without a raisable suffix', () => {
    const style = styleFor(attestedStructures['church-slavonic-glas-number']);
    style.useOrdinalForms = true;

    const numeral = resolve(
      style,
      elementForTemplate(100),
      paragraphStyles,
    ).runs.find((run) => run.kind === 'text' && run.semantic === 'numeral');

    expect(numeral?.kind).toBe('text');
    if (numeral?.kind === 'text') {
      expect(numeral.appearance.fontVariantNumeric).not.toContain('ordinal');
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
