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
                  :martyria-style="tile.martyriaStyle"
                  :template-id="strip.templateId"
                  :page-setup="pageSetup"
                  :paragraph-styles="paragraphStyles"
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
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="presentation" class="min-h-0 overflow-hidden">
        <ScrollArea class="h-full min-h-0">
          <div class="space-y-4 p-1 pr-3">
            <Field>
              <div class="mb-2 flex items-center justify-between gap-2">
                <FieldLabel for="initial-martyria-paragraph-style">
                  {{
                    $t(($) => $.toolbar.common.paragraphStyle, {
                      ns: 'toolbar',
                    })
                  }}
                </FieldLabel>
                <ParagraphStyleClearButton
                  :disabled="!hasTypographyOverrides"
                  @clear="clearTypographyOverrides"
                />
              </div>
              <ParagraphStyleSelect
                id="initial-martyria-paragraph-style"
                :model-value="draft.paragraphStyleId"
                :paragraph-styles="paragraphStyles"
                @update:model-value="update({ paragraphStyleId: $event })"
              />
            </Field>

            <Field>
              <div class="mb-2 flex items-center justify-between gap-2">
                <FieldLabel for="initial-martyria-main-font">
                  {{
                    languageUsesGreekScript
                      ? $t(($) => $.dialog.initialMartyriaStyles.textFont, {
                          ns,
                        })
                      : $t(($) => $.dialog.initialMartyriaStyles.mainFont, {
                          ns,
                        })
                  }}
                </FieldLabel>
                <ParagraphStyleClearButton
                  :disabled="draft.paragraphStyleOverrides.fontFamily == null"
                  @clear="clearOverride('fontFamily')"
                />
              </div>
              <FontCombobox
                id="initial-martyria-main-font"
                class="w-full max-w-full"
                :model-value="resolvedTypography.fontFamily"
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
                class="w-full max-w-full"
                :model-value="draft.greekFontFamily ?? SAME_AS_TEXT_FONT_VALUE"
                :options="greekFontOptions"
                @update:model-value="setGreekFontFamily"
              />
            </Field>

            <Field>
              <div class="mb-2 flex items-center justify-between gap-2">
                <FieldLabel for="initial-martyria-font-style">
                  {{ $t(($) => $.dialog.pageSetup.style, { ns }) }}
                </FieldLabel>
                <ParagraphStyleClearButton
                  :disabled="draft.paragraphStyleOverrides.fontStyle == null"
                  @clear="clearOverride('fontStyle')"
                />
              </div>
              <FontStyleSelect
                id="initial-martyria-font-style"
                class="w-full max-w-full"
                :model-value="resolvedTypography.fontStyle"
                :options="fontStyleOptions"
                :disabled="fontStyleOptions.length <= 1"
                @update:model-value="setOverride('fontStyle', $event)"
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel for="initial-martyria-font-size">
                {{ $t(($) => $.dialog.pageSetup.size, { ns }) }}
              </FieldLabel>
              <div class="flex items-center gap-1">
                <InputFontSize
                  id="initial-martyria-font-size"
                  :model-value="resolvedTypography.fontSize"
                  @update:model-value="setFontSize"
                />
                <ParagraphStyleClearButton
                  :disabled="draft.paragraphStyleOverrides.fontSize == null"
                  @clear="clearOverride('fontSize')"
                />
              </div>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel>
                {{ $t(($) => $.dialog.pageSetup.color, { ns }) }}
              </FieldLabel>
              <div class="flex items-center gap-1">
                <ColorPicker
                  :model-value="resolvedTypography.color"
                  @update:model-value="setOverride('color', $event)"
                />
                <ParagraphStyleClearButton
                  :disabled="draft.paragraphStyleOverrides.color == null"
                  @clear="clearOverride('color')"
                />
              </div>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel for="initial-martyria-outline">
                {{ $t(($) => $.dialog.pageSetup.outline, { ns }) }}
              </FieldLabel>
              <div class="flex items-center gap-1">
                <InputStrokeWidth
                  id="initial-martyria-outline"
                  :model-value="resolvedTypography.strokeWidth"
                  @update:model-value="setOverride('strokeWidth', $event)"
                />
                <ParagraphStyleClearButton
                  :disabled="draft.paragraphStyleOverrides.strokeWidth == null"
                  @clear="clearOverride('strokeWidth')"
                />
              </div>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel>
                {{ $t(($) => $.dialog.pageSetup.outlineColor, { ns }) }}
              </FieldLabel>
              <div class="flex items-center gap-1">
                <StrokeColorPicker
                  :model-value="resolvedTypography.strokeColor"
                  :preview-color="
                    strokeColorSameAsText
                      ? resolvedTypography.color
                      : resolvedTypography.strokeColor
                  "
                  :text-color="resolvedTypography.color"
                  :same-as-text="strokeColorSameAsText"
                  :label="$t(($) => $.dialog.pageSetup.outlineColor, { ns })"
                  :same-as-text-label="
                    $t(($) => $.dialog.pageSetup.sameAsText, { ns })
                  "
                  @update:model-value="setOverride('strokeColor', $event)"
                />
                <ParagraphStyleClearButton
                  :disabled="draft.paragraphStyleOverrides.strokeColor == null"
                  @clear="clearOverride('strokeColor')"
                />
              </div>
            </Field>

            <Field v-if="hasOrdinalDigits" orientation="horizontal">
              <Checkbox
                id="initial-martyria-ordinal-forms"
                :model-value="draft.useOrdinalForms"
                @update:model-value="
                  update({ useOrdinalForms: $event === true })
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
                <!--
                  The controls reflect the resolved typography (the draft's
                  overrides folded in); a change writes an explicit override
                  and clear restores inheritance from the paragraph style.
                -->
                <FontVariantFields
                  id-prefix="initial-martyria"
                  :caps="resolvedTypography.fontVariantCaps"
                  :numeric="resolvedTypography.fontVariantNumeric"
                  :ligatures="resolvedTypography.fontVariantLigatures"
                  :alternates="resolvedTypography.fontVariantAlternates"
                  :font-family="resolvedMainFontFamily"
                  :font-style="resolvedTypography.fontStyle"
                  :caps-clearable="
                    draft.paragraphStyleOverrides.fontVariantCaps != null
                  "
                  :numeric-clearable="
                    draft.paragraphStyleOverrides.fontVariantNumeric != null
                  "
                  :ligatures-clearable="
                    draft.paragraphStyleOverrides.fontVariantLigatures != null
                  "
                  :alternates-clearable="
                    draft.paragraphStyleOverrides.fontVariantAlternates != null
                  "
                  :show-ordinals="false"
                  @change="setFontVariant"
                  @clear="clearOverride"
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
                :martyria-style="draft"
                :paragraph-styles="paragraphStyles"
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
import { useTranslation } from 'i18next-vue';
import { computed, ref } from 'vue';

import ColorPicker from '@/components/ColorPicker.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InitialMartyriaSample from '@/components/InitialMartyriaSample.vue';
import InitialMartyriaStyleTile from '@/components/InitialMartyriaStyleTile.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import ParagraphStyleSelect from '@/components/ParagraphStyleSelect.vue';
import FontVariantFields from '@/components/properties/FontVariantFields.vue';
import ParagraphStyleClearButton from '@/components/properties/ParagraphStyleClearButton.vue';
import StrokeColorPicker from '@/components/StrokeColorPicker.vue';
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
import {
  getBuiltInInitialMartyriaStyle,
  getDefaultBuiltInInitialMartyriaStyle,
  getInitialMartyriaStyleDisplayName,
} from '@/models/InitialMartyriaBuiltInStyles';
import {
  getInitialMartyriaStructureVariations,
  initialMartyriaModeIdentificationMethods,
  initialMartyriaModeNamingSchemes,
  initialMartyriaNumeralForms,
  initialMartyriaNumeralKinds,
  initialMartyriaNumeralQualifiers,
  type InitialMartyriaStructureVariation,
  normalizeInitialMartyriaStructure,
} from '@/models/InitialMartyriaGrammar';
import { usesGreekScript } from '@/models/InitialMartyriaLexicon';
import { initialMartyriaStructureHasGreekText } from '@/models/InitialMartyriaResolver';
import {
  INITIAL_MARTYRIA_DEFAULT_FONT_FAMILY,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaStructure,
  initialMartyriaStructureHasOrdinalDigits,
  type InitialMartyriaStyle,
  type InitialMartyriaTypographyOverrides,
  resolveInitialMartyriaFontFamily,
  withInitialMartyriaModeIdentificationMethod,
  withInitialMartyriaNumeralForm,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import {
  type ParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import { fontCatalog } from '@/services/FontCatalog';
import type { FontVariantProperty } from '@/utils/fontVariants';
import { composeExplicitFontVariant } from '@/utils/fontVariants';
import {
  getInitialMartyriaLanguageName,
  getInitialMartyriaModeIdentificationMethodLabel,
  getInitialMartyriaModeNamingSchemeLabel,
  getInitialMartyriaNumeralFormLabel,
  getInitialMartyriaNumeralKindLabel,
  getInitialMartyriaNumeralQualifierLabel,
} from '@/utils/initialMartyriaLabels';

import {
  getSampleModeOptions,
  getSamplePronunciation,
  getSampleTemplateId,
  GRAVE_SAMPLE_MODE,
  PLAGAL_SAMPLE_MODE,
  withInitialMartyriaStyleStructure,
} from './InitialMartyriaStylesDialog.shared';

const ns = 'dialog';

const props = defineProps<{
  pageSetup: PageSetup;
  paragraphStyles: ParagraphStyle[];
  fonts: string[];
  nameValid: boolean;
}>();

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

// The draft's typography with its overrides folded in; the controls bind to
// these values. The font family may still be the 'default' sentinel here.
const resolvedTypography = computed(() =>
  resolveParagraphStyle(
    props.paragraphStyles,
    draft.value.paragraphStyleId,
    draft.value.paragraphStyleOverrides,
  ),
);
// The paragraph style's own values, used to decide whether "no features"
// needs an explicit 'normal' or can clear back to inheritance.
const inheritedTypography = computed(() =>
  resolveParagraphStyle(props.paragraphStyles, draft.value.paragraphStyleId),
);
const hasTypographyOverrides = computed(() =>
  Object.values(draft.value.paragraphStyleOverrides).some(
    (value) => value !== undefined,
  ),
);
const strokeColorSameAsText = computed(
  () => resolvedTypography.value.strokeColor === 'currentcolor',
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
const resolvedMainFontFamily = computed(() =>
  resolveInitialMartyriaFontFamily(
    resolvedTypography.value.fontFamily,
    props.pageSetup.neumeDefaultFontFamily,
  ),
);
// The combobox takes strings, so a null Greek font (follow the text font)
// is shown through a sentinel value that no font is named after.
const SAME_AS_TEXT_FONT_VALUE = '__same-as-text-font__';
const sameAsTextFontOption = computed(() => ({
  label: t(($) => $.dialog.initialMartyriaStyles.sameAsTextFont, {
    ns,
    font: resolvedMainFontFamily.value,
  }),
  value: SAME_AS_TEXT_FONT_VALUE,
}));
const greekFontOptions = computed(() => [
  sameAsTextFontOption.value,
  defaultFontOption.value,
  ...fontOptions.value,
]);
const { fontStyleOptions, remapStyleForFamily } = useFontStyleControls(
  resolvedMainFontFamily,
  () => resolvedTypography.value.fontStyle,
);

interface Strip {
  key: string;
  label: string;
  templateId: number;
  tiles: {
    key: string;
    structure: InitialMartyriaStructure;
    martyriaStyle: InitialMartyriaStyle;
    caption: string;
    current: boolean;
  }[];
}

/*
 * The preview style of every tile is built here rather than in the template,
 * so a re-render that leaves the strips untouched (typing in the name field,
 * say) does not hand each preview a new style object to re-measure.
 */
function toTiles<T>(
  variations: InitialMartyriaStructureVariation<T>[],
  caption: (value: T) => string,
) {
  return variations.map((variation) => ({
    ...variation,
    caption: caption(variation.value),
    martyriaStyle: withStructure(variation.structure),
  }));
}

/*
 * One row per requested structural axis. The model may correlate another
 * axis to keep the requested choice supported, such as changing cardinal
 * "Mode Six" to ordinal "Sixth Mode" when placement changes. Rows with a
 * single possible value have nothing to offer and are left out.
 */
const strips = computed<Strip[]>(() => {
  const structure = draft.value.structure;
  const numeralFormStrip: Strip =
    structure.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
      ? {
          key: 'numeralKind',
          label: t(($) => $.dialog.initialMartyriaStyles.numberForm, { ns }),
          templateId: sampleTemplateId.value,
          tiles: toTiles(
            getInitialMartyriaStructureVariations(
              structure,
              initialMartyriaNumeralKinds,
              (current, numeralKind) => ({ ...current, numeralKind }),
            ),
            (value) => getInitialMartyriaNumeralKindLabel(t, value),
          ),
        }
      : {
          key: 'numeralForm',
          label: t(($) => $.dialog.initialMartyriaStyles.numberForm, { ns }),
          templateId: sampleTemplateId.value,
          tiles: toTiles(
            getInitialMartyriaStructureVariations(
              structure,
              initialMartyriaNumeralForms,
              withInitialMartyriaNumeralForm,
            ),
            (value) => getInitialMartyriaNumeralFormLabel(t, value),
          ),
        };
  const strips: Strip[] = [
    {
      key: 'modeIdentificationMethod',
      label: t(($) => $.dialog.initialMartyriaStyles.modeIdentification, {
        ns,
      }),
      templateId: sampleTemplateId.value,
      tiles: toTiles(
        getInitialMartyriaStructureVariations(
          structure,
          initialMartyriaModeIdentificationMethods,
          withInitialMartyriaModeIdentificationMethod,
        ),
        (value) => getInitialMartyriaModeIdentificationMethodLabel(t, value),
      ),
    },
    numeralFormStrip,
    {
      key: 'numeralQualifier',
      label: t(($) => $.dialog.initialMartyriaStyles.numberPlacement, { ns }),
      templateId: sampleTemplateId.value,
      tiles: toTiles(
        getInitialMartyriaStructureVariations(
          structure,
          initialMartyriaNumeralQualifiers,
          (current, numeralQualifier) => ({ ...current, numeralQualifier }),
        ),
        (value) => getInitialMartyriaNumeralQualifierLabel(t, value),
      ),
    },
    {
      key: 'modeNamingScheme',
      label: t(($) => $.dialog.initialMartyriaStyles.plagalWording, { ns }),
      templateId: plagalTemplateId,
      tiles: toTiles(
        getInitialMartyriaStructureVariations(
          structure,
          initialMartyriaModeNamingSchemes,
          (current, modeNamingScheme) => ({ ...current, modeNamingScheme }),
        ),
        (value) => getInitialMartyriaModeNamingSchemeLabel(t, value),
      ),
    },
  ];
  return strips.filter((strip) => strip.tiles.length > 1);
});

function withStructure(structure: InitialMartyriaStructure) {
  return withInitialMartyriaStyleStructure(
    draft.value,
    structure,
    props.paragraphStyles,
  );
}

function update(changes: Partial<InitialMartyriaStyle>) {
  // A shallow merge: every caller that changes a nested value passes a new
  // object for it, so cloning here would only give the untouched values new
  // identities and invalidate computeds that did not change.
  draft.value = { ...draft.value, ...changes };
}

function setStructure(structure: InitialMartyriaStructure) {
  draft.value = withStructure(structure);
}

function setDisplayName(displayName: string) {
  update({ displayName });
}

function setLanguage(value: unknown) {
  const languageId = value as InitialMartyriaLanguageId;
  if (languageId === draft.value.structure.languageId) {
    return;
  }
  // The transliteration habit is a language default; the rest of the
  // structure carries over where the new language supports it.
  const languageDefault =
    getDefaultBuiltInInitialMartyriaStyle(languageId).structure;
  setStructure(
    normalizeInitialMartyriaStructure({
      ...draft.value.structure,
      languageId,
      transliterateNoteNames: languageDefault.transliterateNoteNames,
    }),
  );
}

function setOverride<K extends keyof InitialMartyriaTypographyOverrides>(
  property: K,
  value: InitialMartyriaTypographyOverrides[K],
) {
  update({
    paragraphStyleOverrides: {
      ...draft.value.paragraphStyleOverrides,
      [property]: value,
    },
  });
}

function clearOverride(property: keyof InitialMartyriaTypographyOverrides) {
  const paragraphStyleOverrides = { ...draft.value.paragraphStyleOverrides };
  delete paragraphStyleOverrides[property];
  update({ paragraphStyleOverrides });
}

function clearTypographyOverrides() {
  update({ paragraphStyleOverrides: {} });
}

function setMainFontFamily(value: string) {
  const fontFamily = resolveInitialMartyriaFontFamily(
    value,
    props.pageSetup.neumeDefaultFontFamily,
  );
  update({
    paragraphStyleOverrides: {
      ...draft.value.paragraphStyleOverrides,
      fontFamily: value,
      fontStyle: remapStyleForFamily(fontFamily),
    },
  });
}

function setGreekFontFamily(value: string) {
  update({
    greekFontFamily: value === SAME_AS_TEXT_FONT_VALUE ? null : value,
  });
}

function setFontSize(value: number | null) {
  if (value != null) {
    setOverride('fontSize', value);
  }
}

function setFontVariant(property: FontVariantProperty, value: string) {
  setOverride(
    property,
    composeExplicitFontVariant(value, inheritedTypography.value[property]),
  );
}

function resetToBase() {
  if (basedOnStyle.value != null) {
    update({
      structure: { ...basedOnStyle.value.structure },
      paragraphStyleId: basedOnStyle.value.paragraphStyleId,
      paragraphStyleOverrides: {
        ...basedOnStyle.value.paragraphStyleOverrides,
      },
      greekFontFamily: basedOnStyle.value.greekFontFamily,
      useOrdinalForms: basedOnStyle.value.useOrdinalForms,
    });
  }
}

function pronunciationFor(templateId: number) {
  return getSamplePronunciation(draft.value.structure, templateId);
}
</script>
