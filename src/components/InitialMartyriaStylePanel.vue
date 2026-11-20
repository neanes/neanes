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

          <div class="mb-4 flex items-center gap-3">
            <FieldLabel
              id="initial-martyria-mode-identification"
              class="flex-none"
            >
              {{
                $t(($) => $.dialog.initialMartyriaStyles.modeIdentification, {
                  ns,
                })
              }}
            </FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              aria-labelledby="initial-martyria-mode-identification"
              :model-value="martyriaStyle.structure.modeIdentificationMethod"
              @update:model-value="setModeIdentificationMethod"
            >
              <ToggleGroupItem
                v-for="method in initialMartyriaModeIdentificationMethods"
                :key="method"
                :value="method"
              >
                {{ getInitialMartyriaModeIdentificationMethodLabel(t, method) }}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <!--
            Every printed form the language allows, all at once. A row sets
            the whole wording, so choosing one never changes another.
          -->
          <div
            role="group"
            :aria-label="
              $t(($) => $.dialog.initialMartyriaStyles.wordingChoices, { ns })
            "
            class="border"
          >
            <div
              class="grid items-end gap-x-3 border-b bg-muted/40 px-3 py-1.5"
              :style="wordingGridStyle"
              aria-hidden="true"
            >
              <span
                v-for="sample in wordingSamples"
                :key="sample.mode"
                class="truncate text-center text-[11px] text-muted-foreground"
              >
                {{ $t(sample.labelSelector, { ns: 'model' }) }}
              </span>
            </div>
            <template v-for="group in wordingGroups" :key="group.key">
              <p
                v-if="group.label != null"
                class="border-b bg-muted/20 px-3 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {{ group.label }}
              </p>
              <div
                v-for="row in group.rows"
                :key="row.key"
                class="border-b last:border-b-0"
                :class="
                  row.selected &&
                  'bg-accent/50 outline-2 -outline-offset-2 outline-foreground'
                "
              >
                <button
                  type="button"
                  class="grid w-full items-center gap-x-3 px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                  :style="wordingGridStyle"
                  :aria-pressed="row.selected"
                  @click="selectRow(row)"
                >
                  <span
                    v-for="sample in wordingSamples"
                    :key="sample.mode"
                    class="flex min-h-8 min-w-0 items-center justify-center"
                  >
                    <InitialMartyriaSample
                      :martyria-style="row.martyriaStyle"
                      :paragraph-styles="paragraphStyles"
                      :template-id="sample.templateId"
                      :page-setup="pageSetup"
                      :max-font-size="18"
                    />
                  </span>
                  <!-- Under the previews, so it never moves them. -->
                  <span
                    v-if="row.presets.length > 0"
                    class="col-span-full mt-1 text-center text-[11px] text-muted-foreground"
                  >
                    {{ row.presets.join(', ') }}
                  </span>
                </button>
              </div>
            </template>
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

          <!--
            Shown by language alone and always available, so it can be set
            before choosing a wording with ordinal digits.
          -->
          <Field
            v-if="offersOrdinalForms"
            orientation="horizontal"
            class="mt-3"
          >
            <Checkbox
              id="initial-martyria-ordinal-forms"
              :model-value="martyriaStyle.useOrdinalForms"
              @update:model-value="update({ useOrdinalForms: $event === true })"
            />
            <FieldContent>
              <FieldLabel for="initial-martyria-ordinal-forms">
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.useOrdinalForms, {
                    ns,
                  })
                }}
              </FieldLabel>
              <FieldDescription>
                {{
                  $t(
                    ($) => $.dialog.initialMartyriaStyles.useOrdinalFormsHint,
                    {
                      ns,
                    },
                  )
                }}
              </FieldDescription>
            </FieldContent>
          </Field>
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  builtInInitialMartyriaStyles,
  getBuiltInInitialMartyriaStyle,
  getDefaultBuiltInInitialMartyriaStyle,
  getInitialMartyriaStyleDisplayName,
} from '@/models/InitialMartyriaBuiltInStyles';
import {
  enumerateInitialMartyriaStructures,
  initialMartyriaModeIdentificationMethods,
  initialMartyriaStructuresEqual,
  normalizeInitialMartyriaStructure,
  withSupportedInitialMartyriaModeIdentificationMethod,
} from '@/models/InitialMartyriaGrammar';
import {
  hasRaisableOrdinalSuffix,
  usesGreekScript,
} from '@/models/InitialMartyriaLexicon';
import {
  getInitialMartyriaParagraphStyleUsage,
  getInitialMartyriaStructureKey,
  modeKeyModes,
} from '@/models/InitialMartyriaResolver';
import {
  INITIAL_MARTYRIA_LETTERINGS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaModeIdentificationMethod,
  type InitialMartyriaStructure,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { deepEquals } from '@/utils/deepEquals';
import {
  getInitialMartyriaLanguageName,
  getInitialMartyriaModeIdentificationMethodLabel,
  getInitialMartyriaNumeralStyleLabel,
} from '@/utils/initialMartyriaLabels';

import {
  getSample,
  getWordingSampleModes,
  withInitialMartyriaStyleStructure,
} from './InitialMartyriaStylesDialog.shared';

const ns = 'dialog';

const sectionHeadingClass =
  'mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase';

/**
 * The editor for one of the score's initial martyria styles: its name, how
 * it reads in every mode, every wording its language allows as a list of
 * rendered choices, and its typography. Changes are emitted rather than
 * applied.
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

const previewSamples = modeKeyModes.map(getSample);

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
// Only text lettering in a language whose digit ordinals have a raisable
// suffix can use ordinal forms at all.
const offersOrdinalForms = computed(
  () =>
    !usesMusicFontLettering.value &&
    hasRaisableOrdinalSuffix(props.martyriaStyle.structure.languageId),
);

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
 * The list depends only on these three choices. Keeping the same object
 * while they are unchanged stops other edits, such as a paragraph style
 * switch, from rebuilding the list and choosing its sample modes again.
 */
const wordingBase = computed<
  Pick<
    InitialMartyriaStructure,
    'languageId' | 'modeIdentificationMethod' | 'transliterateNoteNames'
  >
>((previous) => {
  const { languageId, modeIdentificationMethod, transliterateNoteNames } =
    renderStyle.value.structure;
  const next = { languageId, modeIdentificationMethod, transliterateNoteNames };
  return previous != null && deepEquals(previous, next) ? previous : next;
});

const wordings = computed(() =>
  enumerateInitialMartyriaStructures(wordingBase.value),
);

/*
 * The modes every row is previewed in: enough of them to tell every
 * wording apart, so no two rows ever look the same.
 */
const wordingSamples = computed(() =>
  getWordingSampleModes(wordings.value.map((wording) => wording.structure)).map(
    getSample,
  ),
);

const wordingGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${wordingSamples.value.length}, minmax(0, 1fr))`,
}));

/*
 * The built-in presets written in each wording, by structure key. The
 * style's transliteration is applied, since that is a choice made apart
 * from the wording.
 */
const presetNamesByKey = computed(() => {
  const structure = wordingBase.value;
  const names = new Map<string, string[]>();
  for (const preset of builtInInitialMartyriaStyles) {
    if (
      preset.lettering !== INITIAL_MARTYRIA_LETTERINGS.Text ||
      preset.structure.languageId !== structure.languageId
    ) {
      continue;
    }
    const key = getInitialMartyriaStructureKey({
      ...preset.structure,
      transliterateNoteNames: structure.transliterateNoteNames,
    });
    names.set(key, [
      ...(names.get(key) ?? []),
      getInitialMartyriaStyleDisplayName(preset, t),
    ]);
  }
  return names;
});

interface WordingRow {
  key: string;
  selected: boolean;
  structure: InitialMartyriaStructure;
  martyriaStyle: InitialMartyriaStyle;
  presets: string[];
}

/*
 * One row per printed wording. A row keeps its previous preview style
 * whenever the new one is equal, so selecting a row re-measures only the
 * previews whose rendering actually changed.
 */
const wordingRows = computed<WordingRow[]>((previous) => {
  const previousStyles = new Map(
    (previous ?? []).map((row) => [row.key, row.martyriaStyle]),
  );
  const currentKey = getInitialMartyriaStructureKey(
    renderStyle.value.structure,
  );
  return wordings.value.map(({ structure, key }) => {
    const martyriaStyle = withInitialMartyriaStyleStructure(
      renderStyle.value,
      structure,
    );
    const previousStyle = previousStyles.get(key);
    return {
      key,
      selected: key === currentKey,
      structure,
      martyriaStyle:
        previousStyle != null && deepEquals(previousStyle, martyriaStyle)
          ? previousStyle
          : martyriaStyle,
      presets: presetNamesByKey.value.get(key) ?? [],
    };
  });
});

/*
 * Rows printing numbers are grouped by how the number is written, which is
 * the first thing a reader tells them apart by. A sign prints no number,
 * and a single group needs no heading.
 */
const wordingGroups = computed(() => {
  const groups: { key: string; label: string | null; rows: WordingRow[] }[] =
    [];
  for (const row of wordingRows.value) {
    const structure = row.structure;
    const isSign =
      structure.modeIdentificationMethod ===
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign;
    const key = isSign ? 'sign' : structure.numeralStyle;
    const group = groups.find((other) => other.key === key);
    if (group != null) {
      group.rows.push(row);
    } else {
      groups.push({
        key,
        label: isSign
          ? null
          : getInitialMartyriaNumeralStyleLabel(t, structure.numeralStyle),
        rows: [row],
      });
    }
  }
  if (groups.length === 1) {
    groups[0].label = null;
  }
  return groups;
});

function setModeIdentificationMethod(value: AcceptableValue) {
  // A single toggle group reports an empty value when its item is pressed
  // again; the method stays as it is.
  if (
    !value ||
    value === props.martyriaStyle.structure.modeIdentificationMethod
  ) {
    return;
  }
  setStructure(
    withSupportedInitialMartyriaModeIdentificationMethod(
      props.martyriaStyle.structure,
      value as InitialMartyriaModeIdentificationMethod,
    ),
  );
}

/*
 * The selected row already prints as the style does. Choosing it again
 * would only replace the settings a sign keeps for a later switch back to
 * text, so it does nothing.
 */
function selectRow(row: WordingRow) {
  if (!row.selected) {
    setStructure(row.structure);
  }
}

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
