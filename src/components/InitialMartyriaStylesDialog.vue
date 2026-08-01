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
                  <SelectItem
                    v-for="language in initialMartyriaLanguages"
                    :key="language.id"
                    :value="language.id"
                  >
                    {{ languageName(language.id) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <button
              type="button"
              class="w-full rounded-md border p-3 text-left transition-colors hover:bg-accent"
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
              <span class="mt-1 block text-sm text-muted-foreground">
                {{
                  $t(
                    ($) => $.dialog.initialMartyriaStyles.standardDescription,
                    {
                      ns: 'dialog',
                    },
                  )
                }}
              </span>
              <span
                class="mt-3 flex min-h-16 items-center gap-3 overflow-hidden"
              >
                <ModeKeyRenderer
                  v-for="preview in standardPreviews"
                  :key="String(preview.templateId)"
                  class="initial-martyria-preview !w-auto !border-0 [--zoom:1]"
                  :element="preview"
                  :page-setup="previewPageSetup"
                />
              </span>
            </button>

            <div class="grid gap-3 sm:grid-cols-2">
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
                  <ModeKeyRenderer
                    v-for="preview in previewsForStyle(style.id)"
                    :key="String(preview.templateId)"
                    class="initial-martyria-preview !border-0 [--zoom:1]"
                    :element="preview"
                    :page-setup="previewPageSetup"
                  />
                </span>
              </button>
            </div>
          </div>

          <div
            v-if="workingConfiguration != null && selectedStyle != null"
            class="sticky top-0 self-start space-y-4 rounded-md border bg-background p-4"
          >
            <Field orientation="horizontal">
              <Checkbox
                id="initial-martyria-transliterate"
                :model-value="workingConfiguration.transliterateNoteNames"
                @update:model-value="
                  workingConfiguration.transliterateNoteNames = $event === true
                "
              />
              <FieldLabel for="initial-martyria-transliterate">
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.transliterate, {
                    ns: 'dialog',
                  })
                }}
              </FieldLabel>
            </Field>

            <Field>
              <FieldLabel for="initial-martyria-main-font">
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.mainFont, {
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
import { useTranslation } from 'i18next-vue';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  getInitialMartyriaStyleDisplayName,
  type InitialMartyriaAppearanceOverrides,
  type InitialMartyriaConfiguration,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguages,
  resolveInitialMartyriaConfiguration,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import type { PageSetup } from '@/models/PageSetup';
import { fontCatalog } from '@/services/FontCatalog';
import type { FontVariantProperty } from '@/utils/fontVariants';
import { getLegacyNeumeFontFamily } from '@/utils/getFontFamilyWithFallback';

const DEFAULT_FONT_VALUE = '__style_default__';
const representativeTemplateIds = [100, 500, 700];

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
const selectedLanguageId = ref<InitialMartyriaLanguageId>(
  builtInInitialMartyriaStyles.find(
    (style) => style.id === workingConfiguration.value?.styleId,
  )?.languageId ?? initialMartyriaLanguages[0].id,
);

const filteredStyles = computed(() =>
  builtInInitialMartyriaStyles.filter(
    (style) => style.languageId === selectedLanguageId.value,
  ),
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
const showGreekFontControl = computed(
  () =>
    workingConfiguration.value?.transliterateNoteNames !== true ||
    selectedStyle.value?.components.some(
      (component) =>
        (component.kind === 'text' || component.kind === 'stackedText') &&
        component.fontRole === 'greek',
    ) === true,
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
  const pageSetup = Object.assign(
    Object.create(Object.getPrototypeOf(props.pageSetup)),
    toRaw(props.pageSetup),
  ) as PageSetup;
  pageSetup.initialMartyriaConfiguration =
    workingConfiguration.value == null
      ? null
      : cloneInitialMartyriaConfiguration(workingConfiguration.value);
  return pageSetup;
});
const standardPreviews = computed(() =>
  representativeTemplateIds.map((templateId) => {
    const template = modeKeyTemplates.find((item) => item.id === templateId)!;
    return createPreviewElement(template, null);
  }),
);
const allTemplatePreviews = computed(() =>
  modeKeyTemplates.map((template) => ({
    template,
    element: createPreviewElement(template, workingConfiguration.value),
  })),
);

function languageName(languageId: InitialMartyriaLanguageId) {
  switch (languageId) {
    case 'el':
      return t(($) => $.dialog.initialMartyriaStyles.languages.greek, {
        ns: 'dialog',
      });
    case 'en':
      return t(($) => $.dialog.initialMartyriaStyles.languages.english, {
        ns: 'dialog',
      });
    case 'es':
      return t(($) => $.dialog.initialMartyriaStyles.languages.spanish, {
        ns: 'dialog',
      });
    case 'cu':
      return t(($) => $.dialog.initialMartyriaStyles.languages.churchSlavonic, {
        ns: 'dialog',
      });
    case 'ru':
      return t(($) => $.dialog.initialMartyriaStyles.languages.russian, {
        ns: 'dialog',
      });
    case 'ro':
      return t(($) => $.dialog.initialMartyriaStyles.languages.romanian, {
        ns: 'dialog',
      });
  }
}

function selectLanguage(value: unknown) {
  const language = initialMartyriaLanguages.find((item) => item.id === value);
  if (language == null) {
    return;
  }
  selectedLanguageId.value = language.id;
  const firstStyle = builtInInitialMartyriaStyles.find(
    (style) => style.languageId === language.id,
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

function previewsForStyle(styleId: BuiltInInitialMartyriaStyleId) {
  const configuration =
    workingConfiguration.value == null
      ? createInitialMartyriaConfiguration(styleId)
      : {
          ...cloneInitialMartyriaConfiguration(workingConfiguration.value),
          styleId,
        };
  return representativeTemplateIds.map((templateId) => {
    const template = modeKeyTemplates.find((item) => item.id === templateId)!;
    return createPreviewElement(template, configuration);
  });
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
