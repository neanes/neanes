import { describe, expect, it, vi } from 'vitest';
import { nextTick, reactive, ref } from 'vue';

import type { TextBoxAlignment } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultParagraphStyles,
  createParagraphStyleFallback,
  ParagraphStyle,
} from '@/models/ParagraphStyle';
import { ALIGNMENT_OVERRIDE_MIXED_VALUE } from '@/utils/alignmentOverride';

const registryMocks = vi.hoisted(() => ({
  execForActiveOrLastOwner: vi.fn(),
  useActiveOrLastEditorForOwner: vi.fn(),
  useEditorCommandObservableState: vi.fn(),
  useEditorCommandStates: vi.fn(),
}));

vi.mock('@/composables/useRichTextEditorRegistry', () => ({
  execForActiveOrLastOwner: registryMocks.execForActiveOrLastOwner,
  useActiveOrLastEditorForOwner: registryMocks.useActiveOrLastEditorForOwner,
  useEditorCommandObservableState:
    registryMocks.useEditorCommandObservableState,
  useEditorCommandStates: registryMocks.useEditorCommandStates,
}));

vi.mock('i18next-vue', () => ({
  useTranslation: () => ({
    t: () => 'translation',
  }),
}));

import {
  PARAGRAPH_STYLE_MIXED_VALUE,
  PARAGRAPH_STYLE_NONE_VALUE,
  resolveRichTextParagraphStyleState,
  useRichParagraphStyleCommands,
} from './useRichTextStyleCommands';

describe('resolveRichTextParagraphStyleState', () => {
  const paragraphStyles = createDefaultParagraphStyles();
  const fallbackParagraphStyle = createParagraphStyleFallback();

  it('uses None plus the fallback style when no Neanes paragraph style is active', () => {
    const state = resolveRichTextParagraphStyleState(
      paragraphStyles,
      [],
      fallbackParagraphStyle,
    );

    expect(state.paragraphStyleValue).toBe(PARAGRAPH_STYLE_NONE_VALUE);
    expect(state.activeParagraphStyle).toBeNull();
    expect(state.resolvedActiveParagraphStyle).toEqual(fallbackParagraphStyle);
  });

  it('resolves the active Neanes paragraph style when exactly one is active', () => {
    const state = resolveRichTextParagraphStyleState(
      paragraphStyles,
      [BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics],
      fallbackParagraphStyle,
    );

    expect(state.paragraphStyleValue).toBe(BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics);
    expect(state.activeParagraphStyle?.fontFamily).toBe(
      fallbackParagraphStyle.fontFamily,
    );
    expect(state.resolvedActiveParagraphStyle).toEqual(
      state.activeParagraphStyle,
    );
  });

  it('uses Mixed plus the fallback style when multiple Neanes paragraph styles are active', () => {
    const state = resolveRichTextParagraphStyleState(
      paragraphStyles,
      [BUILT_IN_PARAGRAPH_STYLE_IDS.Title, BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics],
      fallbackParagraphStyle,
    );

    expect(state.paragraphStyleValue).toBe(PARAGRAPH_STYLE_MIXED_VALUE);
    expect(state.activeParagraphStyle).toBeNull();
    expect(state.resolvedActiveParagraphStyle).toEqual(fallbackParagraphStyle);
  });
});

describe('useRichParagraphStyleCommands', () => {
  function createCommandState(value: unknown, isEnabled = true) {
    return {
      value,
      isEnabled,
      exists: true,
      properties: {},
    };
  }

  function setupCommands(
    paragraphStyles: ParagraphStyle[] = createDefaultParagraphStyles(),
    activeStyleIds: string[] = [],
    underlineActive = false,
    commandOverrides: {
      fontFamily?: string;
      fontStyle?: string;
      fontSize?: string;
      fontColor?: string;
      bold?: boolean;
      italic?: boolean;
      alignment?: string;
    } = {},
  ) {
    const element = {};
    const pageSetup = new PageSetup();
    const fallbackParagraphStyle = createParagraphStyleFallback();
    const commandStates = {
      style: createCommandState(activeStyleIds, true),
      fontFamily: createCommandState(commandOverrides.fontFamily ?? '', true),
      fontSize: createCommandState(commandOverrides.fontSize ?? '', true),
      fontColor: createCommandState(commandOverrides.fontColor ?? '', true),
      fontStyle: createCommandState(commandOverrides.fontStyle ?? '', true),
      fontStyleToggleBold: createCommandState(
        commandOverrides.bold ?? false,
        true,
      ),
      fontStyleToggleItalic: createCommandState(
        commandOverrides.italic ?? false,
        true,
      ),
      underline: createCommandState(underlineActive, true),
      alignment: createCommandState(commandOverrides.alignment, true),
    };

    registryMocks.execForActiveOrLastOwner.mockReset();
    registryMocks.useActiveOrLastEditorForOwner.mockReturnValue({ value: {} });
    registryMocks.useEditorCommandStates.mockReturnValue(
      commandStates as unknown as Record<string, unknown>,
    );
    registryMocks.useEditorCommandObservableState.mockReturnValue({
      value: undefined,
      isEnabled: true,
      exists: true,
      properties: {
        enabledStyles: [BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics, ...activeStyleIds],
      },
    });

    return {
      commands: useRichParagraphStyleCommands(
        {
          element,
          pageSetup,
          fonts: [],
          paragraphStyles,
          fallbackParagraphStyle,
        },
        [],
      ),
      commandStates,
    };
  }

  it('only applies the style command when selecting an underlined paragraph style', () => {
    const underlinedStyle = new ParagraphStyle();
    underlinedStyle.id = 'underlined-style';
    underlinedStyle.overrides.textDecoration = 'underline';

    const { commands } = setupCommands([underlinedStyle]);

    commands.onParagraphStyleChanged('underlined-style');

    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenNthCalledWith(
      1,
      {},
      'style',
      { styleName: 'underlined-style', forceValue: true },
    );
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledTimes(1);
  });

  it('pushes the resolved paragraph-style fallback into the bold and italic toggle commands', async () => {
    const boldToggle = {
      refresh: vi.fn(),
      setResolvedParagraphStyleFallback: vi.fn(),
    };
    const italicToggle = {
      refresh: vi.fn(),
      setResolvedParagraphStyleFallback: vi.fn(),
    };

    const editor = {
      commands: {
        get: (name: string) => {
          if (name === 'fontStyleToggleBold') {
            return boldToggle;
          }

          if (name === 'fontStyleToggleItalic') {
            return italicToggle;
          }

          return null;
        },
      },
    };

    const initialStyle = new ParagraphStyle();
    initialStyle.id = 'initial-style';
    initialStyle.overrides.fontFamily = 'Initial Family';
    initialStyle.overrides.fontStyle = 'Bold';

    const nextStyle = new ParagraphStyle();
    nextStyle.id = 'next-style';
    nextStyle.overrides.fontFamily = 'Next Family';
    nextStyle.overrides.fontStyle = 'Italic';

    const commandStates = reactive({
      style: reactive(createCommandState([initialStyle.id], true)),
      fontFamily: reactive(createCommandState('', true)),
      fontSize: reactive(createCommandState('', true)),
      fontColor: reactive(createCommandState('', true)),
      fontStyle: reactive(createCommandState('', true)),
      fontStyleToggleBold: reactive(createCommandState(false, true)),
      fontStyleToggleItalic: reactive(createCommandState(false, true)),
      underline: reactive(createCommandState(false, true)),
      alignment: reactive(createCommandState(undefined, true)),
    });

    registryMocks.execForActiveOrLastOwner.mockReset();
    registryMocks.useActiveOrLastEditorForOwner.mockReturnValue(ref(editor));
    registryMocks.useEditorCommandStates.mockReturnValue(
      commandStates as unknown as Record<string, unknown>,
    );
    registryMocks.useEditorCommandObservableState.mockReturnValue({
      value: undefined,
      isEnabled: true,
      exists: true,
      properties: {
        enabledStyles: [initialStyle.id, nextStyle.id],
      },
    });

    useRichParagraphStyleCommands(
      {
        element: {},
        pageSetup: new PageSetup(),
        fonts: [],
        paragraphStyles: [initialStyle, nextStyle],
        fallbackParagraphStyle: createParagraphStyleFallback(),
      },
      [],
    );

    expect(boldToggle.setResolvedParagraphStyleFallback).toHaveBeenCalledWith({
      fontFamily: 'Initial Family',
      fontStyle: 'Bold',
    });
    expect(italicToggle.setResolvedParagraphStyleFallback).toHaveBeenCalledWith(
      {
        fontFamily: 'Initial Family',
        fontStyle: 'Bold',
      },
    );
    expect(boldToggle.refresh).toHaveBeenCalledTimes(1);
    expect(italicToggle.refresh).toHaveBeenCalledTimes(1);

    commandStates.style.value = [nextStyle.id];
    await nextTick();

    expect(
      boldToggle.setResolvedParagraphStyleFallback,
    ).toHaveBeenLastCalledWith({
      fontFamily: 'Next Family',
      fontStyle: 'Italic',
    });
    expect(
      italicToggle.setResolvedParagraphStyleFallback,
    ).toHaveBeenLastCalledWith({
      fontFamily: 'Next Family',
      fontStyle: 'Italic',
    });
    expect(boldToggle.refresh).toHaveBeenCalledTimes(2);
    expect(italicToggle.refresh).toHaveBeenCalledTimes(2);
  });

  it('does not treat inherited bold and italic as explicit paragraph-style overrides', () => {
    const boldStyle = new ParagraphStyle();
    boldStyle.id = 'bold-style';
    boldStyle.overrides.fontStyle = 'Bold';

    const { commands, commandStates } = setupCommands(
      [boldStyle],
      ['bold-style'],
      false,
      {
        bold: true,
        italic: false,
      },
    );

    commandStates.fontColor.value = undefined;

    expect(commands.fontStyleHasExplicitValue.value).toBe(false);
    expect(commands.hasParagraphStyleOverrides.value).toBe(false);
  });

  it('falls back to the resolved paragraph-style alignment when no explicit override exists', () => {
    const centeredStyle = new ParagraphStyle();
    centeredStyle.id = 'centered-style';
    centeredStyle.overrides.alignment = 'center' as TextBoxAlignment;

    const { commands } = setupCommands([centeredStyle], ['centered-style']);

    expect(commands.alignmentValue.value).toBe('center');
    expect(commands.alignmentHasExplicitValue.value).toBe(false);
  });

  it('treats an explicit alignment override as explicit even when it matches the style', () => {
    const centeredStyle = new ParagraphStyle();
    centeredStyle.id = 'centered-style';
    centeredStyle.overrides.alignment = 'center' as TextBoxAlignment;

    const { commands } = setupCommands(
      [centeredStyle],
      ['centered-style'],
      false,
      {
        alignment: 'center' as TextBoxAlignment,
      },
    );

    expect(commands.alignmentValue.value).toBe('center');
    expect(commands.alignmentHasExplicitValue.value).toBe(true);
  });

  it('shows a mixed alignment value when mixed paragraph styles do not resolve to one alignment', () => {
    const leftStyle = new ParagraphStyle();
    leftStyle.id = 'left-style';
    leftStyle.overrides.alignment = 'left' as TextBoxAlignment;

    const rightStyle = new ParagraphStyle();
    rightStyle.id = 'right-style';
    rightStyle.overrides.alignment = 'right' as TextBoxAlignment;

    const { commands } = setupCommands(
      [leftStyle, rightStyle],
      ['left-style', 'right-style'],
    );

    expect(commands.alignmentValue.value).toBe(PARAGRAPH_STYLE_MIXED_VALUE);
    expect(commands.alignmentHasExplicitValue.value).toBe(false);
  });

  it('shows a mixed alignment value when selection has explicit overrides but no uniform value', () => {
    const { commands } = setupCommands([], [], false, {
      alignment: ALIGNMENT_OVERRIDE_MIXED_VALUE,
    });

    expect(commands.alignmentValue.value).toBe(ALIGNMENT_OVERRIDE_MIXED_VALUE);
    expect(commands.alignmentHasExplicitValue.value).toBe(true);
  });

  it('clears an explicit alignment override without forcing a paragraph-style value', () => {
    const { commands } = setupCommands([], [], false, {
      alignment: 'left' as TextBoxAlignment,
    });

    commands.clearAlignmentOverride();

    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledTimes(1);
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledWith(
      {},
      'alignment',
    );
  });

  it('keeps bold and italic updates away from underline', () => {
    const { commands } = setupCommands();

    commands.onFontStyleValuesChanged(['bold', 'italic']);

    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenNthCalledWith(
      1,
      {},
      'fontStyleToggleBold',
    );
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenNthCalledWith(
      2,
      {},
      'fontStyleToggleItalic',
    );
    expect(registryMocks.execForActiveOrLastOwner).not.toHaveBeenCalledWith(
      {},
      'underline',
    );
  });

  it('keeps underline updates away from bold and italic', () => {
    const { commands } = setupCommands();

    commands.onTextDecorationValuesChanged('underline');

    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledTimes(1);
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledWith(
      {},
      'underline',
    );
    expect(registryMocks.execForActiveOrLastOwner).not.toHaveBeenCalledWith(
      {},
      'fontStyleToggleBold',
    );
    expect(registryMocks.execForActiveOrLastOwner).not.toHaveBeenCalledWith(
      {},
      'fontStyleToggleItalic',
    );
  });

  it('does not clear underline when applying a non-underlined paragraph style', () => {
    const plainStyle = new ParagraphStyle();
    plainStyle.id = 'plain-style';

    const { commands } = setupCommands([plainStyle], ['plain-style'], true);

    commands.onParagraphStyleChanged('plain-style');

    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenNthCalledWith(
      1,
      {},
      'style',
      { styleName: 'plain-style', forceValue: true },
    );
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledTimes(1);
  });

  it('does not resync alignment when applying a paragraph style', () => {
    const rightAlignedStyle = new ParagraphStyle();
    rightAlignedStyle.id = 'right-aligned-style';
    rightAlignedStyle.overrides.alignment = 'right' as TextBoxAlignment;

    const { commands } = setupCommands([rightAlignedStyle], [], false, {
      alignment: 'left' as TextBoxAlignment,
    });

    commands.onParagraphStyleChanged('right-aligned-style');

    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledTimes(1);
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledWith(
      {},
      'style',
      { styleName: 'right-aligned-style', forceValue: true },
    );
    expect(registryMocks.execForActiveOrLastOwner).not.toHaveBeenCalledWith(
      {},
      'alignment',
      expect.anything(),
    );
  });

  it('clears rich-text paragraph style formatting without changing the active paragraph style', () => {
    const underlinedStyle = new ParagraphStyle();
    underlinedStyle.id = 'underlined-style';
    underlinedStyle.overrides.textDecoration = 'underline';

    const { commands } = setupCommands(
      [underlinedStyle],
      ['underlined-style'],
      false,
      {
        fontFamily: 'Source Serif 4',
        fontStyle: 'Bold',
        fontSize: '18pt',
        fontColor: '#123456',
        bold: true,
        italic: true,
        alignment: 'center' as TextBoxAlignment,
      },
    );

    expect(commands.hasParagraphStyleOverrides.value).toBe(true);

    commands.clearParagraphStyleFormatting();

    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenNthCalledWith(
      1,
      {},
      'fontFamily',
    );
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenNthCalledWith(
      2,
      {},
      'fontStyle',
    );
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenNthCalledWith(
      3,
      {},
      'fontSize',
    );
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenNthCalledWith(
      4,
      {},
      'fontColor',
    );
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenNthCalledWith(
      5,
      {},
      'alignment',
    );
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledTimes(5);
    expect(registryMocks.execForActiveOrLastOwner).not.toHaveBeenCalledWith(
      {},
      'style',
      expect.anything(),
    );
  });
});
