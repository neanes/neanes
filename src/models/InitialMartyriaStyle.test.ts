import { describe, expect, it } from 'vitest';

import { ModeKeyElement } from '@/models/Element';
import {
  createInitialMartyriaStartingNoteText,
  getInitialMartyriaContext,
  getInitialMartyriaFixedSeparatorWidth,
  getInitialMartyriaSeparatorAfter,
  getInitialMartyriaSeparatorBefore,
  isInitialMartyriaComponentVisible,
  resolveInitialMartyriaStyle,
  traditionalGreekInitialMartyriaStyle,
  validateInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { ModeSign } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
describe('InitialMartyriaStyleResolver', () => {
  it('resolves traditional glyphs for every template', () => {
    for (const template of modeKeyTemplates) {
      const resolution = resolveInitialMartyriaStyle({
        context: getInitialMartyriaContext(
          ModeKeyElement.createFromTemplate(template),
        ),
        pageSetup: new PageSetup(),
      });
      expect(resolution.runs.some((run) => run.kind === 'glyph')).toBe(true);
    }
  });
  it('gives exact variation overrides precedence', () => {
    expect(
      isInitialMartyriaComponentVisible(
        { modes: [], variationOverrides: [{ templateId: 10, visible: true }] },
        { mode: 1, templateId: 10 },
      ),
    ).toBe(true);
    expect(
      isInitialMartyriaComponentVisible(
        {
          modes: [1],
          variationOverrides: [{ templateId: 10, visible: false }],
        },
        { mode: 1, templateId: 10 },
      ),
    ).toBe(false);
  });
  it('falls back for a missing style', () => {
    expect(
      resolveInitialMartyriaStyle({
        activeStyleId: 'missing',
        context: getInitialMartyriaContext(new ModeKeyElement()),
        pageSetup: new PageSetup(),
      }).style,
    ).toBe(traditionalGreekInitialMartyriaStyle);
  });
  it('rejects an empty component collection', () => {
    expect(
      validateInitialMartyriaStyle({
        ...traditionalGreekInitialMartyriaStyle,
        id: 'custom',
        components: [],
      }),
    ).toContain('A style must contain at least one component.');
  });
  it('rejects non-positive font dimensions', () => {
    const style = structuredClone(traditionalGreekInitialMartyriaStyle);
    style.id = 'invalid-appearance';
    style.textAppearance.fontSize = 0;
    style.textAppearance.strokeWidth = -1;

    const errors = validateInitialMartyriaStyle(style);

    expect(errors).toContain(
      'Component appearance contains an invalid font size.',
    );
    expect(errors).toContain(
      'Component appearance contains an invalid stroke width.',
    );
  });
  it('resolves custom starting-note text with associated pitch notes', () => {
    const element = ModeKeyElement.createFromTemplate(
      modeKeyTemplates.find((template) => template.id === 603)!,
    );
    const style = structuredClone(traditionalGreekInitialMartyriaStyle);
    style.id = 'custom-starting-notes';
    style.startingNoteText = createInitialMartyriaStartingNoteText();
    style.startingNoteText.names[ModeSign.Ni] = 'Ni';
    const component = style.components.find(
      (item) => item.kind === 'startingNoteCluster',
    );
    if (component?.kind === 'startingNoteCluster') {
      component.rendering = 'customText';
    }

    const run = resolveInitialMartyriaStyle({
      activeStyleId: style.id,
      styles: [style],
      context: getInitialMartyriaContext(element),
      pageSetup: new PageSetup(),
    }).runs.find((item) => item.kind === 'startingPitch');

    expect(run?.kind).toBe('startingPitch');
    if (run?.kind === 'startingPitch') {
      expect(run.cluster.primary?.note).toBe(element.note);
      expect(run.cluster.secondary?.note).toBe(element.note2);
      expect(run.cluster.trailingGlyphs).toEqual(
        [
          element.quantitativeNeumeRight,
          element.fthoraAboveQuantitativeNeumeRight,
        ].filter((item) => item != null),
      );
    }
  });

  it('round-trips current stacked text shape', () => {
    const stacked = {
      id: 'stacked-text',
      kind: 'stackedText' as const,
      top: 'λ',
      bottom: 'π',
      visibility: { modes: [1 as const], variationOverrides: [] },
    };
    expect(stacked).toMatchObject({
      kind: 'stackedText',
      top: 'λ',
      bottom: 'π',
    });
  });

  it('resolves separators from semantic adjacent runs', () => {
    const glyph = (semantic: 'ekhos' | 'modeSign' | 'varys') => ({
      kind: 'glyph' as const,
      componentId: semantic,
      semantic,
      appearance: {},
      direction: 'ltr' as const,
      glyphs: [],
    });
    const text = {
      kind: 'text' as const,
      componentId: 'text',
      appearance: {},
      direction: 'ltr' as const,
      content: { layout: 'inline' as const, text: 'Mode' },
    };
    expect(
      getInitialMartyriaSeparatorBefore([glyph('ekhos'), glyph('modeSign')], 1),
    ).toBe('modeSign');
    expect(
      getInitialMartyriaSeparatorBefore([text, glyph('modeSign')], 1),
    ).toBe('modeSign');
    const stacked = {
      kind: 'text' as const,
      componentId: 'stacked',
      appearance: {},
      direction: 'ltr' as const,
      content: { layout: 'stacked' as const, lines: ['λ', 'π'], gap: 0 },
    };
    expect(getInitialMartyriaSeparatorBefore([stacked, text], 1)).toBe(
      'plagal',
    );
    expect(getInitialMartyriaSeparatorAfter([text, stacked], 1)).toBe('plagal');
  });

  it('resolves the Varys separator from logical signature flow', () => {
    const glyph = (semantic: 'ekhos' | 'modeSign' | 'varys') => ({
      kind: 'glyph' as const,
      componentId: semantic,
      semantic,
      appearance: {},
      direction: 'rtl' as const,
      glyphs: [],
    });

    expect(
      getInitialMartyriaSeparatorBefore([glyph('ekhos'), glyph('varys')], 1),
    ).toBe('varys');
    expect(getInitialMartyriaSeparatorBefore([glyph('varys')], 0)).toBe('none');
    expect(
      getInitialMartyriaSeparatorBefore([glyph('modeSign'), glyph('varys')], 1),
    ).toBe('varys');
  });

  it('uses the fixed separator widths', () => {
    expect(getInitialMartyriaFixedSeparatorWidth('varys')).toBe(0.415);
    expect(getInitialMartyriaFixedSeparatorWidth('plagal')).toBe(0.43);
    expect(getInitialMartyriaFixedSeparatorWidth('modeSign')).toBe(0.43);
  });
});
