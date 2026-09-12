<template>
  <section class="flex h-full min-h-0 min-w-0 flex-col border">
    <div
      class="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b px-3 py-2"
    >
      <div class="flex min-w-0 items-center gap-2">
        <template v-if="builtIn">
          <PhLock
            class="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span class="truncate font-medium">{{ displayName }}</span>
          <Badge variant="outline">
            {{ $t(($) => $.dialog.initialMartyriaStyles.builtIn, { ns }) }}
          </Badge>
        </template>
        <template v-else>
          <FieldLabel for="initial-martyria-style-name" class="shrink-0">
            {{ $t(($) => $.dialog.initialMartyriaStyles.name, { ns }) }}
          </FieldLabel>
          <Input
            id="initial-martyria-style-name"
            ref="nameInput"
            class="max-w-72 min-w-0"
            :model-value="martyriaStyle.displayName"
            :placeholder="
              $t(($) => $.dialog.initialMartyriaStyles.styleNamePlaceholder, {
                ns,
              })
            "
            :aria-invalid="!nameValid"
            @update:model-value="update({ displayName: String($event) })"
          />
        </template>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <FieldLabel for="initial-martyria-style-language">
          {{ $t(($) => $.dialog.initialMartyriaStyles.language, { ns }) }}
        </FieldLabel>
        <Select
          :model-value="martyriaStyle.structure.languageId"
          @update:model-value="setLanguage"
        >
          <SelectTrigger id="initial-martyria-style-language" class="w-44">
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
      </div>

      <p
        class="col-span-2 mt-1 min-h-4 truncate text-xs"
        :class="nameValid ? 'text-muted-foreground' : 'text-destructive'"
      >
        <template v-if="!nameValid">
          {{ $t(($) => $.dialog.initialMartyriaStyles.nameInvalid, { ns }) }}
        </template>
        <template v-else-if="builtIn">
          {{ $t(($) => $.dialog.initialMartyriaStyles.builtInHint, { ns }) }}
        </template>
        <template v-else-if="basedOnStyle != null">
          {{
            $t(($) => $.dialog.initialMartyriaStyles.basedOn, {
              ns,
              name: getInitialMartyriaStyleDisplayName(basedOnStyle, t),
            })
          }}
        </template>
      </p>
    </div>

    <div
      class="flex shrink-0 items-center gap-4 border-b bg-muted/40 px-3 py-2"
    >
      <div
        class="flex min-w-0 flex-1 flex-wrap items-center justify-evenly gap-x-6 gap-y-2"
      >
        <div
          v-for="templateId in previewTemplateIds"
          :key="templateId"
          class="flex min-w-0 max-w-96 flex-1 flex-col items-center gap-0.5 overflow-hidden"
        >
          <InitialMartyriaSample
            :martyria-style="martyriaStyle"
            :paragraph-styles="paragraphStyles"
            :template-id="templateId"
            :page-setup="pageSetup"
            :max-font-size="32"
          />
          <span
            class="text-center text-xs text-muted-foreground"
            :lang="martyriaStyle.structure.languageId"
            aria-hidden="true"
          >
            {{ pronunciationFor(templateId) }}
          </span>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <FieldLabel for="initial-martyria-sample-mode">
          {{ $t(($) => $.dialog.initialMartyriaStyles.sampleMode, { ns }) }}
        </FieldLabel>
        <Select v-model="sampleModeValue">
          <SelectTrigger id="initial-martyria-sample-mode" class="w-40">
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
    </div>

    <Alert
      v-if="duplicateOfStyle != null"
      class="shrink-0 border-x-0 border-t-0"
    >
      <PhInfo />
      <AlertDescription class="flex flex-wrap items-center gap-x-3">
        <span>
          {{
            $t(($) => $.dialog.initialMartyriaStyles.duplicateOfStyle, {
              ns,
              name: getInitialMartyriaStyleDisplayName(duplicateOfStyle, t),
            })
          }}
        </span>
        <Button
          type="button"
          variant="link"
          size="sm"
          class="h-auto px-0"
          @click="$emit('use-style-instead', duplicateOfStyle)"
        >
          {{
            $t(($) => $.dialog.initialMartyriaStyles.useStyleInstead, {
              ns,
              name: getInitialMartyriaStyleDisplayName(duplicateOfStyle, t),
            })
          }}
        </Button>
      </AlertDescription>
    </Alert>

    <ScrollArea class="min-h-0 flex-1">
      <div class="space-y-4 p-3">
        <section
          v-for="strip in strips"
          :key="strip.key"
          :aria-label="strip.label"
        >
          <p
            class="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
          >
            {{ strip.label }}
          </p>
          <div
            class="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-1.5"
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
            :model-value="martyriaStyle.structure.transliterateNoteNames"
            @update:model-value="
              setStructure({
                ...martyriaStyle.structure,
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

        <Separator />

        <section
          :aria-label="
            $t(($) => $.dialog.initialMartyriaStyles.typography, { ns })
          "
        >
          <p
            class="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
          >
            {{ $t(($) => $.dialog.initialMartyriaStyles.typography, { ns }) }}
          </p>
          <div class="grid max-w-2xl gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel for="initial-martyria-paragraph-style">
                {{
                  $t(($) => $.toolbar.common.paragraphStyle, { ns: 'toolbar' })
                }}
              </FieldLabel>
              <ParagraphStyleSelect
                id="initial-martyria-paragraph-style"
                :model-value="martyriaStyle.paragraphStyleId"
                :paragraph-styles="paragraphStyles"
                @update:model-value="update({ paragraphStyleId: $event })"
              />
            </Field>

            <Field>
              <FieldLabel for="initial-martyria-greek-paragraph-style">
                {{
                  $t(
                    ($) => $.dialog.initialMartyriaStyles.greekParagraphStyle,
                    { ns },
                  )
                }}
              </FieldLabel>
              <ParagraphStyleSelect
                id="initial-martyria-greek-paragraph-style"
                :model-value="martyriaStyle.greekParagraphStyleId"
                :paragraph-styles="paragraphStyles"
                @update:model-value="update({ greekParagraphStyleId: $event })"
              />
            </Field>
          </div>

          <Field
            v-if="!languageUsesGreekScript && hasOrdinalDigits"
            orientation="horizontal"
            class="mt-3"
          >
            <Checkbox
              id="initial-martyria-ordinal-forms"
              :model-value="martyriaStyle.useOrdinalForms"
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
        </section>
      </div>
    </ScrollArea>
  </section>
</template>

<script setup lang="ts">
import { PhInfo, PhLock } from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import { computed, useTemplateRef } from 'vue';

import InitialMartyriaSample from '@/components/InitialMartyriaSample.vue';
import InitialMartyriaStyleTile from '@/components/InitialMartyriaStyleTile.vue';
import ParagraphStyleSelect from '@/components/ParagraphStyleSelect.vue';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import {
  getDefaultBuiltInInitialMartyriaStyle,
  getInitialMartyriaStyleDisplayName,
  isBuiltInInitialMartyriaStyleId,
} from '@/models/InitialMartyriaBuiltInStyles';
import {
  type InitialMartyriaStructureVariation,
  normalizeInitialMartyriaStructure,
} from '@/models/InitialMartyriaGrammar';
import { usesGreekScript } from '@/models/InitialMartyriaLexicon';
import { getInitialMartyriaStructureStrips } from '@/models/InitialMartyriaStructureStrips';
import {
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaStructure,
  initialMartyriaStructureHasOrdinalDigits,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import {
  getInitialMartyriaLanguageName,
  getInitialMartyriaModeIdentificationMethodLabel,
  getInitialMartyriaModeNamingSchemeLabel,
  getInitialMartyriaNumberingSystemLabel,
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

/**
 * The always-editable panel for one initial martyria style: who it is, what
 * it prints, and every axis of its structure as a strip of rendered tiles.
 * Changes are emitted rather than applied, so the dialog can decide where
 * they land: editing a built-in style edits a copy of it.
 */
const props = defineProps<{
  martyriaStyle: InitialMartyriaStyle;
  paragraphStyles: ParagraphStyle[];
  pageSetup: PageSetup;
  /** The built-in style this one was derived from, if any. */
  basedOnStyle: InitialMartyriaStyle | null;
  /** Another style that renders the same way, if any. */
  duplicateOfStyle: InitialMartyriaStyle | null;
  nameValid: boolean;
}>();

const emit = defineEmits<{
  'update:martyriaStyle': [style: InitialMartyriaStyle];
  'use-style-instead': [style: InitialMartyriaStyle];
}>();

const sampleMode = defineModel<number>('sampleMode', { required: true });

const { t } = useTranslation();

// The name input is rendered only for custom styles, so the ref is empty
// while a built-in style is selected.
const nameInput = useTemplateRef<{ $el: HTMLInputElement }>('nameInput');

const builtIn = computed(() =>
  isBuiltInInitialMartyriaStyleId(props.martyriaStyle.id),
);
const displayName = computed(() =>
  getInitialMartyriaStyleDisplayName(props.martyriaStyle, t),
);

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
  usesGreekScript(props.martyriaStyle.structure.languageId),
);
const hasOrdinalDigits = computed(() =>
  initialMartyriaStructureHasOrdinalDigits(props.martyriaStyle.structure),
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
function toStrip<T>(
  key: string,
  label: string,
  templateId: number,
  variations: InitialMartyriaStructureVariation<T>[],
  caption: (value: T) => string,
): Strip {
  return {
    key,
    label,
    templateId,
    tiles: variations.map((variation) => ({
      ...variation,
      caption: caption(variation.value),
      martyriaStyle: withStructure(variation.structure),
    })),
  };
}

/*
 * One row per structural axis, as the model offers them. The model may
 * correlate another axis to keep the requested choice supported, such as
 * changing cardinal "Mode Six" to ordinal "Sixth Mode" when placement
 * changes, so a tile always renders what choosing it produces.
 */
const strips = computed<Strip[]>(() =>
  getInitialMartyriaStructureStrips(props.martyriaStyle.structure).map(
    (strip) => {
      const numberForm = t(($) => $.dialog.initialMartyriaStyles.numberForm, {
        ns,
      });
      switch (strip.key) {
        case 'modeIdentificationMethod':
          return toStrip(
            strip.key,
            t(($) => $.dialog.initialMartyriaStyles.modeIdentification, { ns }),
            sampleTemplateId.value,
            strip.variations,
            (value) =>
              getInitialMartyriaModeIdentificationMethodLabel(t, value),
          );
        case 'numeralKind':
          return toStrip(
            strip.key,
            numberForm,
            sampleTemplateId.value,
            strip.variations,
            (value) => getInitialMartyriaNumeralKindLabel(t, value),
          );
        case 'numeralForm':
          return toStrip(
            strip.key,
            numberForm,
            sampleTemplateId.value,
            strip.variations,
            (value) => getInitialMartyriaNumeralFormLabel(t, value),
          );
        case 'numberingSystem':
          return toStrip(
            strip.key,
            t(($) => $.dialog.initialMartyriaStyles.digitForm, { ns }),
            sampleTemplateId.value,
            strip.variations,
            (value) => getInitialMartyriaNumberingSystemLabel(t, value),
          );
        case 'numeralQualifier':
          return toStrip(
            strip.key,
            t(($) => $.dialog.initialMartyriaStyles.numberPlacement, { ns }),
            sampleTemplateId.value,
            strip.variations,
            (value) => getInitialMartyriaNumeralQualifierLabel(t, value),
          );
        case 'modeNamingScheme':
          // The plagal first mode is where the wording differs.
          return toStrip(
            strip.key,
            t(($) => $.dialog.initialMartyriaStyles.plagalWording, { ns }),
            plagalTemplateId,
            strip.variations,
            (value) => getInitialMartyriaModeNamingSchemeLabel(t, value),
          );
      }
    },
  ),
);

function withStructure(structure: InitialMartyriaStructure) {
  return withInitialMartyriaStyleStructure(props.martyriaStyle, structure);
}

function update(changes: Partial<InitialMartyriaStyle>) {
  // A shallow merge: every caller that changes a nested value passes a new
  // object for it, so cloning here would only give the untouched values new
  // identities and invalidate computeds that did not change.
  emit('update:martyriaStyle', { ...props.martyriaStyle, ...changes });
}

function setStructure(structure: InitialMartyriaStructure) {
  emit('update:martyriaStyle', withStructure(structure));
}

function setLanguage(value: unknown) {
  const languageId = value as InitialMartyriaLanguageId;
  if (languageId === props.martyriaStyle.structure.languageId) {
    return;
  }
  // The transliteration habit is a language default; the rest of the
  // structure carries over where the new language supports it.
  const languageDefault =
    getDefaultBuiltInInitialMartyriaStyle(languageId).structure;
  setStructure(
    normalizeInitialMartyriaStructure({
      ...props.martyriaStyle.structure,
      languageId,
      transliterateNoteNames: languageDefault.transliterateNoteNames,
    }),
  );
}

function pronunciationFor(templateId: number) {
  return getSamplePronunciation(props.martyriaStyle.structure, templateId);
}

/** Select the name, so a newly created style can be named by typing. */
function focusName() {
  nameInput.value?.$el.select();
}

defineExpose({ focusName });
</script>
