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
import type {
  ParagraphStyle,
  ResolvedParagraphStyle,
} from '@/models/ParagraphStyle';
import { resolveParagraphStyle } from '@/models/ParagraphStyle';
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

// Bold/Italic and underline share the same toggle-group UI shape, but they are
// handled by different commands so changing one lane cannot mutate the other.
const FONT_STYLE_TOGGLE_COMMANDS: Record<string, string> = {
  bold: 'fontStyleToggleBold',
  italic: 'fontStyleToggleItalic',
};

const TEXT_DECORATION_TOGGLE_COMMANDS: Record<string, string> = {
  underline: 'underline',
};

export const PARAGRAPH_STYLE_NONE_VALUE = '__none__';
export const PARAGRAPH_STYLE_MIXED_VALUE = '__mixed__';

export function resolveRichTextParagraphStyleState(
  paragraphStyles: ParagraphStyle[],
  activeParagraphStyleIds: string[],
  fallbackParagraphStyle: ResolvedParagraphStyle,
) {
  const paragraphStyleValue =
    activeParagraphStyleIds.length === 0
      ? PARAGRAPH_STYLE_NONE_VALUE
      : activeParagraphStyleIds.length === 1
        ? activeParagraphStyleIds[0]
        : PARAGRAPH_STYLE_MIXED_VALUE;

  const activeParagraphStyle =
    paragraphStyleValue === PARAGRAPH_STYLE_NONE_VALUE ||
    paragraphStyleValue === PARAGRAPH_STYLE_MIXED_VALUE
      ? null
      : resolveParagraphStyle(paragraphStyles, paragraphStyleValue);

  return {
    paragraphStyleValue,
    activeParagraphStyle,
    resolvedActiveParagraphStyle:
      activeParagraphStyle ?? fallbackParagraphStyle,
  };
}

export function shouldSyncParagraphStyleAlignment(
  currentAlignment: unknown,
  nextAlignment: string,
) {
  return currentAlignment !== nextAlignment;
}

export function useRichParagraphStyleCommands(
  props: {
    element: object;
    pageSetup: PageSetup;
    fonts: string[];
    paragraphStyles?: ParagraphStyle[];
    fallbackParagraphStyle: ResolvedParagraphStyle;
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
  const paragraphStyleOptions = computed(() => {
    return props.paragraphStyles ?? [];
  });
  const neanesParagraphStyleIds = computed(
    () => new Set(paragraphStyleOptions.value.map((style) => style.id)),
  );

  const activeParagraphStyleIds = computed(() =>
    toStyleNameArray(commandValue('style')).filter((styleId) =>
      neanesParagraphStyleIds.value.has(styleId),
    ),
  );
  const enabledParagraphStyleIds = computed(
    () => new Set(toStyleNameArray(styleCommandState.properties.enabledStyles)),
  );

  const paragraphStyleState = computed(() =>
    resolveRichTextParagraphStyleState(
      props.paragraphStyles ?? [],
      activeParagraphStyleIds.value,
      props.fallbackParagraphStyle,
    ),
  );
  const paragraphStyleValue = computed(
    () => paragraphStyleState.value.paragraphStyleValue,
  );
  const activeParagraphStyle = computed(
    () => paragraphStyleState.value.activeParagraphStyle,
  );
  const resolvedActiveParagraphStyle = computed(
    () => paragraphStyleState.value.resolvedActiveParagraphStyle,
  );

  const fontFamilyValue = computed(() =>
    fromRichTextFontFamilyModelValue(commandValue('fontFamily')),
  );

  const defaultLabel = computed(() =>
    t(($) => $.toolbar.richTextBox.default, { ns: 'toolbar' }),
  );

  const fontFamilyOptions = computed<FontComboboxOption[]>(() => {
    const resolvedDefault = resolvedActiveParagraphStyle.value.fontFamily;
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
      : resolvedActiveParagraphStyle.value.fontStyle;
  });

  const fontStyleFamilyValue = computed(() => {
    if (fontFamilyValue.value !== RICH_TEXT_DEFAULT_FONT_FAMILY) {
      return fontFamilyValue.value;
    }

    return normalizeFontFamily(resolvedActiveParagraphStyle.value.fontFamily);
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
      `${defaultLabel.value} (${defaultSizeFormat.format(Unit.toPt(resolvedActiveParagraphStyle.value.fontSize))})`,
  );

  const fontColorValue = computed(() => {
    const value = commandValue('fontColor');
    return typeof value === 'string'
      ? value
      : resolvedActiveParagraphStyle.value.color;
  });

  const fontColorHasExplicitValue = computed(
    () => typeof commandValue('fontColor') === 'string',
  );

  const fontStyleHasExplicitValue = computed(
    () =>
      typeof commandValue('fontStyle') === 'string' &&
      commandValue('fontStyle') !== '',
  );

  const alignmentHasExplicitValue = computed(() => {
    const value = commandValue('alignment');

    return (
      typeof value === 'string' &&
      value !== resolvedActiveParagraphStyle.value.alignment
    );
  });

  const underlineActive = computed(() => commandValue('underline') === true);
  const resolvedUnderline = computed(
    () => resolvedActiveParagraphStyle.value.textDecoration === 'underline',
  );

  const fontStyleValues = computed(() =>
    Object.keys(FONT_STYLE_TOGGLE_COMMANDS).filter((style) =>
      isCommandActive(FONT_STYLE_TOGGLE_COMMANDS[style]),
    ),
  );

  const textDecorationValues = computed(() =>
    Object.keys(TEXT_DECORATION_TOGGLE_COMMANDS).filter((style) =>
      isCommandActive(TEXT_DECORATION_TOGGLE_COMMANDS[style]),
    ),
  );

  const alignmentValue = computed(() => {
    const value = commandValue('alignment');
    return typeof value === 'string' && isAlignmentValue(value)
      ? value
      : 'left';
  });

  const textDecorationHasExplicitValue = computed(
    () => underlineActive.value !== resolvedUnderline.value,
  );

  const hasParagraphStyleOverrides = computed(
    () =>
      fontFamilyValue.value !== RICH_TEXT_DEFAULT_FONT_FAMILY ||
      fontStyleHasExplicitValue.value ||
      fontSizeValue.value != null ||
      fontColorHasExplicitValue.value ||
      fontStyleValues.value.length > 0 ||
      textDecorationHasExplicitValue.value ||
      alignmentHasExplicitValue.value,
  );

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
    return isCommandEnabled(
      FONT_STYLE_TOGGLE_COMMANDS[style] ??
        TEXT_DECORATION_TOGGLE_COMMANDS[style] ??
        style,
    );
  }

  function isParagraphStyleEnabled(styleId: string) {
    return (
      isCommandEnabled('style') &&
      neanesParagraphStyleIds.value.has(styleId) &&
      enabledParagraphStyleIds.value.has(styleId)
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
        resolvedActiveParagraphStyle.value.fontFamily,
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

  function clearFontStyleOverride() {
    runCommand('fontStyle');
  }

  function clearAlignmentOverride() {
    runCommand('alignment', {
      value: resolvedActiveParagraphStyle.value.alignment,
    });
  }

  function setUnderlineActive(value: boolean) {
    if (underlineActive.value !== value) {
      runCommand('underline');
    }
  }

  function onStyleValuesChanged(value: unknown) {
    onFontStyleValuesChanged(value);
  }

  function onFontStyleValuesChanged(value: unknown) {
    const next = toToggleGroupValues(value);
    const previous = fontStyleValues.value;

    for (const style of Object.keys(FONT_STYLE_TOGGLE_COMMANDS)) {
      if (next.includes(style) !== previous.includes(style)) {
        runCommand(FONT_STYLE_TOGGLE_COMMANDS[style]);
      }
    }
  }

  function onTextDecorationValuesChanged(value: unknown) {
    const next = toToggleGroupValues(value);
    const previous = textDecorationValues.value;

    for (const style of Object.keys(TEXT_DECORATION_TOGGLE_COMMANDS)) {
      if (next.includes(style) !== previous.includes(style)) {
        runCommand(TEXT_DECORATION_TOGGLE_COMMANDS[style]);
      }
    }
  }

  function onAlignmentChanged(value: unknown) {
    if (typeof value === 'string' && isAlignmentValue(value)) {
      runCommand('alignment', { value });
    }
  }

  function onParagraphStyleChanged(value: string) {
    if (!isCommandEnabled('style')) {
      return;
    }

    if (value === PARAGRAPH_STYLE_NONE_VALUE) {
      for (const styleId of activeParagraphStyleIds.value) {
        runCommand('style', { styleName: styleId, forceValue: false });
      }

      return;
    }

    if (!neanesParagraphStyleIds.value.has(value)) {
      return;
    }

    for (const styleId of activeParagraphStyleIds.value) {
      if (styleId !== value) {
        runCommand('style', { styleName: styleId, forceValue: false });
      }
    }

    runCommand('style', { styleName: value, forceValue: true });

    const resolved = resolveParagraphStyle(props.paragraphStyles ?? [], value);

    if (resolved.textDecoration === 'underline') {
      setUnderlineActive(true);
    }

    if (
      shouldSyncParagraphStyleAlignment(
        commandValue('alignment'),
        resolved.alignment,
      )
    ) {
      runCommand('alignment', { value: resolved.alignment });
    }
  }

  function onClearFormatting() {
    if (!isCommandEnabled('removeFormat')) {
      return;
    }

    if (isCommandEnabled('fontStyle')) {
      execForActiveOrLastOwner(props.element, 'fontStyle');
    }

    execForActiveOrLastOwner(props.element, 'removeFormat');
  }

  function clearTextDecorationOverride() {
    setUnderlineActive(resolvedUnderline.value);
  }

  function clearParagraphStyleFormatting() {
    runCommand('fontFamily');
    clearFontStyleOverride();
    onFontSizeChanged(null);
    onFontColorChanged(null);
    clearTextDecorationOverride();
    clearAlignmentOverride();
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
    paragraphStyleValue,
    activeParagraphStyle,
    resolvedActiveParagraphStyle,
    paragraphStyleOptions: paragraphStyleOptions,
    fontStyleValue,
    fontStyleOptions,
    fontStyleDisabled,
    fontSizeValue,
    fontSizePlaceholder,
    fontColorValue,
    fontColorHasExplicitValue,
    fontStyleHasExplicitValue,
    alignmentHasExplicitValue,
    underlineActive,
    resolvedUnderline,
    hasParagraphStyleOverrides,
    textDecorationHasExplicitValue,
    fontStyleValues,
    textDecorationValues,
    styleValues: fontStyleValues,
    alignmentValue,
    isCommandEnabled,
    isCommandActive,
    isStyleToggleEnabled,
    isParagraphStyleEnabled,
    commandValue,
    runCommand,
    onParagraphStyleChanged,
    onFontFamilyChanged,
    onFontStyleChanged,
    onFontSizeChanged,
    onFontColorChanged,
    clearFontStyleOverride,
    clearAlignmentOverride,
    onStyleValuesChanged,
    onFontStyleValuesChanged,
    onTextDecorationValuesChanged,
    onAlignmentChanged,
    clearTextDecorationOverride,
    clearParagraphStyleFormatting,
    onClearFormatting,
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

function toToggleGroupValues(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(isNonEmptyString);
  }

  return isNonEmptyString(value) ? [value] : [];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}
