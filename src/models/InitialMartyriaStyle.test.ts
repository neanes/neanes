import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import { ModeKeyElement } from '@/models/Element';
import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  getInitialMartyriaContext,
  resolveInitialMartyriaStyle,
  traditionalGreekInitialMartyriaStyle,
  validateInitialMartyriaStyle,
  validateModeTerminology,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { ModeSign } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { Score } from '@/models/Score';
import { SaveService } from '@/services/SaveService';

describe('InitialMartyriaStyleResolver', () => {
  it('reproduces the traditional glyph sequence for every mode-key template', () => {
    const pageSetup = new PageSetup();

    for (const template of modeKeyTemplates) {
      const element = ModeKeyElement.createFromTemplate(template);
      const resolution = resolveInitialMartyriaStyle({
        context: getInitialMartyriaContext(element),
        pageSetup,
      });

      expect(resolution.style).toBe(traditionalGreekInitialMartyriaStyle);
      expect(resolution.runs.flatMap((run) => run.notation ?? [])).toEqual([
        ModeSign.Ekhos,
        ...(element.isPlagal ? [ModeSign.Plagal] : []),
        ...(element.isVarys ? [ModeSign.Varys] : []),
        element.martyria,
        ...(element.note == null ? [] : [element.note]),
        ...(element.fthoraAboveNote == null ? [] : [element.fthoraAboveNote]),
        ...(element.quantitativeNeumeAboveNote == null
          ? []
          : [element.quantitativeNeumeAboveNote]),
        ...(element.note2 == null ? [] : [element.note2]),
        ...(element.fthoraAboveNote2 == null ? [] : [element.fthoraAboveNote2]),
        ...(element.quantitativeNeumeAboveNote2 == null
          ? []
          : [element.quantitativeNeumeAboveNote2]),
        ...(element.quantitativeNeumeRight == null
          ? []
          : [element.quantitativeNeumeRight]),
        ...(element.fthoraAboveQuantitativeNeumeRight == null
          ? []
          : [element.fthoraAboveQuantitativeNeumeRight]),
      ]);
    }
  });

  it('falls back without discarding an unresolved document style id', () => {
    const resolution = resolveInitialMartyriaStyle({
      activeStyleId: 'missing-style',
      context: getInitialMartyriaContext(new ModeKeyElement()),
      pageSetup: new PageSetup(),
    });

    expect(resolution.style.id).toBe(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1,
    );
    expect(resolution.missingStyleId).toBe('missing-style');
  });

  it('round-trips custom document resources and omits built-ins', () => {
    (globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';
    const score = new Score();
    score.pageSetup.initialMartyriaStyleId = 'custom-style';
    score.modeTerminologies = [
      {
        id: 'custom-terms',
        displayName: 'Custom terms',
        languageTag: 'en',
        direction: 'ltr',
        values: { completeModeName: { 1: 'First' } },
      },
    ];
    score.initialMartyriaStyles = [
      traditionalGreekInitialMartyriaStyle,
      {
        ...traditionalGreekInitialMartyriaStyle,
        id: 'custom-style',
        displayName: 'Custom style',
      },
    ];

    const saved = SaveService.SaveScoreToJson(reactive(score));
    const loaded = SaveService.LoadScoreFromJson(saved);

    expect(saved.initialMartyriaStyles?.map((style) => style.id)).toEqual([
      'custom-style',
    ]);
    expect(loaded.pageSetup.initialMartyriaStyleId).toBe('custom-style');
    expect(loaded.modeTerminologies).toEqual(score.modeTerminologies);
    expect(loaded.initialMartyriaStyles).toEqual(
      score.initialMartyriaStyles.slice(1),
    );
  });

  it('keeps notation in the page direction and falls back for a missing terminology', () => {
    const style = {
      ...traditionalGreekInitialMartyriaStyle,
      id: 'rtl-style',
      terminologyId: 'rtl-terms',
      flowDirection: 'rtl' as const,
      components: [
        { id: 'pitch', kind: 'startingPitchCluster' as const },
        {
          id: 'name',
          kind: 'terminology' as const,
          field: 'completeModeName' as const,
        },
      ],
    };
    const pageSetup = new PageSetup();
    pageSetup.direction = 'ltr';

    const resolved = resolveInitialMartyriaStyle({
      activeStyleId: style.id,
      context: getInitialMartyriaContext(new ModeKeyElement()),
      styles: [style],
      terminologies: [
        {
          id: 'rtl-terms',
          displayName: 'RTL terms',
          languageTag: 'ar',
          direction: 'rtl',
          values: { completeModeName: { 1: 'الأول' } },
        },
      ],
      pageSetup,
    });

    expect(resolved.runs[0].direction).toBe('ltr');
    expect(resolved.runs[1].direction).toBe('rtl');

    const missingTerminology = resolveInitialMartyriaStyle({
      activeStyleId: style.id,
      context: getInitialMartyriaContext(new ModeKeyElement()),
      styles: [style],
      pageSetup,
    });

    expect(missingTerminology.missingTerminologyId).toBe('rtl-terms');
    expect(missingTerminology.style).toBe(traditionalGreekInitialMartyriaStyle);
  });

  it('omits Varys from unrestricted family ordinals', () => {
    const element = new ModeKeyElement();
    element.mode = 7;
    const resolution = resolveInitialMartyriaStyle({
      activeStyleId: 'family-ordinal',
      context: getInitialMartyriaContext(element),
      styles: [
        {
          ...traditionalGreekInitialMartyriaStyle,
          id: 'family-ordinal',
          components: [
            {
              id: 'family-ordinal',
              kind: 'modeNumber',
              scheme: 'familyOrdinal',
            },
          ],
        },
      ],
      pageSetup: new PageSetup(),
    });

    expect(resolution.runs).toEqual([]);
  });

  it('uses a bundled text font without changing notation defaults', () => {
    const resolution = resolveInitialMartyriaStyle({
      activeStyleId: 'mixed-fonts',
      context: getInitialMartyriaContext(new ModeKeyElement()),
      styles: [
        {
          ...traditionalGreekInitialMartyriaStyle,
          id: 'mixed-fonts',
          components: [
            { id: 'text', kind: 'literal', text: 'Mode' },
            { id: 'notation', kind: 'notationGlyph', source: 'modeWord' },
          ],
        },
      ],
      pageSetup: new PageSetup(),
    });

    expect(resolution.runs[0].appearance.fontFamily).toBe('Source Serif');
    expect(resolution.runs[1].appearance.fontFamily).toBe('Neanes');
  });

  it('validates style terminology references and locale formatting', () => {
    expect(
      validateModeTerminology({
        id: 'blank-display-name',
        displayName: '   ',
        languageTag: 'en',
        direction: 'ltr',
        values: {},
      }),
    ).toContain('A terminology display name is required.');
    expect(
      validateInitialMartyriaStyle(
        {
          ...traditionalGreekInitialMartyriaStyle,
          id: 'custom',
          terminologyId: 'missing',
          modeOverrides: {
            1: {
              components: [
                {
                  id: 'name',
                  kind: 'terminology',
                  field: 'completeModeName',
                },
              ],
            },
          },
        },
        [],
      ),
    ).toContain('Missing terminology pack: missing.');
    expect(
      validateModeTerminology({
        id: 'invalid',
        displayName: 'Invalid',
        languageTag: 'not_a_locale',
        direction: 'ltr',
        values: {},
      }),
    ).toContain('The terminology locale or numbering system is invalid.');
    expect(
      validateModeTerminology({
        id: 'unsupported-numbering-system',
        displayName: 'Unsupported numbering system',
        languageTag: 'en',
        direction: 'ltr',
        numberingSystem: 'foobar',
        values: {},
      }),
    ).toContain('The terminology locale or numbering system is invalid.');
  });
});
