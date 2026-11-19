<template>
  <section class="flex h-full min-h-0 min-w-0 flex-col border">
    <div
      class="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b px-3 py-2"
    >
      <div class="flex min-w-0 items-center gap-2">
        <FieldLabel for="initial-martyria-style-name" class="shrink-0">
          {{ $t(($) => $.dialog.initialMartyriaStyles.name, { ns }) }}
        </FieldLabel>
        <Input
          id="initial-martyria-style-name"
          ref="nameInput"
          class="max-w-72 min-w-0"
          :model-value="martyriaStyle.displayName"
          :placeholder="namePlaceholder"
          :aria-invalid="!nameValid"
          @update:model-value="update({ displayName: String($event) })"
        />
      </div>

      <Badge v-if="isDefault" variant="outline" class="shrink-0">
        {{ $t(($) => $.dialog.initialMartyriaStyles.defaultBadge, { ns }) }}
      </Badge>

      <p
        class="col-span-2 mt-1 flex min-h-5 flex-wrap items-center gap-x-2 text-xs"
        :class="nameValid ? 'text-muted-foreground' : 'text-destructive'"
      >
        <template v-if="!nameValid">
          {{ $t(($) => $.dialog.initialMartyriaStyles.nameInvalid, { ns }) }}
        </template>
        <template v-else-if="presetStatus != null">
          <span>{{ presetStatus.text }}</span>
          <Button
            v-if="presetStatus.canReset"
            type="button"
            variant="link"
            size="sm"
            class="h-auto px-0 text-xs"
            @click="resetToPreset"
          >
            {{
              $t(($) => $.dialog.initialMartyriaStyles.resetToPreset, { ns })
            }}
          </Button>
        </template>
      </p>
    </div>

    <div
      class="grid shrink-0 grid-cols-4 gap-x-4 gap-y-3 border-b bg-muted/40 px-3 py-3"
      :aria-label="
        $t(($) => $.dialog.initialMartyriaStyles.previewAllModes, { ns })
      "
      role="group"
    >
      <div
        v-for="sample in previewSamples"
        :key="sample.mode"
        class="flex min-w-0 flex-col items-center gap-1 overflow-hidden"
      >
        <InitialMartyriaSample
          :martyria-style="renderStyle"
          :paragraph-styles="paragraphStyles"
          :template-id="sample.templateId"
          :page-setup="pageSetup"
          :max-font-size="22"
        />
        <span class="text-center text-[11px] text-muted-foreground">
          {{ $t(sample.labelSelector, { ns: 'model' }) }}
        </span>
      </div>
    </div>

    <ScrollArea class="min-h-0 flex-1">
      <div class="space-y-5 p-3">
        <p v-if="usesMusicFontLettering" class="text-sm text-muted-foreground">
          {{ $t(($) => $.dialog.initialMartyriaStyles.classicHint, { ns }) }}
        </p>

        <section
          v-else
          :aria-label="
            $t(($) => $.dialog.initialMartyriaStyles.wording, { ns })
          "
        >
          <p :class="sectionHeadingClass">
            {{ $t(($) => $.dialog.initialMartyriaStyles.wording, { ns }) }}
          </p>
          <div class="mb-4 flex items-center gap-3">
            <FieldLabel for="initial-martyria-style-language" class="flex-none">
              {{ $t(($) => $.dialog.initialMartyriaStyles.language, { ns }) }}
            </FieldLabel>
            <Select
              :model-value="martyriaStyle.structure.languageId"
              @update:model-value="setLanguage"
            >
              <SelectTrigger id="initial-martyria-style-language" class="w-48">
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

          <div class="space-y-4">
            <section
              v-for="strip in strips"
              :key="strip.key"
              :aria-label="strip.label"
            >
              <p class="mb-1.5 text-xs font-medium">{{ strip.label }}</p>
              <div
                class="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-1.5"
              >
                <InitialMartyriaStyleTile
                  v-for="tile in strip.tiles"
                  :key="tile.key"
                  :martyria-style="tile.martyriaStyle"
                  :template-id="tileTemplateId"
                  :page-setup="pageSetup"
                  :paragraph-styles="paragraphStyles"
                  :selected="tile.current"
                  :caption="tile.caption"
                  @select="setStructure(tile.structure)"
                />
              </div>
            </section>
          </div>

          <div class="mt-4 space-y-3">
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

            <Field v-if="supportsOrdinalForms" orientation="horizontal">
              <Checkbox
                id="initial-martyria-ordinal-forms"
                :model-value="martyriaStyle.useOrdinalForms"
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
          </div>
        </section>

        <section
          :aria-label="
            $t(($) => $.dialog.initialMartyriaStyles.typography, { ns })
          "
        >
          <p :class="sectionHeadingClass">
            {{ $t(($) => $.dialog.initialMartyriaStyles.typography, { ns }) }}
          </p>
          <div class="grid max-w-2xl gap-3 sm:grid-cols-2">
            <Field v-if="paragraphStyleUsage.regular">
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

            <Field v-if="paragraphStyleUsage.greek">
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
              <FieldDescription>
                {{ greekParagraphStyleHint }}
              </FieldDescription>
            </Field>
          </div>
        </section>
      </div>
    </ScrollArea>
  </section>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import type { AcceptableValue } from 'reka-ui';
import { computed, useTemplateRef } from 'vue';

import InitialMartyriaSample from '@/components/InitialMartyriaSample.vue';
import InitialMartyriaStyleTile from '@/components/InitialMartyriaStyleTile.vue';
import ParagraphStyleSelect from '@/components/ParagraphStyleSelect.vue';
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
import {
  builtInInitialMartyriaStyles,
  getBuiltInInitialMartyriaStyle,
  getDefaultBuiltInInitialMartyriaStyle,
  getInitialMartyriaStyleDisplayName,
} from '@/models/InitialMartyriaBuiltInStyles';
import {
  initialMartyriaStructuresEqual,
  type InitialMartyriaStructureVariation,
  normalizeInitialMartyriaStructure,
} from '@/models/InitialMartyriaGrammar';
import { usesGreekScript } from '@/models/InitialMartyriaLexicon';
import {
  getInitialMartyriaParagraphStyleUsage,
  initialMartyriaStructureSupportsOrdinalForms,
} from '@/models/InitialMartyriaResolver';
import {
  getInitialMartyriaStructureStrips,
  type InitialMartyriaStructureStrip,
} from '@/models/InitialMartyriaStructureStrips';
import {
  INITIAL_MARTYRIA_LETTERINGS,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaStructure,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { deepEquals } from '@/utils/deepEquals';
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
  getSampleTemplateId,
  PLAGAL_SAMPLE_MODE,
  withInitialMartyriaStyleStructure,
} from './InitialMartyriaStylesDialog.shared';

const ns = 'dialog';

const sectionHeadingClass =
  'mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase';

/**
 * The editor for one of the score's initial martyria styles: its name, how
 * it reads in every mode, each axis of its wording as a strip of rendered
 * choices, and its typography. Changes are emitted rather than applied.
 */
const props = defineProps<{
  martyriaStyle: InitialMartyriaStyle;
  paragraphStyles: ParagraphStyle[];
  pageSetup: PageSetup;
  isDefault: boolean;
  nameValid: boolean;
}>();

const emit = defineEmits<{
  'update:martyriaStyle': [style: InitialMartyriaStyle];
}>();

const { t } = useTranslation();

const nameInput = useTemplateRef<{ $el: HTMLInputElement }>('nameInput');

const usesMusicFontLettering = computed(
  () => props.martyriaStyle.lettering === INITIAL_MARTYRIA_LETTERINGS.MusicFont,
);

const namePlaceholder = computed(() =>
  t(($) => $.dialog.initialMartyriaStyles.styleNamePlaceholder, { ns }),
);

function writesLike(a: InitialMartyriaStyle, b: InitialMartyriaStyle) {
  return (
    a.lettering === b.lettering &&
    initialMartyriaStructuresEqual(a.structure, b.structure)
  );
}

/*
 * How the style relates to the presets: still written like the one it was
 * made from, changed from it (which can be undone), or written like some
 * other preset.
 */
const presetStatus = computed(() => {
  const style = props.martyriaStyle;
  const preset =
    style.basedOn != null
      ? getBuiltInInitialMartyriaStyle(style.basedOn)
      : builtInInitialMartyriaStyles.find((other) => writesLike(style, other));
  if (preset == null) {
    return null;
  }
  const changed = !writesLike(style, preset);
  const name = getInitialMartyriaStyleDisplayName(preset, t);
  return {
    text: changed
      ? t(($) => $.dialog.initialMartyriaStyles.changedFromPreset, {
          ns,
          name,
        })
      : t(($) => $.dialog.initialMartyriaStyles.matchesPreset, { ns, name }),
    canReset: changed,
  };
});

// Offered only while the style differs from the preset it was made from.
function resetToPreset() {
  const preset = getBuiltInInitialMartyriaStyle(props.martyriaStyle.basedOn!);
  update({
    structure: { ...preset.structure },
    lettering: preset.lettering,
    useOrdinalForms: preset.useOrdinalForms,
  });
}

const previewSamples = getSampleModeOptions().map((option) => ({
  ...option,
  templateId: getSampleTemplateId(option.mode),
}));

const languageUsesGreekScript = computed(() =>
  usesGreekScript(props.martyriaStyle.structure.languageId),
);

// Only the paragraph styles that affect the rendering are offered.
const paragraphStyleUsage = computed(() =>
  getInitialMartyriaParagraphStyleUsage(props.martyriaStyle),
);

const greekParagraphStyleHint = computed(() => {
  if (usesMusicFontLettering.value) {
    return t(
      ($) => $.dialog.initialMartyriaStyles.neumeFontParagraphStyleHint,
      {
        ns,
      },
    );
  }
  // A transliterating style still sets its plagal abbreviation in Greek.
  return props.martyriaStyle.structure.transliterateNoteNames &&
    !languageUsesGreekScript.value
    ? t(($) => $.dialog.initialMartyriaStyles.greekParagraphStylePlagalHint, {
        ns,
      })
    : t(($) => $.dialog.initialMartyriaStyles.greekParagraphStyleHint, { ns });
});
const supportsOrdinalForms = computed(() =>
  initialMartyriaStructureSupportsOrdinalForms(props.martyriaStyle.structure),
);

// The plagal first mode shows every axis at work, including the plagal
// wording, so every tile renders it.
const tileTemplateId = getSampleTemplateId(PLAGAL_SAMPLE_MODE);

interface Strip {
  key: InitialMartyriaStructureStrip['key'];
  label: string;
  tiles: {
    key: string;
    caption: string;
    current: boolean;
    structure: InitialMartyriaStructure;
    martyriaStyle: InitialMartyriaStyle;
  }[];
}

/*
 * The name does not change how a style renders, so while only the name is
 * edited the previews keep the same style object and skip re-measuring.
 */
const renderStyle = computed<InitialMartyriaStyle>((previous) =>
  previous != null &&
  deepEquals(
    { ...previous, displayName: '' },
    { ...props.martyriaStyle, displayName: '' },
  )
    ? previous
    : props.martyriaStyle,
);

/*
 * The preview style of every tile is built here rather than in the template,
 * so a re-render that leaves the strips untouched does not hand each preview
 * a new style object to re-measure.
 */
function toRow<T>(
  key: InitialMartyriaStructureStrip['key'],
  label: string,
  variations: InitialMartyriaStructureVariation<T>[],
  caption: (value: T) => string,
): Strip {
  return {
    key,
    label,
    tiles: variations.map((variation) => ({
      key: variation.key,
      caption: caption(variation.value),
      current: variation.current,
      structure: variation.structure,
      martyriaStyle: withInitialMartyriaStyleStructure(
        renderStyle.value,
        variation.structure,
      ),
    })),
  };
}

/*
 * One strip per structural axis, as the model offers them. The model may
 * correlate another axis to keep a choice supported, so each tile renders
 * what choosing it produces.
 */
const strips = computed<Strip[]>(() =>
  getInitialMartyriaStructureStrips(renderStyle.value.structure).map(
    (strip) => {
      const numberForm = t(($) => $.dialog.initialMartyriaStyles.numberForm, {
        ns,
      });
      switch (strip.key) {
        case 'modeIdentificationMethod':
          return toRow(
            strip.key,
            t(($) => $.dialog.initialMartyriaStyles.modeIdentification, { ns }),
            strip.variations,
            (value) =>
              getInitialMartyriaModeIdentificationMethodLabel(t, value),
          );
        case 'numeralKind':
          return toRow(strip.key, numberForm, strip.variations, (value) =>
            getInitialMartyriaNumeralKindLabel(t, value),
          );
        case 'numeralForm':
          return toRow(strip.key, numberForm, strip.variations, (value) =>
            getInitialMartyriaNumeralFormLabel(t, value),
          );
        case 'numberingSystem':
          return toRow(
            strip.key,
            t(($) => $.dialog.initialMartyriaStyles.digitForm, { ns }),
            strip.variations,
            (value) => getInitialMartyriaNumberingSystemLabel(t, value),
          );
        case 'numeralQualifier':
          return toRow(
            strip.key,
            t(($) => $.dialog.initialMartyriaStyles.numberPlacement, { ns }),
            strip.variations,
            (value) => getInitialMartyriaNumeralQualifierLabel(t, value),
          );
        case 'modeNamingScheme':
          return toRow(
            strip.key,
            t(($) => $.dialog.initialMartyriaStyles.plagalWording, { ns }),
            strip.variations,
            (value) => getInitialMartyriaModeNamingSchemeLabel(t, value),
          );
      }
    },
  ),
);

function update(changes: Partial<InitialMartyriaStyle>) {
  emit('update:martyriaStyle', { ...props.martyriaStyle, ...changes });
}

function setStructure(structure: InitialMartyriaStructure) {
  emit(
    'update:martyriaStyle',
    withInitialMartyriaStyleStructure(props.martyriaStyle, structure),
  );
}

function setLanguage(value: AcceptableValue) {
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

/** Select the name, so a newly added style can be renamed by typing. */
function focusName() {
  nameInput.value?.$el.select();
}

defineExpose({ focusName });
</script>
