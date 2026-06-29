import { useTranslation } from 'i18next-vue';
import { computed } from 'vue';

import type { FontComboboxOption } from '@/components/FontCombobox.vue';
import {
  execForActiveOrLastOwner,
  useActiveOrLastEditorForOwner,
  useEditorCommandObservableState,
  useEditorCommandStates,
} from '@/composables/useRichTextEditorRegistry';
import type { PageSetup } from '@/models/PageSetup';
import type { ResolvedTextStyle, TextStyle } from '@/models/TextStyle';
import { resolveTextStyle } from '@/models/TextStyle';
import { fontCatalog } from '@/services/FontCatalog';
import {
  DEFAULT_FONT_STYLE,
  RICH_TEXT_DEFAULT_FONT_FAMILY,
} from '@/utils/fontConstants';
import {
  fromRichTextFontFamilyModelValue,
  normalizeFontFamily,
  toRichTextFontFamilyModelValue,
} from '@/utils/fontFamily';
import {
  remapFontStyleAxesForOptions,
  remapFontStyleForOptions,
} from '@/utils/fontStyle';
import { fontStyleNeedsExplicitFamily } from '@/utils/fontStyleAxes';
import { Unit } from '@/utils/Unit';

// Placeholder/label numbers track the field's pt display but drop trailing
// zeros so the default reads "Default (20)" rather than "Default (20.0)".
const defaultSizeFormat = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
  useGrouping: false,
});

// 'fontStyle' carries the chosen style; the toggle commands drive the Bold and
// Italic shortcut buttons (which now flip an axis of the font style). Underline
// stays a standalone command.
const STYLE_COMMAND_NAMES = [
  'style',
  'fontFamily',
  'fontSize',
  'fontColor',
  'fontStyle',
  'fontStyleToggleBold',
  'fontStyleToggleItalic',
  'underline',
  'alignment',
];

// Maps a Bold/Italic/Underline toggle value to the command that backs it.
const STYLE_TOGGLE_COMMANDS: Record<string, string> = {
  bold: 'fontStyleToggleBold',
  italic: 'fontStyleToggleItalic',
  underline: 'underline',
};

export const TEXT_STYLE_NONE_VALUE = '__none__';
export const TEXT_STYLE_MIXED_VALUE = '__mixed__';

export function resolveRichTextTextStyleState(
  textStyles: TextStyle[],
  activeTextStyleIds: string[],
  fallbackTextStyle: ResolvedTextStyle,
) {
  const textStyleValue =
    activeTextStyleIds.length === 0
      ? TEXT_STYLE_NONE_VALUE
      : activeTextStyleIds.length === 1
        ? activeTextStyleIds[0]
        : TEXT_STYLE_MIXED_VALUE;

  const activeTextStyle =
    textStyleValue === TEXT_STYLE_NONE_VALUE ||
    textStyleValue === TEXT_STYLE_MIXED_VALUE
      ? null
      : resolveTextStyle(textStyles, textStyleValue);

  return {
    textStyleValue,
    activeTextStyle,
    resolvedActiveTextStyle: activeTextStyle ?? fallbackTextStyle,
  };
}

export function shouldSyncTextStyleAlignment(
  currentAlignment: unknown,
  nextAlignment: string,
) {
  return currentAlignment !== nextAlignment;
}

export function useRichTextStyleCommands(
  props: {
    element: object;
    pageSetup: PageSetup;
    fonts: string[];
    textStyles?: TextStyle[];
    fallbackTextStyle: ResolvedTextStyle;
  },
  extraCommandNames: string[] = [],
) {
  const { t } = useTranslation();
  const scopedEditor = useActiveOrLastEditorForOwner(() => props.element);

  const commandStates = useEditorCommandStates(scopedEditor, [
    ...STYLE_COMMAND_NAMES,
    ...extraCommandNames,
  ]);
  const styleCommandState = useEditorCommandObservableState(
    scopedEditor,
    'style',
    ['enabledStyles'],
  );
  const textStyleOptions = computed(() => {
    return props.textStyles ?? [];
  });
  const neanesTextStyleIds = computed(
    () => new Set(textStyleOptions.value.map((style) => style.id)),
  );

  const activeTextStyleIds = computed(() =>
    toStyleNameArray(commandValue('style')).filter((styleId) =>
      neanesTextStyleIds.value.has(styleId),
    ),
  );
  const enabledTextStyleIds = computed(
    () => new Set(toStyleNameArray(styleCommandState.properties.enabledStyles)),
  );

  const textStyleState = computed(() =>
    resolveRichTextTextStyleState(
      props.textStyles ?? [],
      activeTextStyleIds.value,
      props.fallbackTextStyle,
    ),
  );
  const textStyleValue = computed(() => textStyleState.value.textStyleValue);
  const activeTextStyle = computed(() => textStyleState.value.activeTextStyle);
  const resolvedActiveTextStyle = computed(
    () => textStyleState.value.resolvedActiveTextStyle,
  );

  const fontFamilyValue = computed(() =>
    fromRichTextFontFamilyModelValue(commandValue('fontFamily')),
  );

  const defaultLabel = computed(() =>
    t(($) => $.toolbar.richTextBox.default, { ns: 'toolbar' }),
  );

  const fontFamilyOptions = computed<FontComboboxOption[]>(() => {
    const resolvedDefault = resolvedActiveTextStyle.value.fontFamily;
    const normalizedDefault = resolvedDefault.trim();

    return [
      {
        label: normalizedDefault
          ? `${defaultLabel.value} (${normalizedDefault})`
          : defaultLabel.value,
        value: RICH_TEXT_DEFAULT_FONT_FAMILY,
      },
      ...fontCatalog.bundledFamilies(),
      ...props.fonts,
    ];
  });

  const fontStyleValue = computed(() => {
    const value = commandValue('fontStyle');

    return typeof value === 'string' && value !== ''
      ? value
      : resolvedActiveTextStyle.value.fontStyle;
  });

  const fontStyleFamilyValue = computed(() => {
    if (fontFamilyValue.value !== RICH_TEXT_DEFAULT_FONT_FAMILY) {
      return fontFamilyValue.value;
    }

    return normalizeFontFamily(resolvedActiveTextStyle.value.fontFamily);
  });

  const fontStyleOptions = computed(() =>
    fontStyleFamilyValue.value === ''
      ? []
      : fontCatalog.getStyles(fontStyleFamilyValue.value),
  );

  const fontStyleDisabled = computed(
    () => !isCommandEnabled('fontStyle') || fontStyleOptions.value.length <= 1,
  );

  // null when no explicit size is set, so the field can render its "Default"
  // placeholder instead of silently showing the resolved default as a value.
  const fontSizeValue = computed(() =>
    fromRichTextFontSizeModelValue(commandValue('fontSize')),
  );

  const fontSizePlaceholder = computed(
    () =>
      `${defaultLabel.value} (${defaultSizeFormat.format(Unit.toPt(resolvedActiveTextStyle.value.fontSize))})`,
  );

  const fontColorValue = computed(() => {
    const value = commandValue('fontColor');
    return typeof value === 'string'
      ? value
      : resolvedActiveTextStyle.value.color;
  });

  const fontColorHasExplicitValue = computed(
    () => typeof commandValue('fontColor') === 'string',
  );

  const styleValues = computed(() =>
    Object.keys(STYLE_TOGGLE_COMMANDS).filter((style) =>
      isCommandActive(STYLE_TOGGLE_COMMANDS[style]),
    ),
  );

  const alignmentValue = computed(() => {
    const value = commandValue('alignment');
    return typeof value === 'string' && isAlignmentValue(value)
      ? value
      : 'left';
  });

  function isCommandEnabled(commandName: string) {
    return scopedEditor.value != null && commandStates[commandName]?.isEnabled;
  }

  function isCommandActive(commandName: string) {
    return commandStates[commandName]?.value === true;
  }

  function commandValue(commandName: string) {
    return commandStates[commandName]?.value;
  }

  function runCommand(commandName: string, ...args: unknown[]) {
    if (!isCommandEnabled(commandName)) {
      return;
    }

    execForActiveOrLastOwner(props.element, commandName, ...args);
  }

  function isStyleToggleEnabled(style: string) {
    return isCommandEnabled(STYLE_TOGGLE_COMMANDS[style] ?? style);
  }

  function isTextStyleEnabled(styleId: string) {
    return (
      isCommandEnabled('style') &&
      neanesTextStyleIds.value.has(styleId) &&
      enabledTextStyleIds.value.has(styleId)
    );
  }

  function onFontFamilyChanged(value: string) {
    if (!isCommandEnabled('fontFamily')) {
      return;
    }

    const family = normalizeFontFamily(value);

    if (family === RICH_TEXT_DEFAULT_FONT_FAMILY) {
      // Clearing the family returns to inherited text. Only basic axes remain
      // valid without an explicit family; non-basic styles fall back to the
      // nearest basic style the inherited family offers.
      const inheritedFamily = normalizeFontFamily(
        resolvedActiveTextStyle.value.fontFamily,
      );
      const inheritedStyle = remapFontStyleAxesForOptions(
        fontStyleValue.value,
        inheritedFamily === '' ? [] : fontCatalog.getStyles(inheritedFamily),
      );

      runCommand('fontFamily');

      if (inheritedStyle === DEFAULT_FONT_STYLE) {
        runCommand('fontStyle');
      } else {
        runCommand('fontStyle', { value: inheritedStyle });
      }
      return;
    }

    const modelValue = toRichTextFontFamilyModelValue(
      family,
      props.pageSetup.neumeDefaultFontFamily,
    );

    // Carry the current font style to the new family where it exists, preserving
    // the bold/italic axes when an exact match is unavailable.
    const remapped = remapFontStyleForOptions(
      fontStyleValue.value,
      fontCatalog.getStyles(family),
    );

    runCommand('fontFamily', { value: modelValue });
    runCommand('fontStyle', { value: remapped });
  }

  function onFontStyleChanged(value: string) {
    if (
      fontFamilyValue.value === RICH_TEXT_DEFAULT_FONT_FAMILY &&
      fontStyleNeedsExplicitFamily(value)
    ) {
      runCommand('fontFamily', {
        value: toRichTextFontFamilyModelValue(
          fontStyleFamilyValue.value,
          props.pageSetup.neumeDefaultFontFamily,
        ),
      });
    }

    runCommand('fontStyle', { value });
  }

  function onFontSizeChanged(value: number | null) {
    if (!isCommandEnabled('fontSize')) {
      return;
    }

    // Clearing the field removes the attribute, falling back to the text box's
    // default size -- the same "Default" state the placeholder represents.
    if (value == null) {
      runCommand('fontSize');
      return;
    }

    runCommand('fontSize', {
      value: `${Math.round(Unit.toPt(value) * 2) / 2}pt`,
    });
  }

  function onFontColorChanged(value: string | null) {
    if (!isCommandEnabled('fontColor')) {
      return;
    }

    if (value == null) {
      runCommand('fontColor');
      return;
    }

    runCommand('fontColor', { value });
  }

  function onStyleValuesChanged(value: unknown) {
    const next = Array.isArray(value) ? value : [];
    const previous = styleValues.value;

    for (const style of Object.keys(STYLE_TOGGLE_COMMANDS)) {
      if (next.includes(style) !== previous.includes(style)) {
        runCommand(STYLE_TOGGLE_COMMANDS[style]);
      }
    }
  }

  function onAlignmentChanged(value: unknown) {
    if (typeof value === 'string' && isAlignmentValue(value)) {
      runCommand('alignment', { value });
    }
  }

  function onTextStyleChanged(value: string) {
    if (!isCommandEnabled('style')) {
      return;
    }

    if (value === TEXT_STYLE_NONE_VALUE) {
      for (const styleId of activeTextStyleIds.value) {
        runCommand('style', { styleName: styleId, forceValue: false });
      }

      return;
    }

    if (!neanesTextStyleIds.value.has(value)) {
      return;
    }

    for (const styleId of activeTextStyleIds.value) {
      if (styleId !== value) {
        runCommand('style', { styleName: styleId, forceValue: false });
      }
    }

    runCommand('style', { styleName: value, forceValue: true });

    const resolved = resolveTextStyle(props.textStyles ?? [], value);

    if (
      shouldSyncTextStyleAlignment(
        commandValue('alignment'),
        resolved.alignment,
      )
    ) {
      runCommand('alignment', { value: resolved.alignment });
    }
  }

  function onRemoveFormat() {
    if (!isCommandEnabled('removeFormat')) {
      return;
    }

    if (isCommandEnabled('fontStyle')) {
      execForActiveOrLastOwner(props.element, 'fontStyle');
    }

    execForActiveOrLastOwner(props.element, 'removeFormat');
  }

  function executeChangedToggleCommands(
    commandNames: string[],
    previousValues: string[],
    nextValue: unknown,
  ) {
    const nextValues = Array.isArray(nextValue) ? nextValue : [];

    for (const commandName of commandNames) {
      if (
        nextValues.includes(commandName) !==
        previousValues.includes(commandName)
      ) {
        runCommand(commandName);
      }
    }
  }

  return {
    commandStates,
    styleCommandState,
    fontFamilyValue,
    fontFamilyOptions,
    textStyleValue,
    activeTextStyle,
    resolvedActiveTextStyle,
    textStyleOptions,
    fontStyleValue,
    fontStyleOptions,
    fontStyleDisabled,
    fontSizeValue,
    fontSizePlaceholder,
    fontColorValue,
    fontColorHasExplicitValue,
    styleValues,
    alignmentValue,
    isCommandEnabled,
    isCommandActive,
    isStyleToggleEnabled,
    isTextStyleEnabled,
    commandValue,
    runCommand,
    onTextStyleChanged,
    onFontFamilyChanged,
    onFontStyleChanged,
    onFontSizeChanged,
    onFontColorChanged,
    onStyleValuesChanged,
    onAlignmentChanged,
    onRemoveFormat,
    executeChangedToggleCommands,
  };
}

function fromRichTextFontSizeModelValue(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.trim().match(/^([\d.]+)(pt|px)$/);

  if (match == null) {
    return null;
  }

  const size = Number(match[1]);

  if (!Number.isFinite(size)) {
    return null;
  }

  return match[2] === 'pt' ? Unit.fromPt(size) : size;
}

function isAlignmentValue(
  value: string,
): value is 'left' | 'center' | 'right' | 'justify' {
  return ['left', 'center', 'right', 'justify'].includes(value);
}

function toStyleNameArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (isNonEmptyString(item)) {
        return [item];
      }

      const name = Reflect.get(item as object, 'name');

      return isNonEmptyString(name) ? [name] : [];
    });
  }

  return isNonEmptyString(value) ? [value] : [];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}
