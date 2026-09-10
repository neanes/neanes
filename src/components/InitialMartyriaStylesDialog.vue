<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="grid h-[48rem] max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-7xl"
    >
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.initialMartyriaStyles.root, { ns: 'dialog' }) }}
        </DialogTitle>
        <DialogDescription>
          {{
            $t(($) => $.dialog.initialMartyriaStyles.selectionDescription, {
              ns: 'dialog',
            })
          }}
        </DialogDescription>
      </DialogHeader>

      <ScrollArea class="min-h-0">
        <div
          class="grid gap-5 p-1"
          :class="
            workingConfiguration == null
              ? 'lg:grid-cols-[minmax(0,1fr)_22rem]'
              : 'lg:grid-cols-[minmax(0,1fr)_19rem_22rem]'
          "
        >
          <div class="space-y-4">
            <Field>
              <FieldLabel for="initial-martyria-language">
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.language, {
                    ns: 'dialog',
                  })
                }}
              </FieldLabel>
              <Select
                :model-value="selectedLanguageId"
                @update:model-value="selectLanguage"
              >
                <SelectTrigger id="initial-martyria-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="ALL_LANGUAGES">
                    {{
                      $t(($) => $.dialog.initialMartyriaStyles.all, {
                        ns: 'dialog',
                      })
                    }}
                  </SelectItem>
                  <SelectItem
                    v-for="languageId in initialMartyriaLanguageIds"
                    :key="languageId"
                    :value="languageId"
                  >
                    {{ languageName(languageId) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field
              v-for="{
                filter,
                label,
                selected,
                options,
              } in visibleStyleFilters"
              :key="filter.key"
            >
              <FieldLabel :for="filter.id">{{ label }}</FieldLabel>
              <Select
                :model-value="selected"
                @update:model-value="selectStyleFilter(filter, $event)"
              >
                <SelectTrigger :id="filter.id">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="filter.all">
                    {{
                      $t(($) => $.dialog.initialMartyriaStyles.all, {
                        ns: 'dialog',
                      })
                    }}
                  </SelectItem>
                  <SelectItem
                    v-for="option in options"
                    :key="option.value"
                    :value="option.value"
                    :disabled="option.disabled"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div class="grid gap-3 sm:grid-cols-2">
              <button
                v-if="
                  selectedLanguageId === ALL_LANGUAGES ||
                  selectedLanguageId === INITIAL_MARTYRIA_LANGUAGE_IDS.Greek
                "
                type="button"
                class="min-w-0 rounded-md border p-3 text-left transition-colors hover:bg-accent"
                :class="
                  workingConfiguration == null &&
                  'border-primary bg-primary/5 ring-1 ring-primary'
                "
                @click="workingConfiguration = null"
              >
                <span class="font-medium">
                  {{
                    $t(($) => $.dialog.initialMartyriaStyles.standard, {
                      ns: 'dialog',
                    })
                  }}
                </span>
                <span
                  class="mt-3 flex min-h-16 flex-col items-start gap-1 overflow-hidden"
                >
                  <ModeKeyRenderer
                    v-for="preview in standardPreviews"
                    :key="String(preview.templateId)"
                    class="initial-martyria-preview !border-0 [--zoom:1]"
                    :element="preview"
                    :page-setup="previewPageSetup"
                  />
                </span>
              </button>

              <button
                v-for="style in filteredStyles"
                :key="style.id"
                type="button"
                class="min-w-0 rounded-md border p-3 text-left transition-colors hover:bg-accent"
                :class="
                  workingConfiguration?.styleId === style.id &&
                  'border-primary bg-primary/5 ring-1 ring-primary'
                "
                @click="selectStyle(style.id)"
              >
                <span class="font-medium">
                  {{ getInitialMartyriaStyleDisplayName(style, t) }}
                </span>
                <span
                  class="mt-3 flex min-h-16 flex-col items-start gap-1 overflow-hidden"
                >
                  <span
                    v-for="preview in previewsForStyle(style.id)"
                    :key="String(preview.element.templateId)"
                    class="w-full"
                  >
                    <ModeKeyRenderer
                      class="initial-martyria-preview !border-0 [--zoom:1]"
                      :element="preview.element"
                      :page-setup="previewPageSetup"
                    />
                    <span
                      class="block text-start text-xs text-muted-foreground"
                      :lang="preview.pronunciation.languageId"
                      :dir="preview.pronunciation.flowDirection"
                      aria-hidden="true"
                    >
                      {{ preview.pronunciation.text }}
                    </span>
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div
            v-if="workingConfiguration != null && selectedStyle != null"
            class="sticky top-0 self-start space-y-4 rounded-md border bg-background p-4"
          >
            <Field>
              <FieldLabel for="initial-martyria-main-font">
                {{
                  selectedStyleUsesGreekScript
                    ? $t(($) => $.dialog.initialMartyriaStyles.textFont, {
                        ns: 'dialog',
                      })
                    : $t(($) => $.dialog.initialMartyriaStyles.mainFont, {
                        ns: 'dialog',
                      })
                }}
              </FieldLabel>
              <FontCombobox
                id="initial-martyria-main-font"
                v-model="mainFontValue"
                :options="mainFontOptions"
              />
            </Field>

            <Field v-if="showGreekFontControl">
              <FieldLabel for="initial-martyria-greek-font">
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.greekTextFont, {
                    ns: 'dialog',
                  })
                }}
              </FieldLabel>
              <FontCombobox
                id="initial-martyria-greek-font"
                v-model="greekFontValue"
                :options="greekFontOptions"
              />
            </Field>

            <Field>
              <FieldLabel for="initial-martyria-font-style">
                {{ $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' }) }}
              </FieldLabel>
              <FontStyleSelect
                id="initial-martyria-font-style"
                v-model="fontStyleValue"
                :options="fontStyleOptions"
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel for="initial-martyria-font-size">
                {{ $t(($) => $.dialog.pageSetup.size, { ns: 'dialog' }) }}
              </FieldLabel>
              <InputFontSize
                id="initial-martyria-font-size"
                :model-value="effectiveAppearance.fontSize!"
                @update:model-value="setFontSize"
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel>
                {{ $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' }) }}
              </FieldLabel>
              <ColorPicker
                :model-value="effectiveAppearance.color!"
                @update:model-value="setAppearanceOverride('color', $event)"
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel for="initial-martyria-outline">
                {{ $t(($) => $.dialog.pageSetup.outline, { ns: 'dialog' }) }}
              </FieldLabel>
              <InputStrokeWidth
                id="initial-martyria-outline"
                :model-value="effectiveAppearance.strokeWidth!"
                @update:model-value="
                  setAppearanceOverride('strokeWidth', $event)
                "
              />
            </Field>

            <details class="rounded-md border p-3">
              <summary class="cursor-pointer text-sm font-medium">
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.advancedTypography, {
                    ns: 'dialog',
                  })
                }}
              </summary>
              <div class="mt-3 space-y-3">
                <FontVariantFields
                  id-prefix="initial-martyria"
                  :caps="effectiveAppearance.fontVariantCaps ?? null"
                  :numeric="effectiveAppearance.fontVariantNumeric ?? null"
                  :ligatures="effectiveAppearance.fontVariantLigatures ?? null"
                  :alternates="
                    effectiveAppearance.fontVariantAlternates ?? null
                  "
                  :font-family="effectiveAppearance.fontFamily ?? null"
                  :font-style="effectiveAppearance.fontStyle ?? null"
                  :caps-clearable="false"
                  :numeric-clearable="false"
                  :ligatures-clearable="false"
                  :alternates-clearable="false"
                  @change="setFontVariant"
                />
              </div>
            </details>

            <Button variant="ghost" class="w-full" @click="resetAppearance">
              {{
                $t(($) => $.dialog.initialMartyriaStyles.useStyleDefaults, {
                  ns: 'dialog',
                })
              }}
            </Button>
          </div>

          <div
            class="sticky top-0 flex h-[calc(100dvh-12rem)] max-h-[40rem] min-h-0 flex-col rounded-md border bg-background"
          >
            <p class="border-b px-4 py-3 text-sm font-medium">
              {{
                $t(($) => $.dialog.initialMartyriaStyles.preview, {
                  ns: 'dialog',
                })
              }}
            </p>
            <ScrollArea class="min-h-0 flex-1">
              <div class="space-y-2 p-3">
                <div
                  v-for="preview in allTemplatePreviews"
                  :key="preview.template.id"
                  class="overflow-hidden rounded-md border px-2 py-1"
                >
                  <ModeKeyRenderer
                    class="initial-martyria-preview !w-auto !border-0 [--zoom:1]"
                    :element="preview.element"
                    :page-setup="previewPageSetup"
                  />
                  <p
                    v-if="preview.pronunciation != null"
                    class="text-sm"
                    :lang="preview.pronunciation.languageId"
                    :dir="preview.pronunciation.flowDirection"
                    aria-hidden="true"
                  >
                    {{ preview.pronunciation.text }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ $t(preview.template.description, { ns: 'model' }) }}
                  </p>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </ScrollArea>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" type="button">
            {{ $t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
          </Button>
        </DialogClose>
        <Button
          v-if="target === 'element'"
          type="button"
          variant="outline"
          @click="updateElement"
        >
          {{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}
        </Button>
        <Button type="button" @click="useForDocument">
          {{
            $t(($) => $.dialog.initialMartyriaStyles.useForDocument, {
              ns: 'dialog',
            })
          }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { SelectorParam } from 'i18next';
import { useTranslation } from 'i18next-vue';
import type { Ref } from 'vue';
import { computed, ref, toRaw } from 'vue';

import ColorPicker from '@/components/ColorPicker.vue';
import FontCombobox, {
  type FontComboboxOption,
} from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import ModeKeyRenderer from '@/components/ModeKeyRenderer.vue';
import FontVariantFields from '@/components/properties/FontVariantFields.vue';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import { ModeKeyElement, TextBoxAlignment } from '@/models/Element';
import {
  type BuiltInInitialMartyriaStyleId,
  builtInInitialMartyriaStyles,
  cloneInitialMartyriaConfiguration,
  createInitialMartyriaConfiguration,
  getInitialMartyriaContext,
  getInitialMartyriaStyleDisplayName,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaAppearanceOverrides,
  type InitialMartyriaConfiguration,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaModeIdentificationMethod,
  type InitialMartyriaModeNamingScheme,
  type InitialMartyriaNumeralKind,
  type InitialMartyriaNumeralStyle,
  type InitialMartyriaStyle,
  initialMartyriaStyleHasGreekText,
  resolveInitialMartyriaConfiguration,
  resolveInitialMartyriaStyle,
  usesGreekScript,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { PageSetup } from '@/models/PageSetup';
import { fontCatalog } from '@/services/FontCatalog';
import type { FontVariantProperty } from '@/utils/fontVariants';
import { getLegacyNeumeFontFamily } from '@/utils/getFontFamilyWithFallback';

const DEFAULT_FONT_VALUE = '__style_default__';
const ALL_LANGUAGES = '__all_languages__';
const ALL_MODE_IDENTIFICATION_METHODS = '__all_mode_identification_methods__';
const ALL_MODE_NAMING_SCHEMES = '__all_mode_naming_schemes__';
const ALL_NUMERAL_KINDS = '__all_numeral_kinds__';
const ALL_NUMERAL_STYLES = '__all_numeral_styles__';
const representativeTemplates = [100, 500, 700].map((templateId) =>
  modeKeyTemplates.find((item) => item.id === templateId)!,
);
const numeralKindOrder = [
  INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
  INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
];
const numeralStyleOrder = [
  INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
  INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
  INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
  INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
];
const modeIdentificationMethodOrder = [
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
];
const modeNamingSchemeOrder = [
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
];

const props = withDefaults(
  defineProps<{
    configuration: InitialMartyriaConfiguration | null | undefined;
    pageSetup: PageSetup;
    fonts: string[];
    target?: 'document' | 'element';
  }>(),
  { target: 'document' },
);
const emit = defineEmits<{
  update: [configuration: InitialMartyriaConfiguration | null];
  'use-for-document': [configuration: InitialMartyriaConfiguration | null];
}>();
const open = defineModel<boolean>('open', { required: true });
const { t } = useTranslation();

const initialConfiguration =
  props.configuration === undefined
    ? props.pageSetup.initialMartyriaConfiguration
    : props.configuration;
const workingConfiguration = ref<InitialMartyriaConfiguration | null>(
  initialConfiguration == null
    ? null
    : cloneInitialMartyriaConfiguration(initialConfiguration),
);
const initialStyle = builtInInitialMartyriaStyles.find(
  (style) => style.id === workingConfiguration.value?.styleId,
);
const selectedLanguageId = ref<
  InitialMartyriaLanguageId | typeof ALL_LANGUAGES
>(initialStyle?.languageId ?? initialMartyriaLanguageIds[0]);
const selectedNumeralKindFilter = ref<string>(ALL_NUMERAL_KINDS);
const selectedNumeralStyleFilter = ref<string>(ALL_NUMERAL_STYLES);
const selectedModeIdentificationMethodFilter = ref<string>(
  ALL_MODE_IDENTIFICATION_METHODS,
);
const selectedModeNamingSchemeFilter = ref<string>(
  initialStyle?.modeNamingScheme ?? ALL_MODE_NAMING_SCHEMES,
);

const stylesForSelectedLanguage = computed(() =>
  selectedLanguageId.value === ALL_LANGUAGES
    ? builtInInitialMartyriaStyles
    : builtInInitialMartyriaStyles.filter(
        (style) => style.languageId === selectedLanguageId.value,
      ),
);

type StyleFilterKey =
  | 'numeralKind'
  | 'numeralStyle'
  | 'modeIdentificationMethod'
  | 'modeNamingScheme';

interface StyleFilter {
  key: StyleFilterKey;
  id: string;
  all: string;
  values: readonly string[];
  selected: Ref<string>;
  label: () => string;
  optionLabel: (value: string) => string;
  matches: (style: InitialMartyriaStyle, value: string) => boolean;
  /** Which other filters to clear, in order, when this one strands the list. */
  resetOrder: readonly StyleFilterKey[];
}

const styleFilters: StyleFilter[] = [
  {
    key: 'numeralKind',
    id: 'initial-martyria-numeral-kind',
    all: ALL_NUMERAL_KINDS,
    values: numeralKindOrder,
    selected: selectedNumeralKindFilter,
    label: () =>
      t(($) => $.dialog.initialMartyriaStyles.numeralKind, { ns: 'dialog' }),
    optionLabel: (value) =>
      numeralKindLabel(value as InitialMartyriaNumeralKind),
    matches: (style, value) => style.numeralKind === value,
    resetOrder: [
      'numeralStyle',
      'modeIdentificationMethod',
      'modeNamingScheme',
    ],
  },
  {
    key: 'numeralStyle',
    id: 'initial-martyria-numeral-style',
    all: ALL_NUMERAL_STYLES,
    values: numeralStyleOrder,
    selected: selectedNumeralStyleFilter,
    label: () =>
      t(($) => $.dialog.initialMartyriaStyles.numeralStyle, { ns: 'dialog' }),
    optionLabel: (value) =>
      numeralStyleLabel(value as InitialMartyriaNumeralStyle),
    matches: (style, value) => style.numeralStyle === value,
    resetOrder: ['numeralKind', 'modeIdentificationMethod', 'modeNamingScheme'],
  },
  {
    key: 'modeIdentificationMethod',
    id: 'initial-martyria-mode-identification-method',
    all: ALL_MODE_IDENTIFICATION_METHODS,
    values: modeIdentificationMethodOrder,
    selected: selectedModeIdentificationMethodFilter,
    label: () =>
      t(($) => $.dialog.initialMartyriaStyles.modeIdentificationMethod, {
        ns: 'dialog',
      }),
    optionLabel: (value) =>
      modeIdentificationMethodLabel(
        value as InitialMartyriaModeIdentificationMethod,
      ),
    matches: (style, value) => style.modeIdentificationMethod === value,
    resetOrder: ['numeralStyle', 'numeralKind', 'modeNamingScheme'],
  },
  {
    key: 'modeNamingScheme',
    id: 'initial-martyria-mode-naming-scheme-filter',
    all: ALL_MODE_NAMING_SCHEMES,
    values: modeNamingSchemeOrder,
    selected: selectedModeNamingSchemeFilter,
    label: () =>
      t(($) => $.dialog.initialMartyriaStyles.modeNaming, { ns: 'dialog' }),
    optionLabel: (value) =>
      modeNamingSchemeLabel(value as InitialMartyriaModeNamingScheme),
    matches: (style, value) => style.modeNamingScheme === value,
    resetOrder: ['modeIdentificationMethod', 'numeralStyle', 'numeralKind'],
  },
];

const styleFiltersByKey = Object.fromEntries(
  styleFilters.map((filter) => [filter.key, filter]),
) as Record<StyleFilterKey, StyleFilter>;

function matchesStyleFilters(
  style: InitialMartyriaStyle,
  override?: { key: StyleFilterKey; value: string },
) {
  return styleFilters.every((filter) => {
    const selected =
      filter.key === override?.key ? override.value : filter.selected.value;
    return selected === filter.all || filter.matches(style, selected);
  });
}

function hasMatchingStyle(override?: { key: StyleFilterKey; value: string }) {
  return stylesForSelectedLanguage.value.some((style) =>
    matchesStyleFilters(style, override),
  );
}

const filteredStyles = computed(() =>
  stylesForSelectedLanguage.value.filter((style) => matchesStyleFilters(style)),
);

function availableFilterValues(filter: StyleFilter) {
  return filter.values.filter((value) =>
    stylesForSelectedLanguage.value.some((style) =>
      filter.matches(style, value),
    ),
  );
}

const visibleStyleFilters = computed(() =>
  styleFilters
    .map((filter) => ({ filter, values: availableFilterValues(filter) }))
    .filter(({ values }) => values.length > 1)
    .map(({ filter, values }) => ({
      filter,
      label: filter.label(),
      selected: filter.selected.value,
      options: values.map((value) => ({
        value,
        label: filter.optionLabel(value),
        disabled: !hasMatchingStyle({ key: filter.key, value }),
      })),
    })),
);

const selectedStyle = computed(
  () =>
    builtInInitialMartyriaStyles.find(
      (style) => style.id === workingConfiguration.value?.styleId,
    ) ?? null,
);
const resolvedConfiguration = computed(() =>
  workingConfiguration.value == null
    ? null
    : resolveInitialMartyriaConfiguration(workingConfiguration.value),
);
const effectiveAppearance = computed(
  () => resolvedConfiguration.value?.mainAppearance ?? {},
);
const fontOptions = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);
const mainFontOptions = computed<FontComboboxOption[]>(() => [
  {
    value: DEFAULT_FONT_VALUE,
    label: t(($) => $.dialog.initialMartyriaStyles.styleDefaultFont, {
      ns: 'dialog',
      font: selectedStyle.value?.defaultAppearance.mainFontFamily ?? '',
    }),
  },
  ...fontOptions.value,
]);
const greekFontOptions = computed<FontComboboxOption[]>(() => [
  {
    value: DEFAULT_FONT_VALUE,
    label: t(($) => $.dialog.initialMartyriaStyles.styleDefaultFont, {
      ns: 'dialog',
      font: selectedStyle.value?.defaultAppearance.greekFontFamily ?? '',
    }),
  },
  ...fontOptions.value,
]);
const mainFontValue = computed({
  get: () =>
    workingConfiguration.value?.appearanceOverrides.mainFontFamily ??
    DEFAULT_FONT_VALUE,
  set: (value: string) =>
    setOptionalAppearanceOverride('mainFontFamily', value),
});
const greekFontValue = computed({
  get: () =>
    workingConfiguration.value?.appearanceOverrides.greekFontFamily ??
    DEFAULT_FONT_VALUE,
  set: (value: string) =>
    setOptionalAppearanceOverride('greekFontFamily', value),
});
const selectedStyleUsesGreekScript = computed(
  () =>
    selectedStyle.value != null &&
    usesGreekScript(selectedStyle.value.languageId),
);
const showGreekFontControl = computed(
  () =>
    selectedStyle.value != null &&
    !selectedStyleUsesGreekScript.value &&
    (!selectedStyle.value.transliterateNoteNames ||
      initialMartyriaStyleHasGreekText(selectedStyle.value)),
);
const fontStyleValue = computed({
  get: () => effectiveAppearance.value.fontStyle ?? '',
  set: (value: string) => setAppearanceOverride('fontStyle', value),
});
const { fontStyleOptions, remapStyleForFamily } = useFontStyleControls(
  () => effectiveAppearance.value.fontFamily ?? '',
  () => effectiveAppearance.value.fontStyle ?? '',
);

const previewPageSetup = computed(() => {
  const pageSetup = Object.assign(new PageSetup(), toRaw(props.pageSetup));
  pageSetup.initialMartyriaConfiguration =
    workingConfiguration.value == null
      ? null
      : cloneInitialMartyriaConfiguration(workingConfiguration.value);
  return pageSetup;
});

function representativePreviews(
  configuration: InitialMartyriaConfiguration | null,
) {
  return representativeTemplates.map((template) =>
    createPreviewElement(template, configuration),
  );
}

const standardPreviews = computed(() => representativePreviews(null));
const stylePreviews = computed(() => {
  const previews = new Map<
    BuiltInInitialMartyriaStyleId,
    ReturnType<typeof createPronouncedPreview>[]
  >();
  for (const style of builtInInitialMartyriaStyles) {
    const configuration =
      workingConfiguration.value == null
        ? createInitialMartyriaConfiguration(style.id)
        : {
            ...cloneInitialMartyriaConfiguration(workingConfiguration.value),
            styleId: style.id,
          };
    previews.set(
      style.id,
      representativeTemplates.map((template) =>
        createPronouncedPreview(template, configuration),
      ),
    );
  }
  return previews;
});
const allTemplatePreviews = computed(() => {
  const configuration = workingConfiguration.value;
  return modeKeyTemplates.map((template) => {
    const element = createPreviewElement(template, configuration);
    return {
      template,
      element,
      pronunciation:
        configuration == null
          ? null
          : getPreviewPronunciation(element, configuration),
    };
  });
});

function previewsForStyle(styleId: BuiltInInitialMartyriaStyleId) {
  return stylePreviews.value.get(styleId)!;
}

type DialogSelector = SelectorParam<'dialog'>;

const languageNameSelectors: Record<InitialMartyriaLanguageId, DialogSelector> =
  {
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: ($) =>
      $.dialog.initialMartyriaStyles.languages.greek,
    [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: ($) =>
      $.dialog.initialMartyriaStyles.languages.english,
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: ($) =>
      $.dialog.initialMartyriaStyles.languages.spanish,
    [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: ($) =>
      $.dialog.initialMartyriaStyles.languages.churchSlavonic,
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: ($) =>
      $.dialog.initialMartyriaStyles.languages.russian,
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: ($) =>
      $.dialog.initialMartyriaStyles.languages.arabic,
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: ($) =>
      $.dialog.initialMartyriaStyles.languages.romanian,
  };

const numeralKindSelectors: Record<InitialMartyriaNumeralKind, DialogSelector> =
  {
    [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal]: ($) =>
      $.dialog.initialMartyriaStyles.numeralKinds.cardinal,
    [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal]: ($) =>
      $.dialog.initialMartyriaStyles.numeralKinds.ordinal,
  };

const numeralKindExampleSelectors: Record<
  InitialMartyriaNumeralKind,
  DialogSelector
> = {
  [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal]: ($) =>
    $.dialog.initialMartyriaStyles.numeralKindExamples.cardinal,
  [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal]: ($) =>
    $.dialog.initialMartyriaStyles.numeralKindExamples.ordinal,
};

const numeralStyleSelectors: Record<
  InitialMartyriaNumeralStyle,
  DialogSelector
> = {
  [INITIAL_MARTYRIA_NUMERAL_STYLES.Digits]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyles.digits,
  [INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyles.romanNumerals,
  [INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyles.alphabeticNumerals,
  [INITIAL_MARTYRIA_NUMERAL_STYLES.Words]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyles.words,
};

const modeIdentificationMethodSelectors: Record<
  InitialMartyriaModeIdentificationMethod,
  DialogSelector
> = {
  [INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text]: ($) =>
    $.dialog.initialMartyriaStyles.modeIdentificationMethods.text,
  [INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign]: ($) =>
    $.dialog.initialMartyriaStyles.modeIdentificationMethods.modeSign,
  [INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign]: ($) =>
    $.dialog.initialMartyriaStyles.modeIdentificationMethods.textAndModeSign,
};

const modeNamingSchemeSelectors: Record<
  InitialMartyriaModeNamingScheme,
  DialogSelector
> = {
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute]: ($) =>
    $.dialog.initialMartyriaStyles.modeNamingSchemes.absolute,
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart]: ($) =>
    $.dialog.initialMartyriaStyles.modeNamingSchemes.authenticCounterpart,
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass]: ($) =>
    $.dialog.initialMartyriaStyles.modeNamingSchemes.plagalClass,
};

const modeNamingSchemeExampleSelectors: Record<
  InitialMartyriaModeNamingScheme,
  DialogSelector
> = {
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute]: ($) =>
    $.dialog.initialMartyriaStyles.modeNamingSchemeExamples.absolute,
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart]: ($) =>
    $.dialog.initialMartyriaStyles.modeNamingSchemeExamples
      .authenticCounterpart,
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass]: ($) =>
    $.dialog.initialMartyriaStyles.modeNamingSchemeExamples.plagalClass,
};

const alphabeticNumeralExampleSelectors: Partial<
  Record<InitialMartyriaLanguageId, DialogSelector>
> = {
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyleExamples.greekNumerals,
  [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyleExamples.churchSlavonicNumerals,
};

const ordinalExampleSelectors: Partial<
  Record<InitialMartyriaLanguageId, DialogSelector>
> = {
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyleExamples.greekOrdinal,
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyleExamples.spanishOrdinal,
  [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyleExamples.churchSlavonicOrdinal,
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyleExamples.russianOrdinal,
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyleExamples.romanianOrdinal,
};

function languageName(languageId: InitialMartyriaLanguageId) {
  return t(languageNameSelectors[languageId], { ns: 'dialog' });
}

function numeralKindLabel(numeralKind: InitialMartyriaNumeralKind) {
  return t(($) => $.dialog.initialMartyriaStyles.optionWithExample, {
    ns: 'dialog',
    option: t(numeralKindSelectors[numeralKind], { ns: 'dialog' }),
    example: t(numeralKindExampleSelectors[numeralKind], { ns: 'dialog' }),
  });
}

function modeIdentificationMethodLabel(
  method: InitialMartyriaModeIdentificationMethod,
) {
  return t(modeIdentificationMethodSelectors[method], { ns: 'dialog' });
}

function modeNamingSchemeLabel(scheme: InitialMartyriaModeNamingScheme) {
  return t(($) => $.dialog.initialMartyriaStyles.optionWithExample, {
    ns: 'dialog',
    option: t(modeNamingSchemeSelectors[scheme], { ns: 'dialog' }),
    example: t(modeNamingSchemeExampleSelectors[scheme], { ns: 'dialog' }),
  });
}

function numeralStyleLabel(numeralStyle: InitialMartyriaNumeralStyle) {
  let example: string;

  switch (numeralStyle) {
    case INITIAL_MARTYRIA_NUMERAL_STYLES.Digits:
      example = t(
        ($) => $.dialog.initialMartyriaStyles.numeralStyleExamples.digits,
        { ns: 'dialog' },
      );
      break;
    case INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals:
      example = t(
        ($) =>
          $.dialog.initialMartyriaStyles.numeralStyleExamples.romanNumerals,
        { ns: 'dialog' },
      );
      break;
    case INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals:
      example = alphabeticNumeralStyleExample();
      break;
    case INITIAL_MARTYRIA_NUMERAL_STYLES.Words:
      example = wordNumeralStyleExample();
      break;
  }

  return t(($) => $.dialog.initialMartyriaStyles.optionWithExample, {
    ns: 'dialog',
    option: t(numeralStyleSelectors[numeralStyle], { ns: 'dialog' }),
    example,
  });
}

function alphabeticNumeralStyleExample() {
  if (selectedLanguageId.value === ALL_LANGUAGES) {
    return Object.values(alphabeticNumeralExampleSelectors)
      .map((selector) => t(selector!, { ns: 'dialog' }))
      .join(' / ');
  }
  const selector = alphabeticNumeralExampleSelectors[selectedLanguageId.value];
  if (selector == null) {
    throw new Error(
      `No alphabetic numeral example for ${selectedLanguageId.value}`,
    );
  }
  return t(selector, { ns: 'dialog' });
}

function wordNumeralStyleExample() {
  const availableKinds = numeralKindOrder.filter((numeralKind) =>
    stylesForSelectedLanguage.value.some(
      (style) =>
        style.numeralKind === numeralKind &&
        style.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    ),
  );
  const selectedKind = selectedNumeralKindFilter.value;
  const displayedKinds = availableKinds.includes(
    selectedKind as InitialMartyriaNumeralKind,
  )
    ? [selectedKind as InitialMartyriaNumeralKind]
    : availableKinds;

  return displayedKinds.map(numeralKindExampleLabel).join(' / ');
}

function numeralKindExampleLabel(numeralKind: InitialMartyriaNumeralKind) {
  if (numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal) {
    return t(
      ($) =>
        $.dialog.initialMartyriaStyles.numeralStyleExamples.englishCardinal,
      { ns: 'dialog' },
    );
  }
  const selector =
    selectedLanguageId.value === ALL_LANGUAGES
      ? null
      : ordinalExampleSelectors[selectedLanguageId.value];
  return t(
    selector ??
      (($) =>
        $.dialog.initialMartyriaStyles.numeralStyleExamples.englishOrdinal),
    { ns: 'dialog' },
  );
}

function selectLanguage(value: unknown) {
  if (
    value !== ALL_LANGUAGES &&
    !initialMartyriaLanguageIds.includes(value as InitialMartyriaLanguageId)
  ) {
    return;
  }
  selectedLanguageId.value = value as
    InitialMartyriaLanguageId | typeof ALL_LANGUAGES;
  for (const filter of styleFilters) {
    filter.selected.value = filter.all;
  }
  if (value === ALL_LANGUAGES) {
    selectFirstVisibleStyle();
    return;
  }
  const firstStyle = builtInInitialMartyriaStyles.find(
    (style) => style.languageId === value,
  );
  if (firstStyle != null) {
    selectStyle(firstStyle.id);
  }
}

function selectStyle(styleId: BuiltInInitialMartyriaStyleId) {
  if (workingConfiguration.value == null) {
    workingConfiguration.value = createInitialMartyriaConfiguration(styleId);
  } else {
    workingConfiguration.value.styleId = styleId;
  }
}

function selectStyleFilter(filter: StyleFilter, value: unknown) {
  if (
    typeof value !== 'string' ||
    (value !== filter.all && !filter.values.includes(value))
  ) {
    return;
  }
  filter.selected.value = value;
  reconcileStyleFilters(filter);
  selectFirstVisibleStyle();
}

function reconcileStyleFilters(preferredFilter: StyleFilter) {
  if (hasMatchingStyle()) {
    return;
  }

  for (const key of preferredFilter.resetOrder) {
    const filter = styleFiltersByKey[key];
    filter.selected.value = filter.all;
    if (hasMatchingStyle()) {
      return;
    }
  }
  preferredFilter.selected.value = preferredFilter.all;
}

function selectFirstVisibleStyle() {
  if (
    workingConfiguration.value == null ||
    filteredStyles.value.some(
      (style) => style.id === workingConfiguration.value?.styleId,
    )
  ) {
    return;
  }
  const firstStyle = filteredStyles.value[0];
  if (firstStyle != null) {
    selectStyle(firstStyle.id);
  }
}

function setAppearanceOverride<
  K extends keyof InitialMartyriaAppearanceOverrides,
>(property: K, value: InitialMartyriaAppearanceOverrides[K]) {
  if (workingConfiguration.value != null) {
    workingConfiguration.value.appearanceOverrides[property] = value;
  }
}

function setOptionalAppearanceOverride(
  property: 'mainFontFamily' | 'greekFontFamily',
  value: string,
) {
  if (workingConfiguration.value == null) {
    return;
  }
  if (value === DEFAULT_FONT_VALUE) {
    delete workingConfiguration.value.appearanceOverrides[property];
  } else {
    workingConfiguration.value.appearanceOverrides[property] = value;
    if (property === 'mainFontFamily') {
      const remapped = remapStyleForFamily(value);
      workingConfiguration.value.appearanceOverrides.fontStyle = remapped;
    }
  }
}

function setFontVariant(property: FontVariantProperty, value: string) {
  setAppearanceOverride(
    property as keyof InitialMartyriaAppearanceOverrides,
    (value === '' ? null : value) as never,
  );
}

function setFontSize(value: number | null) {
  if (value != null) {
    setAppearanceOverride('fontSize', value);
  }
}

function resetAppearance() {
  if (workingConfiguration.value != null) {
    workingConfiguration.value.appearanceOverrides = {};
  }
}

function createPreviewElement(
  template: (typeof modeKeyTemplates)[number],
  configuration: InitialMartyriaConfiguration | null,
) {
  const element = ModeKeyElement.createFromTemplate(
    template,
    props.pageSetup.useOptionalDiatonicFthoras,
    TextBoxAlignment.Left,
  );
  element.initialMartyriaConfiguration =
    configuration == null
      ? null
      : cloneInitialMartyriaConfiguration(configuration);
  element.width = 320;

  if (configuration == null) {
    element.computedFontFamily = getLegacyNeumeFontFamily(
      props.pageSetup.neumeDefaultFontFamily,
    );
    element.computedFontSize = props.pageSetup.modeKeyDefaultFontSize;
    element.computedColor = props.pageSetup.modeKeyDefaultColor;
    element.computedStrokeWidth = props.pageSetup.modeKeyDefaultStrokeWidth;
    element.height = props.pageSetup.modeKeyDefaultFontSize * 1.5;
    return element;
  }

  const resolved = resolveInitialMartyriaConfiguration(configuration)!;
  element.computedFontFamily = props.pageSetup.neumeDefaultFontFamily;
  element.computedFontSize = resolved.mainAppearance.fontSize!;
  element.computedColor = resolved.mainAppearance.color!;
  element.computedStrokeWidth = resolved.mainAppearance.strokeWidth!;
  element.computedTop = -40;
  element.computedBottom = 20;
  element.computedFlowTop = -20;
  element.height = 60;
  return element;
}

function createPronouncedPreview(
  template: (typeof modeKeyTemplates)[number],
  configuration: InitialMartyriaConfiguration,
) {
  const element = createPreviewElement(template, configuration);
  return {
    element,
    pronunciation: getPreviewPronunciation(element, configuration),
  };
}

function getPreviewPronunciation(
  element: ModeKeyElement,
  configuration: InitialMartyriaConfiguration,
) {
  const resolvedConfiguration =
    resolveInitialMartyriaConfiguration(configuration)!;
  const resolution = resolveInitialMartyriaStyle({
    context: getInitialMartyriaContext(element),
    resolvedConfiguration,
    pageSetup: previewPageSetup.value,
  });
  return {
    text: resolution.pronunciation,
    languageId: resolution.style.languageId,
    flowDirection: resolution.flowDirection,
  };
}

function getWorkingCopy() {
  return workingConfiguration.value == null
    ? null
    : cloneInitialMartyriaConfiguration(workingConfiguration.value);
}

function updateElement() {
  emit('update', getWorkingCopy());
  open.value = false;
}

function useForDocument() {
  emit('use-for-document', getWorkingCopy());
  open.value = false;
}
</script>

<style scoped>
:deep(.initial-martyria-preview.mode-key-container) {
  border: 0;
  outline: 0;
}
</style>
