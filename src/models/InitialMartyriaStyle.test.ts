import { describe, expect, it } from 'vitest';

import { resources } from '@/i18n';
import { ModeKeyElement } from '@/models/Element';
import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  builtInInitialMartyriaStyles,
  cloneInitialMartyriaConfiguration,
  createInitialMartyriaConfiguration,
  getBuiltInInitialMartyriaStyleNameSelector,
  getInitialMartyriaContext,
  resolveInitialMartyriaConfiguration,
  resolveInitialMartyriaStyle,
  resolveInitialMartyriaStyleSelection,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { ModeSign } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';

describe('InitialMartyriaStyle', () => {
  it('defines every built-in ID exactly once with a localized display name', () => {
    const styleIds = builtInInitialMartyriaStyles.map((style) => style.id);

    expect(new Set(styleIds).size).toBe(styleIds.length);
    expect(new Set(styleIds)).toEqual(
      new Set(Object.values(BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS)),
    );

    for (const style of builtInInitialMartyriaStyles) {
      expect(
        getBuiltInInitialMartyriaStyleNameSelector(style.id),
      ).not.toBeNull();
    }

    const selector = getBuiltInInitialMartyriaStyleNameSelector(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasNumberV1,
    );
    expect(selector?.(resources.ro)).toBe('Română - Glas numerotat');
  });

  it('resolves inherited, Standard, and explicit element configurations', () => {
    const documentConfiguration = createInitialMartyriaConfiguration(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishSignFirstV1,
    );
    const elementConfiguration = createInitialMartyriaConfiguration(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasV1,
    );

    expect(
      resolveInitialMartyriaStyleSelection({
        elementConfiguration: undefined,
        pageConfiguration: null,
      }).kind,
    ).toBe('standard');
    expect(
      resolveInitialMartyriaStyleSelection({
        elementConfiguration: undefined,
        pageConfiguration: documentConfiguration,
      }),
    ).toMatchObject({
      kind: 'custom',
      configuration: documentConfiguration,
    });
    expect(
      resolveInitialMartyriaStyleSelection({
        elementConfiguration: null,
        pageConfiguration: documentConfiguration,
      }).kind,
    ).toBe('standard');
    expect(
      resolveInitialMartyriaStyleSelection({
        elementConfiguration,
        pageConfiguration: documentConfiguration,
      }),
    ).toMatchObject({
      kind: 'custom',
      configuration: elementConfiguration,
    });
  });

  it('uses language-specific note-name transliterations', () => {
    const spanishStyle = builtInInitialMartyriaStyles.find(
      (item) =>
        item.id === BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoNumberV1,
    )!;

    expect(spanishStyle.transliteratedNoteNames).toMatchObject({
      languageTag: 'es',
      names: {
        [ModeSign.Pa]: 'Pa',
        [ModeSign.Vou]: 'Vu',
        [ModeSign.Ga]: 'Ga',
      },
    });

    const churchSlavonicStyle = builtInInitialMartyriaStyles.find(
      (item) =>
        item.id ===
        BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasNumberV1,
    )!;

    expect(churchSlavonicStyle.transliteratedNoteNames).toMatchObject({
      languageTag: 'cu',
      names: {
        [ModeSign.Pa]: 'Па',
        [ModeSign.Vou]: 'Ву',
        [ModeSign.Ga]: 'Га',
      },
    });

    const arabicStyle = builtInInitialMartyriaStyles.find(
      (item) => item.id === BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ArabicOrdinalV1,
    )!;

    expect(arabicStyle).toMatchObject({
      flowDirection: 'rtl',
      defaultAppearance: {
        mainFontFamily: 'Noto Naskh Arabic',
        greekFontFamily: 'GFS Didot',
      },
      transliteratedNoteNames: {
        languageTag: 'ar',
        direction: 'rtl',
        names: {
          [ModeSign.Ni]: 'ني',
          [ModeSign.Pa]: 'با',
          [ModeSign.Vou]: 'فو',
          [ModeSign.Ga]: 'غا',
          [ModeSign.Thi]: 'دي',
          [ModeSign.Ke]: 'كي',
          [ModeSign.Zo]: 'زو',
        },
      },
    });
  });

  it('applies one configuration appearance to text and musical glyphs', () => {
    const configuration = createInitialMartyriaConfiguration(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishSignFirstV1,
    );
    configuration.appearanceOverrides = {
      mainFontFamily: 'GFS Didot',
      fontSize: 18,
      color: '#123456',
      strokeWidth: 0.25,
      fontVariantCaps: 'small-caps',
      fontVariantNumeric: 'oldstyle-nums proportional-nums',
      fontVariantLigatures: 'no-common-ligatures',
      fontVariantAlternates: 'historical-forms',
    };

    const resolved = resolveInitialMartyriaConfiguration(configuration)!;
    const element = ModeKeyElement.createFromTemplate(
      modeKeyTemplates.find((template) => template.id === 100)!,
    );
    const runs = resolveInitialMartyriaStyle({
      context: getInitialMartyriaContext(element),
      resolvedConfiguration: resolved,
      pageSetup: new PageSetup(),
    }).runs;

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
    expect(
      runs
        .filter((run) => run.kind === 'glyph')
        .every((run) => {
          return (
            run.semantic === 'modeSign' &&
            run.appearance.color === '#123456' &&
            run.appearance.strokeWidth === 0.25
          );
        }),
    ).toBe(true);
  });

  it('uses the Greek font for original note names and permanent Greek text', () => {
    const configuration = createInitialMartyriaConfiguration(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishSignFirstV1,
    );
    configuration.appearanceOverrides.mainFontFamily = 'Source Serif';
    configuration.appearanceOverrides.greekFontFamily = 'GFS Didot';
    const element = ModeKeyElement.createFromTemplate(
      modeKeyTemplates.find((template) => template.id === 500)!,
    );

    const originalRuns = resolveInitialMartyriaStyle({
      context: getInitialMartyriaContext(element),
      resolvedConfiguration:
        resolveInitialMartyriaConfiguration(configuration)!,
      pageSetup: new PageSetup(),
    }).runs;
    const originalPitch = originalRuns.find(
      (run) => run.kind === 'startingPitch',
    );
    expect(originalPitch?.kind).toBe('startingPitch');
    if (originalPitch?.kind === 'startingPitch') {
      expect(originalPitch.noteText.appearance.fontFamily).toBe('GFS Didot');
    }

    configuration.transliterateNoteNames = true;
    const transliteratedRuns = resolveInitialMartyriaStyle({
      context: getInitialMartyriaContext(element),
      resolvedConfiguration:
        resolveInitialMartyriaConfiguration(configuration)!,
      pageSetup: new PageSetup(),
    }).runs;
    const transliteratedPitch = transliteratedRuns.find(
      (run) => run.kind === 'startingPitch',
    );
    expect(transliteratedPitch?.kind).toBe('startingPitch');
    if (transliteratedPitch?.kind === 'startingPitch') {
      expect(transliteratedPitch.noteText.appearance.fontFamily).toBe(
        'Source Serif',
      );
    }
    const plagal = transliteratedRuns.find(
      (run) =>
        run.kind === 'text' &&
        run.content.layout === 'stacked' &&
        run.content.lines[0] === 'λ' &&
        run.content.lines[1] === 'π',
    );
    expect(plagal?.kind).toBe('text');
    if (plagal?.kind === 'text') {
      expect(plagal.fontRole).toBe('greek');
      expect(plagal.languageTag).toBe('el');
      expect(plagal.appearance.fontFamily).toBe('GFS Didot');
    }
  });

  it('uses one font for every Greek style text role', () => {
    const configuration = createInitialMartyriaConfiguration(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1,
    );
    configuration.appearanceOverrides.mainFontFamily = 'Source Serif';
    configuration.appearanceOverrides.greekFontFamily = 'GFS Didot';
    const element = ModeKeyElement.createFromTemplate(
      modeKeyTemplates.find((template) => template.id === 500)!,
    );

    const resolved = resolveInitialMartyriaConfiguration(configuration)!;
    const runs = resolveInitialMartyriaStyle({
      context: getInitialMartyriaContext(element),
      resolvedConfiguration: resolved,
      pageSetup: new PageSetup(),
    }).runs;

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

  it('clones appearance overrides without sharing mutable state', () => {
    const source = createInitialMartyriaConfiguration(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1,
    );
    source.appearanceOverrides.mainFontFamily = 'GFS Didot';

    const clone = cloneInitialMartyriaConfiguration(source);
    clone.appearanceOverrides.mainFontFamily = 'Source Serif';

    expect(source.appearanceOverrides.mainFontFamily).toBe('GFS Didot');
  });
});
