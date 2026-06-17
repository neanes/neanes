import { useTranslation } from 'i18next-vue';
import { computed } from 'vue';

import type { FontComboboxOption } from '@/components/FontCombobox.vue';
import {
  execForOwner,
  useActiveEditorForOwner,
  useEditorCommandStates,
} from '@/composables/useRichTextEditorRegistry';
import type { PageSetup } from '@/models/PageSetup';
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

export function useRichTextStyleCommands(
  props: {
    element: object;
    pageSetup: PageSetup;
    fonts: string[];
    defaultFontFamily: string;
    defaultFontSize: number;
    defaultFontColor: string;
  },
  extraCommandNames: string[] = [],
) {
  const { t } = useTranslation();
  const scopedEditor = useActiveEditorForOwner(() => props.element);

  const commandStates = useEditorCommandStates(scopedEditor, [
    ...STYLE_COMMAND_NAMES,
    ...extraCommandNames,
  ]);

  const fontFamilyValue = computed(() =>
    fromRichTextFontFamilyModelValue(commandValue('fontFamily')),
  );

  const defaultLabel = computed(() =>
    t(($) => $.toolbar.richTextBox.default, { ns: 'toolbar' }),
  );

  const fontFamilyOptions = computed<FontComboboxOption[]>(() => {
    const resolvedDefault = props.defaultFontFamily.trim();

    return [
      {
        label: resolvedDefault
          ? `${defaultLabel.value} (${resolvedDefault})`
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
      : DEFAULT_FONT_STYLE;
  });

  const fontStyleFamilyValue = computed(() => {
    if (fontFamilyValue.value !== RICH_TEXT_DEFAULT_FONT_FAMILY) {
      return fontFamilyValue.value;
    }

    return normalizeFontFamily(props.defaultFontFamily);
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
      `${defaultLabel.value} (${defaultSizeFormat.format(Unit.toPt(props.defaultFontSize))})`,
  );

  const fontColorValue = computed(() => {
    const value = commandValue('fontColor');
    return typeof value === 'string' ? value : props.defaultFontColor;
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

    execForOwner(props.element, commandName, ...args);
  }

  function isStyleToggleEnabled(style: string) {
    return isCommandEnabled(STYLE_TOGGLE_COMMANDS[style] ?? style);
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
      const inheritedFamily = normalizeFontFamily(props.defaultFontFamily);
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

  function onRemoveFormat() {
    if (!isCommandEnabled('removeFormat')) {
      return;
    }

    if (isCommandEnabled('fontStyle')) {
      execForOwner(props.element, 'fontStyle');
    }

    execForOwner(props.element, 'removeFormat');
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
    fontFamilyValue,
    fontFamilyOptions,
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
    commandValue,
    runCommand,
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
