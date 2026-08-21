import { type Editor, GeneralHtmlSupport } from 'ckeditor5';
import { useTranslation } from 'i18next-vue';
import { computed, watch } from 'vue';

import type { FontStyleToggleCommand } from '@/ckeditor-plugins/fontstyle/fontstylecommand';
import type { FontComboboxOption } from '@/components/FontCombobox.vue';
import {
  execForOwner,
  useActiveEditorForOwner,
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
  ALIGNMENT_OVERRIDE_MIXED_VALUE,
  isAlignmentOverrideValue,
} from '@/utils/alignmentOverride';
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
import {
  composeExplicitFontVariant,
  FONT_VARIANT_PROPERTIES,
  type FontVariantProperty,
} from '@/utils/fontVariants';
import { richTextParagraphStyleIdFromClassName } from '@/utils/richTextParagraphStyleClasses';
import { Unit } from '@/utils/Unit';

// Placeholder/label numbers track the field's pt display but drop trailing
// zeros so the default reads "Default (20)" rather than "Default (20.0)".
const defaultSizeFormat = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
  useGrouping: false,
});

// 'style' carries the active paragraph styles; 'fontStyle' carries the chosen
// font style; the toggle commands drive the Bold and Italic shortcut buttons
// (which flip an axis of the font style). Underline stays a standalone
// command.
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
  ...FONT_VARIANT_PROPERTIES,
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

  return {
    paragraphStyleValue,
    resolvedActiveParagraphStyle:
      paragraphStyleValue === PARAGRAPH_STYLE_NONE_VALUE ||
      paragraphStyleValue === PARAGRAPH_STYLE_MIXED_VALUE
        ? fallbackParagraphStyle
        : resolveParagraphStyle(paragraphStyles, paragraphStyleValue),
  };
}

export function useRichTextStyleCommands(
  props: {
    element: object;
    pageSetup: PageSetup;
    fonts: string[];
    paragraphStyles: ParagraphStyle[];
    fallbackParagraphStyle: ResolvedParagraphStyle;
  },
  extraCommandNames: string[] = [],
) {
  const { t } = useTranslation();
  const scopedEditor = useActiveEditorForOwner(() => props.element);

  const commandStates = useEditorCommandStates(
    scopedEditor,
    [...STYLE_COMMAND_NAMES, ...extraCommandNames],
    { style: ['enabledStyles'] },
  );
  const neanesParagraphStyleIds = computed(
    () => new Set(props.paragraphStyles.map((style) => style.id)),
  );

  const activeParagraphStyleIds = computed(() =>
    toToggleGroupValues(commandValue('style')).filter((styleId) =>
      neanesParagraphStyleIds.value.has(styleId),
    ),
  );
  const enabledParagraphStyleIds = computed(
    () =>
      new Set(
        toToggleGroupValues(commandStates.style.properties.enabledStyles),
      ),
  );
  const disabledParagraphStyleIds = computed(() =>
    props.paragraphStyles
      .filter((style) => !isParagraphStyleEnabled(style.id))
      .map((style) => style.id),
  );

  const paragraphStyleState = computed(() =>
    resolveRichTextParagraphStyleState(
      props.paragraphStyles,
      activeParagraphStyleIds.value,
      props.fallbackParagraphStyle,
    ),
  );
  const paragraphStyleValue = computed(
    () => paragraphStyleState.value.paragraphStyleValue,
  );
  const resolvedActiveParagraphStyle = computed(
    () => paragraphStyleState.value.resolvedActiveParagraphStyle,
  );

  watch(
    [
      scopedEditor,
      () => resolvedActiveParagraphStyle.value.fontFamily,
      () => resolvedActiveParagraphStyle.value.fontStyle,
    ],
    ([editor, fontFamily, fontStyle]) => {
      const fallback = { fontFamily, fontStyle };

      for (const commandName of Object.values(FONT_STYLE_TOGGLE_COMMANDS)) {
        const command = editor?.commands.get(commandName) as
          FontStyleToggleCommand | undefined;

        command?.setResolvedParagraphStyleFallback(fallback);
        command?.refresh();
      }
    },
    { immediate: true },
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

    return isNonEmptyString(value)
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

  const fontStyleHasExplicitValue = computed(() =>
    isNonEmptyString(commandValue('fontStyle')),
  );

  const alignmentHasExplicitValue = computed(() => {
    return commandValue('alignment') !== undefined;
  });

  // The effective value each font-variant control reflects: the selection's
  // explicit attribute when present (including an explicit 'normal'),
  // otherwise the active paragraph style's value. The property name doubles
  // as the command name and the ResolvedParagraphStyle key.
  function fontVariantEffectiveValue(commandName: FontVariantProperty) {
    const value = commandValue(commandName);

    return typeof value === 'string'
      ? value
      : resolvedActiveParagraphStyle.value[commandName];
  }

  function fontVariantHasExplicitValue(commandName: FontVariantProperty) {
    return typeof commandValue(commandName) === 'string';
  }

  // Write a composed font-variant value. An empty composition compacts back
  // to inheritance by removing the attribute unless an explicit 'normal' is
  // needed to defeat the paragraph style's value.
  function applyFontVariant(commandName: FontVariantProperty, value: string) {
    const explicit = composeExplicitFontVariant(
      value,
      resolvedActiveParagraphStyle.value[commandName],
    );

    if (explicit == null) {
      runCommand(commandName);
    } else {
      runCommand(commandName, { value: explicit });
    }
  }

  function clearFontVariant(commandName: FontVariantProperty) {
    runCommand(commandName);
  }

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
    if (
      isAlignmentOverrideValue(value) ||
      value === ALIGNMENT_OVERRIDE_MIXED_VALUE
    ) {
      return value;
    }

    return paragraphStyleValue.value === PARAGRAPH_STYLE_MIXED_VALUE
      ? resolveMixedParagraphStyleAlignmentValue()
      : resolvedActiveParagraphStyle.value.alignment;
  });

  function resolveMixedParagraphStyleAlignmentValue() {
    const alignments = new Set(
      activeParagraphStyleIds.value.map(
        (styleId) =>
          resolveParagraphStyle(props.paragraphStyles, styleId).alignment,
      ),
    );

    return alignments.size === 1
      ? [...alignments][0]
      : ALIGNMENT_OVERRIDE_MIXED_VALUE;
  }

  const hasParagraphStyleOverrides = computed(
    () =>
      fontFamilyValue.value !== RICH_TEXT_DEFAULT_FONT_FAMILY ||
      fontStyleHasExplicitValue.value ||
      fontSizeValue.value != null ||
      fontColorHasExplicitValue.value ||
      alignmentHasExplicitValue.value ||
      FONT_VARIANT_PROPERTIES.some(fontVariantHasExplicitValue),
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

    execForOwner(props.element, commandName, ...args);
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
    runCommand('alignment');
  }

  function applyToggleGroupChange(
    commands: Record<string, string>,
    previous: string[],
    value: unknown,
  ) {
    const next = toToggleGroupValues(value);

    for (const style of Object.keys(commands)) {
      if (next.includes(style) !== previous.includes(style)) {
        runCommand(commands[style]);
      }
    }
  }

  function onFontStyleValuesChanged(value: unknown) {
    applyToggleGroupChange(
      FONT_STYLE_TOGGLE_COMMANDS,
      fontStyleValues.value,
      value,
    );
  }

  function onTextDecorationValuesChanged(value: unknown) {
    applyToggleGroupChange(
      TEXT_DECORATION_TOGGLE_COMMANDS,
      textDecorationValues.value,
      value,
    );
  }

  function onAlignmentChanged(value: unknown) {
    if (isAlignmentOverrideValue(value)) {
      runCommand('alignment', { value });
    }
  }

  // The style command's value only reflects the first selected block, so
  // basing removals on it would leave stale style classes on the remaining
  // blocks of a multi-paragraph selection. Collect the union of paragraph
  // styles across all selected blocks from the model instead.
  function collectSelectedParagraphStyleIds(editor: Editor) {
    const ghsAttributeName = editor.plugins
      .get(GeneralHtmlSupport)
      .getGhsAttributeNameForElement('p');
    const styleIds = new Set<string>();

    for (const block of editor.model.document.selection.getSelectedBlocks()) {
      const ghsAttributeValue = block.getAttribute(ghsAttributeName) as
        { classes?: unknown } | undefined;

      if (!Array.isArray(ghsAttributeValue?.classes)) {
        continue;
      }

      for (const className of ghsAttributeValue.classes) {
        const styleId =
          typeof className === 'string'
            ? richTextParagraphStyleIdFromClassName(className)
            : null;

        if (styleId != null && neanesParagraphStyleIds.value.has(styleId)) {
          styleIds.add(styleId);
        }
      }
    }

    return styleIds;
  }

  function onParagraphStyleChanged(value: string) {
    const editor = scopedEditor.value;

    if (editor == null || !isCommandEnabled('style')) {
      return;
    }

    const targetStyleId = value === PARAGRAPH_STYLE_NONE_VALUE ? null : value;

    if (
      targetStyleId != null &&
      !neanesParagraphStyleIds.value.has(targetStyleId)
    ) {
      return;
    }

    // One outer change block so a style switch is a single undo step.
    editor.model.change(() => {
      for (const styleId of collectSelectedParagraphStyleIds(editor)) {
        if (styleId !== targetStyleId) {
          runCommand('style', { styleName: styleId, forceValue: false });
        }
      }

      if (targetStyleId != null) {
        runCommand('style', { styleName: targetStyleId, forceValue: true });
      }
    });
  }

  function onClearFormatting() {
    if (!isCommandEnabled('removeFormat')) {
      return;
    }

    if (isCommandEnabled('fontStyle')) {
      execForOwner(props.element, 'fontStyle');
    }

    execForOwner(props.element, 'removeFormat');
  }

  function clearParagraphStyleFormatting() {
    runCommand('fontFamily');
    clearFontStyleOverride();
    onFontSizeChanged(null);
    onFontColorChanged(null);
    clearAlignmentOverride();

    for (const commandName of FONT_VARIANT_PROPERTIES) {
      clearFontVariant(commandName);
    }
  }

  return {
    fontFamilyValue,
    fontFamilyOptions,
    paragraphStyleValue,
    resolvedActiveParagraphStyle,
    disabledParagraphStyleIds,
    fontStyleValue,
    fontStyleFamilyValue,
    fontStyleOptions,
    fontStyleDisabled,
    fontSizeValue,
    fontSizePlaceholder,
    fontColorValue,
    fontColorHasExplicitValue,
    fontStyleHasExplicitValue,
    alignmentHasExplicitValue,
    hasParagraphStyleOverrides,
    fontStyleValues,
    textDecorationValues,
    alignmentValue,
    isCommandEnabled,
    isCommandActive,
    isStyleToggleEnabled,
    commandValue,
    runCommand,
    fontVariantEffectiveValue,
    fontVariantHasExplicitValue,
    applyFontVariant,
    clearFontVariant,
    onParagraphStyleChanged,
    onFontFamilyChanged,
    onFontStyleChanged,
    onFontSizeChanged,
    onFontColorChanged,
    clearFontStyleOverride,
    clearAlignmentOverride,
    onFontStyleValuesChanged,
    onTextDecorationValuesChanged,
    onAlignmentChanged,
    clearParagraphStyleFormatting,
    onClearFormatting,
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

function toToggleGroupValues(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(isNonEmptyString);
  }

  return isNonEmptyString(value) ? [value] : [];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}
