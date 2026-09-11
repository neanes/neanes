<template>
  <div
    class="grid min-h-0 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_17rem]"
  >
    <ScrollArea class="min-h-0">
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
                  ($) => $.dialog.initialMartyriaStyles.transliterateNoteNames,
                  { ns },
                )
              }}
            </FieldLabel>
            <FieldDescription>
              {{
                $t(
                  ($) =>
                    $.dialog.initialMartyriaStyles.transliterateNoteNamesHint,
                  { ns },
                )
              }}
            </FieldDescription>
          </FieldContent>
        </Field>
      </div>
    </ScrollArea>

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

        <Field>
          <FieldLabel for="initial-martyria-paragraph-style">
            {{
              $t(($) => $.toolbar.common.paragraphStyle, {
                ns: 'toolbar',
              })
            }}
          </FieldLabel>
          <ParagraphStyleSelect
            id="initial-martyria-paragraph-style"
            :model-value="draft.paragraphStyleId"
            :paragraph-styles="paragraphStyles"
            @update:model-value="update({ paragraphStyleId: $event })"
          />
        </Field>

        <Field>
          <FieldLabel for="initial-martyria-greek-paragraph-style">
            {{
              $t(($) => $.dialog.initialMartyriaStyles.greekParagraphStyle, {
                ns,
              })
            }}
          </FieldLabel>
          <ParagraphStyleSelect
            id="initial-martyria-greek-paragraph-style"
            :model-value="draft.greekParagraphStyleId"
            :paragraph-styles="paragraphStyles"
            @update:model-value="update({ greekParagraphStyleId: $event })"
          />
        </Field>

        <Field
          v-if="!languageUsesGreekScript && hasOrdinalDigits"
          orientation="horizontal"
        >
          <Checkbox
            id="initial-martyria-ordinal-forms"
            :model-value="draft.useOrdinalForms"
            @update:model-value="update({ useOrdinalForms: $event === true })"
          />
          <FieldLabel for="initial-martyria-ordinal-forms">
            {{
              $t(($) => $.dialog.initialMartyriaStyles.useOrdinalForms, {
                ns,
              })
            }}
          </FieldLabel>
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
import { computed } from 'vue';

import InitialMartyriaSample from '@/components/InitialMartyriaSample.vue';
import InitialMartyriaStyleTile from '@/components/InitialMartyriaStyleTile.vue';
import ParagraphStyleSelect from '@/components/ParagraphStyleSelect.vue';
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
import {
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaStructure,
  initialMartyriaStructureHasOrdinalDigits,
  type InitialMartyriaStyle,
  withInitialMartyriaModeIdentificationMethod,
  withInitialMartyriaNumeralForm,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
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

defineProps<{
  pageSetup: PageSetup;
  paragraphStyles: ParagraphStyle[];
  nameValid: boolean;
}>();

const draft = defineModel<InitialMartyriaStyle>({ required: true });
const sampleMode = defineModel<number>('sampleMode', { required: true });
const { t } = useTranslation();

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
const hasOrdinalDigits = computed(() =>
  initialMartyriaStructureHasOrdinalDigits(draft.value.structure),
);
const basedOnStyle = computed(() =>
  draft.value.basedOn == null
    ? null
    : getBuiltInInitialMartyriaStyle(draft.value.basedOn),
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
  return withInitialMartyriaStyleStructure(draft.value, structure);
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

function resetToBase() {
  if (basedOnStyle.value != null) {
    update({
      structure: { ...basedOnStyle.value.structure },
      paragraphStyleId: basedOnStyle.value.paragraphStyleId,
      greekParagraphStyleId: basedOnStyle.value.greekParagraphStyleId,
      useOrdinalForms: basedOnStyle.value.useOrdinalForms,
    });
  }
}

function pronunciationFor(templateId: number) {
  return getSamplePronunciation(draft.value.structure, templateId);
}
</script>
