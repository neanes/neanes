import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import { ModeKeyElement } from '@/models/Element';
import {
  builtInInitialMartyriaStyles,
  cloneInitialMartyriaStyle,
  createInitialMartyriaStartingNoteText,
  getInitialMartyriaContext,
  getInitialMartyriaFixedSeparatorWidth,
  getInitialMartyriaPitchClusterGlyphCount,
  getInitialMartyriaPitchClusterPrimaryGlyphCount,
  getInitialMartyriaPitchNoteGlyphCount,
  getInitialMartyriaSeparatorAfter,
  getInitialMartyriaSeparatorBefore,
  isInitialMartyriaComponentVisible,
  isInitialMartyriaStartingNoteRun,
  resolveInitialMartyriaBaseTextAppearance,
  resolveInitialMartyriaStyle,
  resolveInitialMartyriaStyleSelection,
  traditionalGreekInitialMartyriaStyle,
  validateInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { Fthora, ModeSign } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultParagraphStyles,
} from '@/models/ParagraphStyle';

describe('InitialMartyriaStyle', () => {
  it('resolves the Standard, inherited, and explicit custom style states', () => {
    const documentStyle = builtInInitialMartyriaStyles[2];
    const elementStyle = builtInInitialMartyriaStyles[3];

    expect(
      resolveInitialMartyriaStyleSelection({
        elementStyleId: undefined,
        pageStyleId: null,
      }),
    ).toEqual({ kind: 'standard', missingStyleId: null });

    expect(
      resolveInitialMartyriaStyleSelection({
        elementStyleId: undefined,
        pageStyleId: documentStyle.id,
      }),
    ).toEqual({
      kind: 'custom',
      style: documentStyle,
      missingStyleId: null,
    });

    expect(
      resolveInitialMartyriaStyleSelection({
        elementStyleId: null,
        pageStyleId: documentStyle.id,
      }),
    ).toEqual({ kind: 'standard', missingStyleId: null });

    expect(
      resolveInitialMartyriaStyleSelection({
        elementStyleId: elementStyle.id,
        pageStyleId: documentStyle.id,
      }),
    ).toEqual({
      kind: 'custom',
      style: elementStyle,
      missingStyleId: null,
    });
  });

  it('falls back safely when a selected custom style is missing', () => {
    const documentStyle = builtInInitialMartyriaStyles[2];

    expect(
      resolveInitialMartyriaStyleSelection({
        elementStyleId: 'missing:element-style',
        pageStyleId: documentStyle.id,
      }),
    ).toEqual({
      kind: 'custom',
      style: documentStyle,
      missingStyleId: 'missing:element-style',
    });

    expect(
      resolveInitialMartyriaStyleSelection({
        elementStyleId: undefined,
        pageStyleId: 'missing:document-style',
      }),
    ).toEqual({
      kind: 'standard',
      missingStyleId: 'missing:document-style',
    });
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

  it('rejects an empty component collection', () => {
    expect(
      validateInitialMartyriaStyle({
        ...traditionalGreekInitialMartyriaStyle,
        id: 'custom',
        components: [],
      }),
    ).toContain('A style must contain at least one component.');
  });

  it('deeply clones authorable component and terminology data', () => {
    const source = reactive(
      cloneInitialMartyriaStyle(traditionalGreekInitialMartyriaStyle),
    );
    source.id = 'clone-source';
    source.components[0].visibility.variationOverrides.push({
      templateId: 1,
      visible: true,
    });

    const clone = cloneInitialMartyriaStyle(source);
    clone.startingNoteText.names[ModeSign.Ni] = 'Changed';
    clone.components[0].visibility.modes[0] = 8;
    clone.components[0].visibility.variationOverrides[0].visible = false;

    expect(source.startingNoteText.names[ModeSign.Ni]).toBe('Νη');
    expect(source.components[0].visibility.modes[0]).toBe(1);
    expect(source.components[0].visibility.variationOverrides[0].visible).toBe(
      true,
    );
  });

  it('uses the default paragraph style unless a text component overrides it', () => {
    const style = cloneInitialMartyriaStyle(
      traditionalGreekInitialMartyriaStyle,
    );
    style.defaultParagraphStyleId =
      BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria;
    style.components = [
      {
        id: 'default-text',
        kind: 'text',
        content: 'Mode',
        visibility: { modes: [1], variationOverrides: [] },
      },
      {
        id: 'greek-text',
        kind: 'text',
        content: 'Πα',
        paragraphStyleId: BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyriaGreek,
        visibility: { modes: [1], variationOverrides: [] },
      },
    ];
    const paragraphStyles = createDefaultParagraphStyles();
    const runs = resolveInitialMartyriaStyle({
      style,
      context: getInitialMartyriaContext(new ModeKeyElement()),
      paragraphStyles,
      pageSetup: new PageSetup(),
    }).runs;

    expect(runs[0].appearance.fontFamily).toBe('Source Serif');
    expect(runs[1].appearance.fontFamily).toBe('GFS Didot');
    expect(
      resolveInitialMartyriaBaseTextAppearance(style, paragraphStyles),
    ).toMatchObject({
      fontFamily: 'Source Serif',
    });
  });

  it('resolves custom starting-note text with its pitch notes', () => {
    const element = ModeKeyElement.createFromTemplate(
      modeKeyTemplates.find((template) => template.id === 603)!,
    );
    const style = cloneInitialMartyriaStyle(
      traditionalGreekInitialMartyriaStyle,
    );
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
      style,
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
    const stacked = {
      kind: 'text' as const,
      componentId: 'stacked',
      appearance: {},
      direction: 'ltr' as const,
      content: { layout: 'stacked' as const, lines: ['λ', 'π'], gap: 0 },
    };

    expect(
      getInitialMartyriaSeparatorBefore([glyph('ekhos'), glyph('modeSign')], 1),
    ).toBe('modeSign');
    expect(
      getInitialMartyriaSeparatorBefore([text, glyph('modeSign')], 1),
    ).toBe('modeSign');
    expect(getInitialMartyriaSeparatorBefore([stacked, text], 1)).toBe(
      'plagal',
    );
    expect(getInitialMartyriaSeparatorAfter([text, stacked], 1)).toBe('plagal');
  });

  it('uses one fixed starting-note separator for every preceding component', () => {
    const glyph = (semantic: 'ekhos' | 'modeSign' | 'plagal' | 'varys') => ({
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
    const startingPitch = {
      kind: 'startingPitch' as const,
      componentId: 'starting-pitch',
      appearance: {},
      noteText: {
        ...createInitialMartyriaStartingNoteText(),
        appearance: {},
      },
      direction: 'ltr' as const,
      cluster: { primary: null, secondary: null, trailingGlyphs: [] },
    };
    const startingGlyph = {
      kind: 'glyph' as const,
      componentId: 'starting-glyph',
      appearance: {},
      direction: 'ltr' as const,
      glyphs: [],
      pitchCluster: { primary: null, secondary: null, trailingGlyphs: [] },
    };

    for (const before of [
      text,
      glyph('ekhos'),
      glyph('modeSign'),
      glyph('plagal'),
      glyph('varys'),
    ]) {
      expect(
        getInitialMartyriaSeparatorBefore([before, startingPitch], 1),
      ).toBe('startingNote');
      expect(
        getInitialMartyriaSeparatorBefore([before, startingGlyph], 1),
      ).toBe('startingNote');
    }
    expect(getInitialMartyriaSeparatorBefore([startingPitch], 0)).toBe('none');
    expect(getInitialMartyriaSeparatorBefore([startingGlyph], 0)).toBe('none');
    expect(isInitialMartyriaStartingNoteRun(startingPitch)).toBe(true);
    expect(isInitialMartyriaStartingNoteRun(startingGlyph)).toBe(true);
    expect(isInitialMartyriaStartingNoteRun(text)).toBe(false);
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
    expect(getInitialMartyriaFixedSeparatorWidth('startingNote')).toBe(0.43);
  });

  it('counts pitch note groups separately from trailing glyphs', () => {
    const note = {
      note: ModeSign.Ni,
      fthoraAbove: null,
      quantitativeNeumeAbove: null,
    } as const;
    const markedNote = {
      ...note,
      fthoraAbove: Fthora.DiatonicNiLow,
      quantitativeNeumeAbove: ModeSign.Pa,
    };

    expect(getInitialMartyriaPitchNoteGlyphCount(null)).toBe(0);
    expect(getInitialMartyriaPitchNoteGlyphCount(note)).toBe(1);
    expect(getInitialMartyriaPitchNoteGlyphCount(markedNote)).toBe(3);
    expect(
      getInitialMartyriaPitchClusterPrimaryGlyphCount({
        primary: markedNote,
        secondary: note,
        trailingGlyphs: [ModeSign.Ga],
      }),
    ).toBe(3);
    expect(
      getInitialMartyriaPitchClusterGlyphCount({
        primary: markedNote,
        secondary: note,
        trailingGlyphs: [ModeSign.Ga],
      }),
    ).toBe(4);
  });
});
