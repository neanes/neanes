<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="grid h-[42rem] max-h-[calc(100dvh-4rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-[60rem]"
      @close-auto-focus="emit('close-auto-focus', $event)"
    >
      <DialogHeader>
        <DialogTitle>
          <template v-if="editingStyle == null">
            {{
              $t(($) => $.dialog.initialMartyriaStyles.addStyleTitle, { ns })
            }}
          </template>
          <template v-else>
            {{
              $t(($) => $.dialog.initialMartyriaStyles.changeWordingTitle, {
                ns,
              })
            }}
          </template>
        </DialogTitle>
        <DialogDescription>
          <template v-if="editingStyle == null">
            {{
              $t(($) => $.dialog.initialMartyriaStyles.addStyleDescription, {
                ns,
              })
            }}
          </template>
          <template v-else>
            {{
              $t(
                ($) => $.dialog.initialMartyriaStyles.changeWordingDescription,
                { ns },
              )
            }}
          </template>
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <FieldLabel for="initial-martyria-picker-language" class="flex-none">
            {{ $t(($) => $.dialog.initialMartyriaStyles.language, { ns }) }}
          </FieldLabel>
          <Select :model-value="languageId" @update:model-value="setLanguage">
            <SelectTrigger id="initial-martyria-picker-language" class="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="id in orderedLanguageIds"
                :key="id"
                :value="id"
              >
                {{ getInitialMartyriaLanguageName(t, id) }}
              </SelectItem>
            </SelectContent>
          </Select>

          <ToggleGroup
            v-if="labelChoices.length > 1"
            type="single"
            variant="outline"
            :model-value="labelChoiceValue"
            :aria-label="
              $t(($) => $.dialog.initialMartyriaStyles.labelVariant, { ns })
            "
            @update:model-value="setLabelChoice"
          >
            <ToggleGroupItem
              v-for="choice in labelChoices"
              :key="choice.value"
              :value="choice.value"
            >
              {{ choice.label }}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Field
          v-if="!languageUsesGreekScript"
          orientation="horizontal"
          class="w-auto"
        >
          <Switch
            id="initial-martyria-picker-transliterate"
            v-model="transliterateNoteNames"
          />
          <FieldContent>
            <FieldLabel for="initial-martyria-picker-transliterate">
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

      <ScrollArea class="min-h-0 border">
        <div
          role="group"
          :aria-label="
            $t(($) => $.dialog.initialMartyriaStyles.wordingChoices, { ns })
          "
        >
          <div
            class="sticky top-0 z-10 grid items-end gap-x-3 border-b bg-muted px-3 py-1.5"
            :style="{
              gridTemplateColumns: `repeat(${samples.length}, minmax(0, 1fr))`,
            }"
            aria-hidden="true"
          >
            <span
              v-for="sample in samples"
              :key="sample.mode"
              class="truncate text-center text-[11px] text-muted-foreground"
            >
              {{ $t(sample.labelSelector, { ns: 'model' }) }}
            </span>
          </div>

          <template v-for="group in commonGroups" :key="group.key">
            <p :class="groupHeadingClass">{{ group.label }}</p>
            <InitialMartyriaWordingRow
              v-for="row in group.rows"
              :key="row.key"
              v-bind="rowProps(row)"
              @select="choose(row)"
            />
          </template>

          <Collapsible v-if="moreGroups.length > 0" v-model:open="moreOpen">
            <CollapsibleTrigger as-child>
              <button
                type="button"
                class="flex w-full items-center gap-1.5 border-b bg-muted/40 px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
              >
                <PhCaretRight
                  class="size-3.5 transition-transform"
                  :class="moreOpen && 'rotate-90'"
                />
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.moreWordings, {
                    ns,
                  })
                }}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <template v-for="group in moreGroups" :key="group.key">
                <p :class="groupHeadingClass">{{ group.label }}</p>
                <InitialMartyriaWordingRow
                  v-for="row in group.rows"
                  :key="row.key"
                  v-bind="rowProps(row)"
                  @select="choose(row)"
                />
              </template>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="outline">
            {{ $t(($) => $.dialog.common.cancel, { ns }) }}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { PhCaretRight } from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import type { AcceptableValue } from 'reka-ui';
import { computed, ref, watch } from 'vue';

import InitialMartyriaWordingRow from '@/components/InitialMartyriaWordingRow.vue';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  commonInitialMartyriaWordings,
  createInitialMartyriaStyleFromWording,
  DEFAULT_INITIAL_MARTYRIA_WORDING_NAME,
  getCommonInitialMartyriaWording,
  getCommonInitialMartyriaWordingCaptionSelector,
  getDefaultInitialMartyriaTransliteration,
} from '@/models/InitialMartyriaCommonWordings';
import {
  enumerateInitialMartyriaStructures,
  initialMartyriaModeIdentificationMethods,
} from '@/models/InitialMartyriaGrammar';
import {
  getInitialMartyriaLabel,
  getInitialMartyriaLabelVariants,
  usesGreekScript,
} from '@/models/InitialMartyriaLexicon';
import {
  getInitialMartyriaWordingKey,
  getSupportedInitialMartyriaLettering,
} from '@/models/InitialMartyriaResolver';
import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_LETTERINGS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  type InitialMartyriaLabelVariant,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaLettering,
  type InitialMartyriaStructure,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import {
  getInitialMartyriaLanguageName,
  getInitialMartyriaModeIdentificationMethodLabel,
} from '@/utils/initialMartyriaLabels';
import { isOneOf } from '@/utils/isOneOf';

import {
  getSample,
  getWordingSampleModes,
} from './InitialMartyriaStylesDialog.shared';

const ns = 'dialog';

const groupHeadingClass =
  'border-b bg-muted/20 px-3 py-1 text-[11px] font-medium text-muted-foreground';

/**
 * Chooses how an initial martyria reads: a language, its word for the mode
 * where it has more than one, whether its note names are transliterated, and
 * one of the wordings the language allows. The common wordings come first;
 * every other wording is kept in a collapsed section. Each is previewed in
 * enough modes to tell it apart from the rest.
 */
const props = defineProps<{
  paragraphStyles: ParagraphStyle[];
  pageSetup: PageSetup;
  /** The style whose wording is changed, or null to add a style. */
  editingStyle: InitialMartyriaStyle | null;
  /** The language shown first when adding a style. */
  preferredLanguageId: InitialMartyriaLanguageId;
  /** The wordings of the document's other styles. */
  usedWordingKeys: Set<string>;
}>();

const emit = defineEmits<{
  select: [
    wording: {
      structure: InitialMartyriaStructure;
      lettering: InitialMartyriaLettering;
    },
  ];
  'close-auto-focus': [event: Event];
}>();

const open = defineModel<boolean>('open', { required: true });

const { t, i18next } = useTranslation();

const languageId = ref<InitialMartyriaLanguageId>(
  INITIAL_MARTYRIA_LANGUAGE_IDS.English,
);
const labelVariant = ref<InitialMartyriaLabelVariant | undefined>();
const transliterateNoteNames = ref(false);
const moreOpen = ref(false);

const languageUsesGreekScript = computed(() =>
  usesGreekScript(languageId.value),
);

/*
 * The toggle group cannot hold an absent value, so the language's usual
 * word goes by a value no variant uses.
 */
const usualLabelValue = 'usual';

/** The words the language has for the mode, each shown as itself. */
const labelChoices = computed(() =>
  [undefined, ...getInitialMartyriaLabelVariants(languageId.value)].map(
    (variant) => ({
      value: variant ?? usualLabelValue,
      label: getInitialMartyriaLabel({
        languageId: languageId.value,
        labelVariant: variant,
      }),
    }),
  ),
);

const labelChoiceValue = computed(() => labelVariant.value ?? usualLabelValue);

function setLabelChoice(value: AcceptableValue | AcceptableValue[]) {
  // Clicking the pressed item deselects it; the choice stays.
  if (value === usualLabelValue) {
    labelVariant.value = undefined;
  } else if (
    isOneOf(getInitialMartyriaLabelVariants(languageId.value), value)
  ) {
    labelVariant.value = value;
  } else {
    return;
  }
  moreOpen.value = false;
}

/** The choices above, as set on every wording the picker lists. */
const chosenAxes = computed(() => ({
  languageId: languageId.value,
  labelVariant: labelVariant.value,
  transliterateNoteNames: transliterateNoteNames.value,
}));

const orderedLanguageIds = computed(() => [
  props.preferredLanguageId,
  ...initialMartyriaLanguageIds.filter(
    (id) => id !== props.preferredLanguageId,
  ),
]);

function setLanguage(value: AcceptableValue) {
  const id = value as InitialMartyriaLanguageId;
  if (id === languageId.value) {
    return;
  }
  languageId.value = id;
  labelVariant.value = undefined;
  transliterateNoteNames.value = getDefaultInitialMartyriaTransliteration(id);
  moreOpen.value = false;
}

/*
 * Previews take the typography of the style being changed, so they show
 * what it will look like; a new style starts from the default typography.
 */
const previewBase = computed(
  () =>
    props.editingStyle ??
    createInitialMartyriaStyleFromWording(
      getCommonInitialMartyriaWording(DEFAULT_INITIAL_MARTYRIA_WORDING_NAME),
      '',
    ),
);

const currentKey = computed(() =>
  props.editingStyle == null
    ? null
    : getInitialMartyriaWordingKey(props.editingStyle),
);

/*
 * A row holds only the wording; its preview style is built by the row
 * itself, so rows in the collapsed section build none, and a change of
 * selection or typography leaves the rows and samples alone.
 */
interface WordingRow {
  key: string;
  structure: InitialMartyriaStructure;
  lettering: InitialMartyriaLettering;
  /** The captions of the common wordings written this way. */
  captions: string[];
}

function createRow(
  structure: InitialMartyriaStructure,
  lettering: InitialMartyriaLettering,
  captions: string[],
): WordingRow {
  const wording = {
    structure,
    lettering: getSupportedInitialMartyriaLettering(lettering, structure),
  };
  return {
    key: getInitialMartyriaWordingKey(wording),
    ...wording,
    captions,
  };
}

const captionList = computed(
  () => new Intl.ListFormat(i18next.language, { style: 'short', type: 'unit' }),
);

function rowProps(row: WordingRow) {
  return {
    base: previewBase.value,
    structure: row.structure,
    lettering: row.lettering,
    samples: samples.value,
    paragraphStyles: props.paragraphStyles,
    pageSetup: props.pageSetup,
    caption:
      row.captions.length > 0 ? captionList.value.format(row.captions) : null,
    selected: row.key === currentKey.value,
    inUse: row.key !== currentKey.value && props.usedWordingKeys.has(row.key),
  };
}

/*
 * The common wordings of the language and mode word, with the choices
 * above in place of their own, then the sign group alone. Wordings that then
 * print alike share a row.
 */
const commonGroups = computed(() => {
  const neumeFontRows: WordingRow[] = [];
  const textRows: WordingRow[] = [];
  for (const wording of commonInitialMartyriaWordings) {
    if (
      wording.structure.languageId !== languageId.value ||
      wording.structure.labelVariant !== labelVariant.value
    ) {
      continue;
    }
    const usesNeumeFont =
      wording.lettering === INITIAL_MARTYRIA_LETTERINGS.MusicFont;
    const rows = usesNeumeFont ? neumeFontRows : textRows;
    const row = createRow(
      { ...wording.structure, ...chosenAxes.value },
      wording.lettering,
      [
        t(getCommonInitialMartyriaWordingCaptionSelector(wording.name), {
          ns: 'dialog',
        }),
      ],
    );
    const existing = rows.find((other) => other.key === row.key);
    if (existing != null) {
      existing.captions.push(...row.captions);
    } else {
      rows.push(row);
    }
  }
  // The sign group alone has no word for the mode, so it is the same row
  // whichever word is chosen.
  const modeSignAloneMethod =
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSignAlone;
  const [{ structure: modeSignAloneStructure }] =
    enumerateInitialMartyriaStructures({
      ...chosenAxes.value,
      modeIdentificationMethod: modeSignAloneMethod,
    });
  const modeSignAloneCaption = [
    getInitialMartyriaModeIdentificationMethodLabel(t, modeSignAloneMethod),
  ];
  textRows.push(
    createRow(
      modeSignAloneStructure,
      INITIAL_MARTYRIA_LETTERINGS.Text,
      modeSignAloneCaption,
    ),
  );
  const neumeFontRow = createRow(
    modeSignAloneStructure,
    INITIAL_MARTYRIA_LETTERINGS.MusicFont,
    modeSignAloneCaption,
  );
  if (neumeFontRow.lettering === INITIAL_MARTYRIA_LETTERINGS.MusicFont) {
    neumeFontRows.push(neumeFontRow);
  }
  return [
    {
      key: 'neume-font',
      label: t(($) => $.dialog.initialMartyriaStyles.neumeFontPresets, { ns }),
      rows: neumeFontRows,
    },
    {
      key: 'common',
      label: t(($) => $.dialog.initialMartyriaStyles.commonWordings, { ns }),
      rows: textRows,
    },
  ].filter((group) => group.rows.length > 0);
});

const commonKeys = computed(
  () =>
    new Set(
      commonGroups.value.flatMap((group) => group.rows.map((row) => row.key)),
    ),
);

/** Every other text wording of the language, by how it names the mode. */
const moreGroups = computed(() =>
  initialMartyriaModeIdentificationMethods
    .map((modeIdentificationMethod) => ({
      key: modeIdentificationMethod,
      label: getInitialMartyriaModeIdentificationMethodLabel(
        t,
        modeIdentificationMethod,
      ),
      rows: enumerateInitialMartyriaStructures({
        ...chosenAxes.value,
        modeIdentificationMethod,
      })
        .map(({ structure }) =>
          createRow(structure, INITIAL_MARTYRIA_LETTERINGS.Text, []),
        )
        .filter((row) => !commonKeys.value.has(row.key)),
    }))
    .filter((group) => group.rows.length > 0),
);

/*
 * The modes every row is previewed in: enough of them to tell every
 * wording of the language apart, so no two rows ever look the same.
 */
const samples = computed(() =>
  getWordingSampleModes(
    [...commonGroups.value, ...moreGroups.value].flatMap((group) =>
      group.rows.map((row) => row.structure),
    ),
  ).map(getSample),
);

/*
 * Only the first choice after the picker opens counts: the rows stay
 * clickable while the dialog animates closed.
 */
function choose(row: WordingRow) {
  if (!open.value) {
    return;
  }
  emit('select', { structure: row.structure, lettering: row.lettering });
  open.value = false;
}

/*
 * Each opening starts from the style being changed, or from the preferred
 * language with its usual word and transliteration.
 * When the current wording is not a common one, the section holding it
 * starts open.
 */
watch(
  open,
  (value) => {
    if (!value) {
      return;
    }
    const style = props.editingStyle;
    languageId.value = style?.structure.languageId ?? props.preferredLanguageId;
    labelVariant.value = style?.structure.labelVariant;
    transliterateNoteNames.value =
      style?.structure.transliterateNoteNames ??
      getDefaultInitialMartyriaTransliteration(languageId.value);
    moreOpen.value =
      currentKey.value != null &&
      moreGroups.value.some((group) =>
        group.rows.some((row) => row.key === currentKey.value),
      );
  },
  { immediate: true },
);
</script>
