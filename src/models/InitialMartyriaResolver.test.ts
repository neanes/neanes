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
import {
  INITIAL_MARTYRIA_DEFAULT_FONT_FAMILY,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  resolveInitialMartyriaFontFamily,
} from '@/models/InitialMartyriaStyle';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

import { attestedStructures } from './InitialMartyriaStyle.testData';
import {
  elementForTemplate,
  glyphFontSize,
  paragraphStyles,
  resolve,
  styleFor,
} from './InitialMartyriaStyle.testHelpers';

describe('InitialMartyriaResolver', () => {
  it('sizes fixed separators from the main text font size', () => {
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
      ...createDefaultInitialMartyriaTypography(
        INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
      ),
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
      fontFamily: 'Source Serif',
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

  it('resolves the default Greek font from the document music font', () => {
    expect(
      resolveInitialMartyriaFontFamily(
        INITIAL_MARTYRIA_DEFAULT_FONT_FAMILY,
        'Neanes',
      ),
    ).toBe('GFS Didot');
    expect(
      resolveInitialMartyriaFontFamily(
        INITIAL_MARTYRIA_DEFAULT_FONT_FAMILY,
        'NeanesStathisSeries',
      ),
    ).toBe('GFS Porson');
    expect(
      resolveInitialMartyriaFontFamily(
        INITIAL_MARTYRIA_DEFAULT_FONT_FAMILY,
        'NeanesStathisSeriesLegacy',
      ),
    ).toBe('GFS Porson');
    expect(
      resolveInitialMartyriaFontFamily('GFS Didot', 'NeanesStathisSeries'),
    ).toBe('GFS Didot');

    const style = styleFor(attestedStructures['traditional-greek']);
    expect(style.paragraphStyleOverrides.fontFamily).toBe(
      INITIAL_MARTYRIA_DEFAULT_FONT_FAMILY,
    );
    expect(
      resolveInitialMartyriaStyleAppearances(style, paragraphStyles, 'Neanes')
        .mainAppearance.fontFamily,
    ).toBe('GFS Didot');
    expect(
      resolveInitialMartyriaStyleAppearances(
        style,
        paragraphStyles,
        'NeanesStathisSeries',
      ).mainAppearance.fontFamily,
    ).toBe('GFS Porson');
  });

  it('applies the style appearance to text and musical glyphs', () => {
    const style = styleFor(attestedStructures['english-sign-first']);
    style.paragraphStyleOverrides = {
      fontFamily: 'GFS Didot',
      fontSize: 18,
      color: '#123456',
      strokeWidth: 0.25,
      fontVariantCaps: 'small-caps',
      fontVariantNumeric: 'oldstyle-nums proportional-nums',
      fontVariantLigatures: 'no-common-ligatures',
      fontVariantAlternates: 'historical-forms',
    };

    const resolved = resolveInitialMartyriaStyleAppearances(
      style,
      paragraphStyles,
      'Neanes',
    );
    const runs = resolve(style, elementForTemplate(100)).runs;

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
    style.paragraphStyleOverrides.fontFamily = 'Source Serif';
    style.greekFontFamily = 'GFS Didot';

    const originalRuns = resolve(style, elementForTemplate(500)).runs;
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
        run.content.layout === 'stacked' &&
        run.content.lines[0] === 'λ' &&
        run.content.lines[1] === 'π',
    );
    expect(plagal?.kind).toBe('text');
    if (plagal?.kind === 'text') {
      expect(plagal.languageTag).toBe('el');
      expect(plagal.appearance.fontFamily).toBe('GFS Didot');
    }
  });

  it('follows the text font for Greek text when no Greek font is set', () => {
    const style = styleFor(attestedStructures['english-sign-first']);
    expect(style.greekFontFamily).toBeNull();
    expect(
      resolveInitialMartyriaStyleAppearances(style, paragraphStyles, 'Neanes')
        .greekAppearance.fontFamily,
    ).toBe(
      resolveInitialMartyriaStyleAppearances(style, paragraphStyles, 'Neanes')
        .mainAppearance.fontFamily,
    );

    style.paragraphStyleOverrides.fontFamily = 'Alegreya';

    const resolved = resolveInitialMartyriaStyleAppearances(
      style,
      paragraphStyles,
      'Neanes',
    );
    expect(resolved.mainAppearance.fontFamily).toBe('Alegreya');
    expect(resolved.greekAppearance.fontFamily).toBe('Alegreya');

    const runs = resolve(style, elementForTemplate(500)).runs;
    const originalPitch = runs.find((run) => run.kind === 'startingPitch');
    expect(originalPitch?.kind).toBe('startingPitch');
    if (originalPitch?.kind === 'startingPitch') {
      expect(originalPitch.noteText.appearance.fontFamily).toBe('Alegreya');
    }
    const plagal = runs.find(
      (run) => run.kind === 'text' && run.semantic === 'plagalAbbreviation',
    );
    expect(plagal?.kind).toBe('text');
    if (plagal?.kind === 'text') {
      expect(plagal.appearance.fontFamily).toBe('Alegreya');
    }
  });

  it('uses one font for every Greek style text role', () => {
    const style = styleFor(attestedStructures['traditional-greek']);
    style.paragraphStyleOverrides.fontFamily = 'Source Serif';
    style.greekFontFamily = 'GFS Didot';

    const resolved = resolveInitialMartyriaStyleAppearances(
      style,
      paragraphStyles,
      'Neanes',
    );
    const runs = resolve(style, elementForTemplate(500)).runs;

    expect(resolved.mainAppearance.fontFamily).toBe('Source Serif');
    expect(resolved.greekAppearance.fontFamily).toBe('Source Serif');
    expect(
      runs
        .filter((run) => run.kind === 'text')
        .every((run) => run.appearance.fontFamily === 'Source Serif'),
    ).toBe(true);
    const startingPitch = runs.find((run) => run.kind === 'startingPitch');
    expect(startingPitch?.kind).toBe('startingPitch');
    if (startingPitch?.kind === 'startingPitch') {
      expect(startingPitch.noteText.appearance.fontFamily).toBe('Source Serif');
    }
  });
});
