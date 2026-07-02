import { describe, expect, it, vi } from 'vitest';

import { PageSetup } from '@/models/PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultParagraphStyles,
  createParagraphStyleFallback,
  ParagraphStyle,
} from '@/models/ParagraphStyle';

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
  shouldSyncParagraphStyleAlignment,
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

  it('does not resync alignment when the style alignment already matches the selection', () => {
    expect(shouldSyncParagraphStyleAlignment('center', 'center')).toBe(false);
    expect(shouldSyncParagraphStyleAlignment('left', 'left')).toBe(false);
    expect(shouldSyncParagraphStyleAlignment(undefined, 'center')).toBe(true);
    expect(shouldSyncParagraphStyleAlignment('left', 'center')).toBe(true);
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
      alignment: createCommandState(commandOverrides.alignment ?? 'left', true),
    } as const;

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

  it('materializes inline underline when applying an underlined paragraph style', () => {
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
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenNthCalledWith(
      2,
      {},
      'underline',
    );
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledTimes(2);
  });

  it('keeps clear disabled when the active underlined paragraph style is already reflected inline', () => {
    const underlinedStyle = new ParagraphStyle();
    underlinedStyle.id = 'underlined-style';
    underlinedStyle.overrides.textDecoration = 'underline';

    const { commands } = setupCommands(
      [underlinedStyle],
      ['underlined-style'],
      true,
    );

    expect(commands.textDecorationHasExplicitValue.value).toBe(false);

    commands.clearTextDecorationOverride();

    expect(registryMocks.execForActiveOrLastOwner).not.toHaveBeenCalled();
  });

  it('restores underline when the active underlined paragraph style has been cleared inline', () => {
    const underlinedStyle = new ParagraphStyle();
    underlinedStyle.id = 'underlined-style';
    underlinedStyle.overrides.textDecoration = 'underline';

    const { commands } = setupCommands(
      [underlinedStyle],
      ['underlined-style'],
      false,
    );

    expect(commands.textDecorationHasExplicitValue.value).toBe(true);

    commands.clearTextDecorationOverride();

    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledTimes(1);
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledWith(
      {},
      'underline',
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

  it('removes underline when the active non-underlined paragraph style has inline underline', () => {
    const plainStyle = new ParagraphStyle();
    plainStyle.id = 'plain-style';

    const { commands } = setupCommands([plainStyle], ['plain-style'], true);

    expect(commands.textDecorationHasExplicitValue.value).toBe(true);

    commands.clearTextDecorationOverride();

    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledTimes(1);
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledWith(
      {},
      'underline',
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
        alignment: 'center',
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
      'underline',
    );
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenNthCalledWith(
      6,
      {},
      'alignment',
      { value: 'left' },
    );
    expect(registryMocks.execForActiveOrLastOwner).toHaveBeenCalledTimes(6);
    expect(registryMocks.execForActiveOrLastOwner).not.toHaveBeenCalledWith(
      {},
      'style',
      expect.anything(),
    );
  });
});
