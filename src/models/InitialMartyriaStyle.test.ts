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
  resolveInitialMartyriaBaseTextAppearance,
  resolveInitialMartyriaStyle,
  traditionalGreekInitialMartyriaStyle,
  validateInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { Fthora, ModeSign } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultParagraphStyles,
  ParagraphStyle,
} from '@/models/ParagraphStyle';
describe('InitialMartyriaStyleResolver', () => {
  it('preserves absent appearance overrides when cloning', () => {
    const v2 = builtInInitialMartyriaStyles[1];
    const clone = cloneInitialMartyriaStyle(v2);

    expect(clone.textAppearance).toStrictEqual({});
    expect(clone.startingNoteText.appearance).toStrictEqual({});
  });
  it('keeps Traditional Greek V2 inheritance unchanged when cloned', () => {
    const v2 = {
      ...builtInInitialMartyriaStyles[1],
      textParagraphStyleId: 'inherited-paragraph',
    };
    const clone = cloneInitialMartyriaStyle(v2);
    const paragraphStyle = new ParagraphStyle();
    paragraphStyle.id = 'inherited-paragraph';
    paragraphStyle.overrides = {
      fontFamily: 'Inherited Family',
      fontStyle: 'Inherited Style',
      fontSize: 42,
      color: 'Inherited Color',
      strokeWidth: 3,
      strokeColor: 'Inherited Stroke',
    };

    expect(
      resolveInitialMartyriaBaseTextAppearance(v2, [paragraphStyle]),
    ).toStrictEqual(
      resolveInitialMartyriaBaseTextAppearance(clone, [paragraphStyle]),
    );
    expect(
      resolveInitialMartyriaBaseTextAppearance(clone, [paragraphStyle]),
    ).toMatchObject(paragraphStyle.overrides);
  });
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
  it('applies paragraph-style appearance to neume runs', () => {
    const paragraphStyles = createDefaultParagraphStyles();
    const paragraphStyle = paragraphStyles.find(
      (style) => style.id === BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
    )!;
    paragraphStyle.overrides.color = 'inherited color';

    const resolution = resolveInitialMartyriaStyle({
      context: getInitialMartyriaContext(new ModeKeyElement()),
      pageSetup: new PageSetup(),
      paragraphStyles,
    });

    expect(
      resolution.runs
        .filter((run) => run.kind === 'glyph' || run.kind === 'startingPitch')
        .every((run) => run.appearance.color === 'inherited color'),
    ).toBe(true);
  });
  it('projects only color into neume runs', () => {
    const paragraphStyles = createDefaultParagraphStyles();
    const paragraphStyle = paragraphStyles.find(
      (style) => style.id === BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
    )!;
    paragraphStyle.overrides = {
      color: 'paragraph color',
      fontFamily: 'Paragraph Font',
      fontSize: 18,
      fontStyle: 'Paragraph Style',
      strokeWidth: 2,
      lineHeight: 1.5,
    };
    const style = cloneInitialMartyriaStyle(
      traditionalGreekInitialMartyriaStyle,
    );
    style.id = 'color-only-neumes';
    style.textAppearance = {
      color: 'text default color',
      fontFamily: 'Text Font',
      fontSize: 17,
      fontStyle: 'Text Style',
      strokeWidth: 3,
      baselineShift: 4,
    };
    style.startingNoteText.appearance = {
      color: 'starting color',
      fontFamily: 'Starting Font',
      fontSize: 16,
      baselineShift: 2,
    };

    const resolution = resolveInitialMartyriaStyle({
      activeStyleId: style.id,
      styles: [style],
      context: getInitialMartyriaContext(new ModeKeyElement()),
      pageSetup: new PageSetup(),
      paragraphStyles,
    });

    for (const run of resolution.runs.filter((item) => item.kind === 'glyph')) {
      expect(run.appearance).toEqual({ color: 'text default color' });
    }
  });
  it('keeps custom note text appearance separate from neume appearance', () => {
    const paragraphStyles = createDefaultParagraphStyles();
    const paragraphStyle = paragraphStyles.find(
      (style) => style.id === BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
    )!;
    paragraphStyle.overrides = {
      color: 'paragraph color',
      fontFamily: 'Paragraph Font',
      fontSize: 18,
    };
    const style = cloneInitialMartyriaStyle(
      traditionalGreekInitialMartyriaStyle,
    );
    style.id = 'custom-text-neumes';
    style.startingNoteText.appearance = {
      color: 'starting color',
      fontFamily: 'Starting Font',
      fontSize: 16,
      baselineShift: 2,
    };
    const component = style.components.find(
      (item) => item.kind === 'startingNoteCluster',
    );
    if (component?.kind !== 'startingNoteCluster') {
      throw new Error('Expected a starting note cluster component');
    }
    component.rendering = 'customText';
    component.appearance = {
      color: 'component color',
      fontStyle: 'Component Style',
    };

    const run = resolveInitialMartyriaStyle({
      activeStyleId: style.id,
      styles: [style],
      context: getInitialMartyriaContext(new ModeKeyElement()),
      pageSetup: new PageSetup(),
      paragraphStyles,
    }).runs.find((item) => item.kind === 'startingPitch');

    expect(run?.appearance).toEqual({ color: 'component color' });
    expect(run?.noteText.appearance).toMatchObject({
      color: 'component color',
      fontFamily: 'Starting Font',
      fontSize: 16,
      fontStyle: 'Component Style',
      baselineShift: 2,
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
    const style = cloneInitialMartyriaStyle(
      traditionalGreekInitialMartyriaStyle,
    );
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
  it('deeply clones every component kind and accepts reactive styles', () => {
    const source = reactive({
      ...cloneInitialMartyriaStyle(traditionalGreekInitialMartyriaStyle),
      id: 'clone-source',
      textAppearance: { fontFamily: 'Source', fontSize: 12 },
      startingNoteText: {
        ...createInitialMartyriaStartingNoteText(),
        names: { ...createInitialMartyriaStartingNoteText().names },
        appearance: { fontFamily: 'Starting', fontSize: 10 },
      },
      components: [
        {
          id: 'text',
          kind: 'text' as const,
          content: 'Text',
          appearance: { fontFamily: 'Text', fontSize: 11 },
          visibility: {
            modes: [1 as const],
            variationOverrides: [{ templateId: 1, visible: true }],
          },
        },
        {
          id: 'stacked',
          kind: 'stackedText' as const,
          top: 'Top',
          bottom: 'Bottom',
          appearance: { color: 'red' },
          visibility: { modes: [2 as const], variationOverrides: [] },
        },
        ...(
          ['ekhosGlyph', 'plagalGlyph', 'modeSignGlyph', 'varysGlyph'] as const
        ).map((kind) => ({
          id: kind,
          kind,
          visibility: { modes: [3 as const], variationOverrides: [] },
        })),
        {
          id: 'starting',
          kind: 'startingNoteCluster' as const,
          rendering: 'customText' as const,
          appearance: { baselineShift: 2 },
          visibility: { modes: [4 as const], variationOverrides: [] },
        },
      ],
    });

    const clone = cloneInitialMartyriaStyle(source);

    expect(clone.id).toBe(source.id);
    expect(clone.displayName).toBe(source.displayName);
    clone.textAppearance.fontSize = 24;
    clone.startingNoteText.names[ModeSign.Ni] = 'Changed';
    clone.startingNoteText.appearance.fontSize = 20;
    clone.components[0].visibility.modes[0] = 8;
    clone.components[0].visibility.variationOverrides[0].visible = false;
    if (clone.components[0].kind === 'text') {
      clone.components[0].appearance!.fontSize = 30;
    }

    expect(source.textAppearance.fontSize).toBe(12);
    expect(source.startingNoteText.names[ModeSign.Ni]).toBe('Νη');
    expect(source.startingNoteText.appearance.fontSize).toBe(10);
    expect(source.components[0].visibility.modes).toEqual([1]);
    expect(source.components[0].visibility.variationOverrides[0].visible).toBe(
      true,
    );
    if (source.components[0].kind === 'text') {
      expect(source.components[0].appearance?.fontSize).toBe(11);
    }
    expect(clone.components.map((component) => component.kind)).toEqual([
      'text',
      'stackedText',
      'ekhosGlyph',
      'plagalGlyph',
      'modeSignGlyph',
      'varysGlyph',
      'startingNoteCluster',
    ]);
  });
  it('resolves custom starting-note text with associated pitch notes', () => {
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
      noteText: createInitialMartyriaStartingNoteText(),
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
    expect(getInitialMartyriaFixedSeparatorWidth('startingNote')).toBe(0.43);
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
