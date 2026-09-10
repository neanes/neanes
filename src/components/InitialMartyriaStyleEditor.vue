<template>
  <div
    class="grid min-h-0 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_17rem]"
  >
    <Tabs
      v-model="tab"
      class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden"
    >
      <TabsList>
        <TabsTrigger value="structure">
          {{ $t(($) => $.dialog.initialMartyriaStyles.structure, { ns }) }}
        </TabsTrigger>
        <TabsTrigger value="presentation">
          {{ $t(($) => $.dialog.initialMartyriaStyles.presentation, { ns }) }}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="structure" class="min-h-0 overflow-hidden">
        <ScrollArea class="h-full min-h-0">
          <div class="space-y-5 p-1 pr-3">
            <section
              v-for="strip in strips"
              :key="strip.key"
              :aria-label="strip.label"
            >
              <p class="mb-2 text-sm font-medium">{{ strip.label }}</p>
              <div
                class="grid gap-2"
                :class="
                  strip.tiles.length > 3
                    ? 'grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]'
                    : 'grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]'
                "
              >
                <InitialMartyriaStyleTile
                  v-for="tile in strip.tiles"
                  :key="tile.key"
                  :style="withStructure(tile.structure)"
                  :template-id="strip.templateId"
                  :page-setup="pageSetup"
                  :selected="tile.current"
                  :caption="tile.caption"
                  @select="setStructure(tile.structure)"
                />
              </div>
            </section>

            <Field v-if="!languageUsesGreekScript" orientation="horizontal">
              <Checkbox
                id="initial-martyria-transliterate"
                :model-value="draft.structure.transliterateNoteNames"
                @update:model-value="
                  setStructure({
                    ...draft.structure,
                    transliterateNoteNames: $event === true,
                  })
                "
              />
              <FieldContent>
                <FieldLabel for="initial-martyria-transliterate">
                  {{
                    $t(
                      ($) =>
                        $.dialog.initialMartyriaStyles.transliterateNoteNames,
                      { ns },
                    )
                  }}
                </FieldLabel>
                <FieldDescription>
                  {{
                    $t(
                      ($) =>
                        $.dialog.initialMartyriaStyles
                          .transliterateNoteNamesHint,
                      { ns },
                    )
                  }}
                </FieldDescription>
              </FieldContent>
            </Field>

            <Button
              variant="link"
              class="h-auto px-0"
              type="button"
              @click="$emit('browse')"
            >
              <PhSquaresFour />
              {{
                $t(($) => $.dialog.initialMartyriaStyles.browseAllLink, { ns })
              }}
            </Button>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="presentation" class="min-h-0 overflow-hidden">
        <ScrollArea class="h-full min-h-0">
          <div class="space-y-4 p-1 pr-3">
            <Field>
              <FieldLabel for="initial-martyria-main-font">
                {{
                  languageUsesGreekScript
                    ? $t(($) => $.dialog.initialMartyriaStyles.textFont, { ns })
                    : $t(($) => $.dialog.initialMartyriaStyles.mainFont, { ns })
                }}
              </FieldLabel>
              <FontCombobox
                id="initial-martyria-main-font"
                :model-value="draft.appearance.mainFontFamily"
                :options="mainFontOptions"
                @update:model-value="setMainFontFamily"
              />
            </Field>

            <Field v-if="showGreekFontControl">
              <FieldLabel for="initial-martyria-greek-font">
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.greekTextFont, {
                    ns,
                  })
                }}
              </FieldLabel>
              <FontCombobox
                id="initial-martyria-greek-font"
                :model-value="draft.appearance.greekFontFamily"
                :options="greekFontOptions"
                @update:model-value="setAppearance('greekFontFamily', $event)"
              />
            </Field>

            <Field>
              <FieldLabel for="initial-martyria-font-style">
                {{ $t(($) => $.dialog.pageSetup.style, { ns }) }}
              </FieldLabel>
              <FontStyleSelect
                id="initial-martyria-font-style"
                :model-value="draft.appearance.fontStyle"
                :options="fontStyleOptions"
                @update:model-value="setAppearance('fontStyle', $event)"
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel for="initial-martyria-font-size">
                {{ $t(($) => $.dialog.pageSetup.size, { ns }) }}
              </FieldLabel>
              <InputFontSize
                id="initial-martyria-font-size"
                :model-value="draft.appearance.fontSize"
                @update:model-value="setFontSize"
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel>
                {{ $t(($) => $.dialog.pageSetup.color, { ns }) }}
              </FieldLabel>
              <ColorPicker
                :model-value="draft.appearance.color"
                @update:model-value="setAppearance('color', $event)"
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel for="initial-martyria-outline">
                {{ $t(($) => $.dialog.pageSetup.outline, { ns }) }}
              </FieldLabel>
              <InputStrokeWidth
                id="initial-martyria-outline"
                :model-value="draft.appearance.strokeWidth"
                @update:model-value="setAppearance('strokeWidth', $event)"
              />
            </Field>

            <Field v-if="hasOrdinalDigits" orientation="horizontal">
              <Checkbox
                id="initial-martyria-ordinal-forms"
                :model-value="draft.appearance.useOrdinalForms"
                @update:model-value="
                  setAppearance('useOrdinalForms', $event === true)
                "
              />
              <FieldLabel for="initial-martyria-ordinal-forms">
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.useOrdinalForms, {
                    ns,
                  })
                }}
              </FieldLabel>
            </Field>

            <details class="rounded-md border p-3">
              <summary class="cursor-pointer text-sm font-medium">
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.advancedTypography, {
                    ns,
                  })
                }}
              </summary>
              <div class="mt-3 space-y-3">
                <FontVariantFields
                  id-prefix="initial-martyria"
                  :caps="draft.appearance.fontVariantCaps"
                  :numeric="draft.appearance.fontVariantNumeric"
                  :ligatures="draft.appearance.fontVariantLigatures"
                  :alternates="draft.appearance.fontVariantAlternates"
                  :font-family="resolvedMainFontFamily"
                  :font-style="draft.appearance.fontStyle"
                  :caps-clearable="false"
                  :numeric-clearable="false"
                  :ligatures-clearable="false"
                  :alternates-clearable="false"
                  :show-ordinals="false"
                  @change="setFontVariant"
                />
              </div>
            </details>
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>

    <ScrollArea class="min-h-0">
      <div class="space-y-4 p-1">
        <Field>
          <FieldLabel for="initial-martyria-style-name">
            {{ $t(($) => $.dialog.initialMartyriaStyles.name, { ns }) }}
          </FieldLabel>
          <Input
            id="initial-martyria-style-name"
            :model-value="draft.displayName"
            :placeholder="
              $t(($) => $.dialog.initialMartyriaStyles.styleNamePlaceholder, {
                ns,
              })
            "
            :aria-invalid="!nameValid"
            @update:model-value="setDisplayName(String($event))"
          />
        </Field>

        <Field>
          <FieldLabel for="initial-martyria-style-language">
            {{ $t(($) => $.dialog.initialMartyriaStyles.language, { ns }) }}
          </FieldLabel>
          <Select
            :model-value="draft.structure.languageId"
            @update:model-value="setLanguage"
          >
            <SelectTrigger id="initial-martyria-style-language" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="languageId in initialMartyriaLanguageIds"
                :key="languageId"
                :value="languageId"
              >
                {{ getInitialMartyriaLanguageName(t, languageId) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <div class="rounded-md border bg-muted/40">
          <div
            class="flex items-center justify-between gap-2 border-b px-3 py-2"
          >
            <span class="text-sm font-medium">
              {{ $t(($) => $.dialog.initialMartyriaStyles.preview, { ns }) }}
            </span>
            <Select v-model="sampleModeValue">
              <SelectTrigger
                size="sm"
                class="h-7 w-auto gap-1 text-xs"
                :aria-label="
                  $t(($) => $.dialog.initialMartyriaStyles.sampleMode, { ns })
                "
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in sampleModeOptions"
                  :key="option.mode"
                  :value="String(option.mode)"
                >
                  {{ $t(option.labelSelector, { ns: 'model' }) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-3 p-3">
            <div
              v-for="templateId in previewTemplateIds"
              :key="templateId"
              class="flex flex-col items-center gap-1 overflow-hidden"
            >
              <InitialMartyriaSample
                :style="draft"
                :template-id="templateId"
                :page-setup="pageSetup"
                :max-font-size="28"
              />
              <span
                class="text-center text-xs text-muted-foreground"
                :lang="draft.structure.languageId"
                aria-hidden="true"
              >
                {{ pronunciationFor(templateId) }}
              </span>
            </div>
          </div>
        </div>

        <p
          v-if="basedOnStyle != null"
          class="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground"
        >
          <span>
            {{
              $t(($) => $.dialog.initialMartyriaStyles.basedOn, {
                ns,
                name: getInitialMartyriaStyleDisplayName(basedOnStyle, t),
              })
            }}
          </span>
          <Button
            variant="link"
            size="sm"
            class="h-auto px-0 text-xs"
            type="button"
            @click="resetToBase"
          >
            {{ $t(($) => $.dialog.initialMartyriaStyles.resetToBase, { ns }) }}
          </Button>
        </p>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { PhSquaresFour } from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import { computed, ref } from 'vue';

import ColorPicker from '@/components/ColorPicker.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InitialMartyriaSample from '@/components/InitialMartyriaSample.vue';
import InitialMartyriaStyleTile from '@/components/InitialMartyriaStyleTile.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import FontVariantFields from '@/components/properties/FontVariantFields.vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import { ModeKeyElement } from '@/models/Element';
import {
  cloneInitialMartyriaStyle,
  getBuiltInInitialMartyriaStyle,
  getDefaultBuiltInInitialMartyriaStyle,
  getInitialMartyriaContext,
  getInitialMartyriaStructureVariations,
  getInitialMartyriaStyleDisplayName,
  INITIAL_MARTYRIA_DEFAULT_FONT_FAMILY,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  initialMartyriaModeIdentificationMethods,
  initialMartyriaModeNamingSchemes,
  initialMartyriaNumeralForms,
  initialMartyriaNumeralQualifiers,
  type InitialMartyriaStructure,
  initialMartyriaStructureHasGreekText,
  initialMartyriaStructureHasOrdinalDigits,
  type InitialMartyriaStyle,
  type InitialMartyriaStyleAppearance,
  normalizeInitialMartyriaStructure,
  resolveInitialMartyriaFontFamily,
  resolveInitialMartyriaStyle,
  resolveInitialMartyriaStyleAppearances,
  usesGreekScript,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import type { PageSetup } from '@/models/PageSetup';
import { fontCatalog } from '@/services/FontCatalog';
import type { FontVariantProperty } from '@/utils/fontVariants';
import {
  getInitialMartyriaLanguageName,
  getInitialMartyriaModeIdentificationMethodLabel,
  getInitialMartyriaModeNamingSchemeLabel,
  getInitialMartyriaNumeralFormLabel,
  getInitialMartyriaNumeralQualifierLabel,
} from '@/utils/initialMartyriaLabels';

import {
  getSampleModeOptions,
  getSampleTemplateId,
  GRAVE_SAMPLE_MODE,
  PLAGAL_SAMPLE_MODE,
  withInitialMartyriaStyleStructure,
} from './InitialMartyriaStylesDialog.shared';

const ns = 'dialog';

const props = defineProps<{
  pageSetup: PageSetup;
  fonts: string[];
  nameValid: boolean;
}>();

defineEmits<{ browse: [] }>();

const draft = defineModel<InitialMartyriaStyle>({ required: true });
const sampleMode = defineModel<number>('sampleMode', { required: true });
const { t } = useTranslation();

const tab = ref<'structure' | 'presentation'>('structure');
const sampleModeOptions = getSampleModeOptions();
const sampleModeValue = computed({
  get: () => String(sampleMode.value),
  set: (value: string) => {
    sampleMode.value = Number(value);
  },
});
const sampleTemplateId = computed(() => getSampleTemplateId(sampleMode.value));
const plagalTemplateId = getSampleTemplateId(PLAGAL_SAMPLE_MODE);
const previewTemplateIds = computed(() =>
  sampleMode.value === GRAVE_SAMPLE_MODE
    ? [sampleTemplateId.value]
    : [sampleTemplateId.value, getSampleTemplateId(GRAVE_SAMPLE_MODE)],
);

const languageUsesGreekScript = computed(() =>
  usesGreekScript(draft.value.structure.languageId),
);
const showGreekFontControl = computed(
  () =>
    !languageUsesGreekScript.value &&
    (!draft.value.structure.transliterateNoteNames ||
      initialMartyriaStructureHasGreekText(draft.value.structure)),
);
const hasOrdinalDigits = computed(() =>
  initialMartyriaStructureHasOrdinalDigits(draft.value.structure),
);
const basedOnStyle = computed(() =>
  draft.value.basedOn == null
    ? null
    : getBuiltInInitialMartyriaStyle(draft.value.basedOn),
);

const fontOptions = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);
const defaultFontOption = computed(() => ({
  label: t(($) => $.dialog.initialMartyriaStyles.defaultFont, {
    ns,
    font: resolveInitialMartyriaFontFamily(
      INITIAL_MARTYRIA_DEFAULT_FONT_FAMILY,
      props.pageSetup.neumeDefaultFontFamily,
    ),
  }),
  value: INITIAL_MARTYRIA_DEFAULT_FONT_FAMILY,
}));
const mainFontOptions = computed(() =>
  languageUsesGreekScript.value
    ? [defaultFontOption.value, ...fontOptions.value]
    : fontOptions.value,
);
const greekFontOptions = computed(() => [
  defaultFontOption.value,
  ...fontOptions.value,
]);
const resolvedMainFontFamily = computed(() =>
  resolveInitialMartyriaFontFamily(
    draft.value.appearance.mainFontFamily,
    props.pageSetup.neumeDefaultFontFamily,
  ),
);
const { fontStyleOptions, remapStyleForFamily } = useFontStyleControls(
  resolvedMainFontFamily,
  () => draft.value.appearance.fontStyle,
);

interface Strip {
  key: string;
  label: string;
  templateId: number;
  tiles: {
    key: string;
    structure: InitialMartyriaStructure;
    caption: string;
    current: boolean;
  }[];
}

/*
 * One row per requested structural axis. The model may correlate another
 * axis to keep the requested choice supported, such as changing cardinal
 * "Mode Six" to ordinal "Sixth Mode" when placement changes. Rows with a
 * single possible value have nothing to offer and are left out.
 */
const strips = computed<Strip[]>(() => {
  const structure = draft.value.structure;
  const strips: Strip[] = [
    {
      key: 'modeIdentificationMethod',
      label: t(($) => $.dialog.initialMartyriaStyles.modeIdentification, {
        ns,
      }),
      templateId: sampleTemplateId.value,
      tiles: getInitialMartyriaStructureVariations(
        structure,
        initialMartyriaModeIdentificationMethods,
        (current, modeIdentificationMethod) => ({
          ...current,
          modeIdentificationMethod,
        }),
      ).map((variation) => ({
        ...variation,
        caption: getInitialMartyriaModeIdentificationMethodLabel(
          t,
          variation.value,
        ),
      })),
    },
    {
      key: 'numeralForm',
      label: t(($) => $.dialog.initialMartyriaStyles.numberForm, { ns }),
      templateId: sampleTemplateId.value,
      tiles: getInitialMartyriaStructureVariations(
        structure,
        initialMartyriaNumeralForms,
        (current, form) => ({ ...current, ...form }),
      ).map((variation) => ({
        ...variation,
        caption: getInitialMartyriaNumeralFormLabel(t, variation.value),
      })),
    },
    {
      key: 'numeralQualifier',
      label: t(($) => $.dialog.initialMartyriaStyles.numberPlacement, { ns }),
      templateId: sampleTemplateId.value,
      tiles: getInitialMartyriaStructureVariations(
        structure,
        initialMartyriaNumeralQualifiers,
        (current, numeralQualifier) => ({ ...current, numeralQualifier }),
      ).map((variation) => ({
        ...variation,
        caption: getInitialMartyriaNumeralQualifierLabel(t, variation.value),
      })),
    },
    {
      key: 'modeNamingScheme',
      label: t(($) => $.dialog.initialMartyriaStyles.plagalWording, { ns }),
      templateId: plagalTemplateId,
      tiles: getInitialMartyriaStructureVariations(
        structure,
        initialMartyriaModeNamingSchemes,
        (current, modeNamingScheme) => ({ ...current, modeNamingScheme }),
      ).map((variation) => ({
        ...variation,
        caption: getInitialMartyriaModeNamingSchemeLabel(t, variation.value),
      })),
    },
  ];
  return strips.filter((strip) => strip.tiles.length > 1);
});

function withStructure(structure: InitialMartyriaStructure) {
  return withInitialMartyriaStyleStructure(draft.value, structure);
}

function update(changes: Partial<InitialMartyriaStyle>) {
  draft.value = { ...cloneInitialMartyriaStyle(draft.value), ...changes };
}

function setStructure(structure: InitialMartyriaStructure) {
  draft.value = withInitialMartyriaStyleStructure(draft.value, structure);
}

function setDisplayName(displayName: string) {
  update({ displayName });
}

function setLanguage(value: unknown) {
  const languageId = value as InitialMartyriaLanguageId;
  if (languageId === draft.value.structure.languageId) {
    return;
  }
  // Direction and the transliteration habit are language decisions; the
  // rest of the structure carries over where the new language supports it.
  const languageDefault =
    getDefaultBuiltInInitialMartyriaStyle(languageId).structure;
  setStructure(
    normalizeInitialMartyriaStructure({
      ...draft.value.structure,
      languageId,
      flowDirection: languageDefault.flowDirection,
      transliterateNoteNames: languageDefault.transliterateNoteNames,
    }),
  );
}

function setAppearance<K extends keyof InitialMartyriaStyleAppearance>(
  property: K,
  value: InitialMartyriaStyleAppearance[K],
) {
  update({ appearance: { ...draft.value.appearance, [property]: value } });
}

function setMainFontFamily(value: string) {
  const fontFamily = resolveInitialMartyriaFontFamily(
    value,
    props.pageSetup.neumeDefaultFontFamily,
  );
  update({
    appearance: {
      ...draft.value.appearance,
      mainFontFamily: value,
      fontStyle: remapStyleForFamily(fontFamily),
    },
  });
}

function setFontSize(value: number | null) {
  if (value != null) {
    setAppearance('fontSize', value);
  }
}

function setFontVariant(property: FontVariantProperty, value: string) {
  setAppearance(property, value === '' ? null : value);
}

function resetToBase() {
  if (basedOnStyle.value != null) {
    update({
      structure: { ...basedOnStyle.value.structure },
      appearance: { ...basedOnStyle.value.appearance },
    });
  }
}

function pronunciationFor(templateId: number) {
  const element = ModeKeyElement.createFromTemplate(
    modeKeyTemplates.find((item) => item.id === templateId)!,
  );
  return resolveInitialMartyriaStyle({
    context: getInitialMartyriaContext(element),
    resolvedStyle: resolveInitialMartyriaStyleAppearances(
      draft.value,
      props.pageSetup.neumeDefaultFontFamily,
    ),
    pageSetup: props.pageSetup,
  }).pronunciation;
}
</script>
