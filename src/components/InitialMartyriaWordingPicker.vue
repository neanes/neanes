<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="grid h-[48rem] max-h-[calc(100dvh-4rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-[60rem]"
      @open-auto-focus="revealCurrentWording"
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

          <Field
            v-if="!languageUsesGreekScript"
            orientation="horizontal"
            class="w-auto sm:ml-3"
          >
            <Switch
              id="initial-martyria-picker-transliterate"
              v-model="transliterateNoteNames"
            />
            <FieldContent>
              <FieldLabel for="initial-martyria-picker-transliterate">
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
                      $.dialog.initialMartyriaStyles.transliterateNoteNamesHint,
                    { ns },
                  )
                }}
              </FieldDescription>
            </FieldContent>
          </Field>
        </div>

        <div
          v-if="filterControls.length > 0"
          class="flex flex-col gap-1.5"
          role="group"
          :aria-label="
            $t(($) => $.dialog.initialMartyriaStyles.filters.label, { ns })
          "
        >
          <div
            v-for="filter in filterControls"
            :key="filter.name"
            class="flex flex-wrap items-center gap-x-3 gap-y-1"
          >
            <span
              :id="`initial-martyria-picker-filter-${filter.name}`"
              class="w-32 flex-none text-xs text-muted-foreground"
            >
              {{ filter.label }}
            </span>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              class="flex-wrap"
              :model-value="filter.value ?? allFilterValue"
              :aria-labelledby="`initial-martyria-picker-filter-${filter.name}`"
              @update:model-value="setFilter(filter.name, $event)"
            >
              <ToggleGroupItem
                :value="allFilterValue"
                :aria-label="formatOptionLabel(allLabel, filter.allCount)"
              >
                {{ allLabel }}
                <span class="text-muted-foreground tabular-nums">{{
                  filter.allCount
                }}</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                v-for="option in filter.options"
                :key="option.value"
                :value="option.value"
                :disabled="option.count === 0 && option.value !== filter.value"
                :aria-label="formatOptionLabel(option.label, option.count)"
              >
                <span
                  :lang="option.lang"
                  :style="
                    option.lang == null
                      ? undefined
                      : getInitialMartyriaLanguageTextStyle(option.lang)
                  "
                  >{{ option.label }}</span
                >
                <span class="text-muted-foreground tabular-nums">{{
                  option.count
                }}</span>
              </ToggleGroupItem>
            </ToggleGroup>
            <p
              v-if="filter.name === 'plagal' && plagalHint != null"
              class="basis-full text-xs text-muted-foreground sm:pl-35"
            >
              {{ plagalHint }}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea class="min-h-0 border">
        <div
          ref="list"
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

          <p
            v-if="currentWordingFiltered"
            class="flex flex-wrap items-center gap-2 border-b px-3 py-1.5 text-xs text-muted-foreground"
          >
            {{
              $t(($) => $.dialog.initialMartyriaStyles.currentWordingFiltered, {
                ns,
              })
            }}
            <Button
              type="button"
              variant="link"
              size="sm"
              class="h-auto p-0 text-xs"
              @click="clearFilters"
            >
              {{
                $t(($) => $.dialog.initialMartyriaStyles.clearFilters, { ns })
              }}
            </Button>
          </p>

          <template v-for="group in visibleGroups" :key="group.key">
            <p :class="groupHeadingClass">{{ getGroupLabel(group.key) }}</p>
            <InitialMartyriaWordingRow
              v-for="row in group.rows"
              :key="row.key"
              v-bind="rowProps(row, group.key)"
              @select="choose(row)"
            />
          </template>

          <div
            v-if="visibleGroups.length === 0"
            class="flex flex-col items-center gap-2 px-3 py-8 text-center text-sm text-muted-foreground"
          >
            {{ $t(($) => $.dialog.initialMartyriaStyles.noMatches, { ns }) }}
            <Button
              type="button"
              variant="outline"
              size="sm"
              @click="clearFilters"
            >
              {{
                $t(($) => $.dialog.initialMartyriaStyles.clearFilters, { ns })
              }}
            </Button>
          </div>
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
import type { SelectorParam } from 'i18next';
import { useTranslation } from 'i18next-vue';
import type { AcceptableValue } from 'reka-ui';
import { computed, ref, watch } from 'vue';

import InitialMartyriaWordingRow from '@/components/InitialMartyriaWordingRow.vue';
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
  createInitialMartyriaStyleFromWording,
  DEFAULT_INITIAL_MARTYRIA_WORDING_NAME,
  getCommonInitialMartyriaWording,
  getCommonInitialMartyriaWordingCaptionSelector,
  getDefaultInitialMartyriaTransliteration,
} from '@/models/InitialMartyriaCommonWordings';
import {
  getInitialMartyriaLabel,
  getInitialMartyriaLabelVariants,
  usesGreekScript,
} from '@/models/InitialMartyriaLexicon';
import { getInitialMartyriaWordingKey } from '@/models/InitialMartyriaResolver';
import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  type InitialMartyriaLabelVariant,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaLettering,
  type InitialMartyriaModeNamingScheme,
  type InitialMartyriaStructure,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { capitalizeInitial } from '@/utils/capitalizeInitial';
import {
  getInitialMartyriaLanguageName,
  getInitialMartyriaLanguageTextStyle,
  getInitialMartyriaModeIdentificationMethodLabel,
} from '@/utils/initialMartyriaLabels';
import { isOneOf } from '@/utils/isOneOf';

import {
  getSample,
  getWordingSampleModes,
} from './InitialMartyriaStylesDialog.shared';
import {
  buildInitialMartyriaWordingList,
  createInitialMartyriaWordingFilterSelection,
  filterInitialMartyriaWordingList,
  getInitialMartyriaWordingFilters,
  getInitialMartyriaWordingRows,
  INITIAL_MARTYRIA_COMMON_GROUP,
  INITIAL_MARTYRIA_NEUME_FONT_GROUP,
  type InitialMartyriaCaptionPart,
  type InitialMartyriaWordingFilterName,
  type InitialMartyriaWordingGroupKey,
  type InitialMartyriaWordingRow as WordingRow,
} from './InitialMartyriaWordingList';

const ns = 'dialog';

type DialogSelector = SelectorParam<'dialog'>;

const groupHeadingClass =
  'border-b bg-muted/20 px-3 py-1 text-[11px] font-medium text-muted-foreground';

/**
 * Chooses how an initial martyria reads: a language, its word for the mode
 * where it has more than one, whether its note names are transliterated, and
 * one of the wordings the language allows. Every wording is listed: the
 * common ones first, then the rest grouped by how they show the mode;
 * filters narrow the list by what prints. Each wording is previewed, with its reading, in
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
const filterSelection = ref(createInitialMartyriaWordingFilterSelection());

function clearFilters() {
  filterSelection.value = createInitialMartyriaWordingFilterSelection();
}

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
  clearFilters();
}

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
  clearFilters();
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

/** Every wording of the language and mode word, before filtering. */
const groups = computed(() =>
  buildInitialMartyriaWordingList({
    languageId: languageId.value,
    labelVariant: labelVariant.value,
    transliterateNoteNames: transliterateNoteNames.value,
  }),
);

const visibleGroups = computed(() =>
  filterInitialMartyriaWordingList(groups.value, filterSelection.value),
);

const filters = computed(() =>
  getInitialMartyriaWordingFilters(groups.value, filterSelection.value),
);

const currentWordingFiltered = computed(() => {
  const key = currentKey.value;
  return (
    key != null &&
    getInitialMartyriaWordingRows(groups.value).some(
      (row) => row.key === key,
    ) &&
    !getInitialMartyriaWordingRows(visibleGroups.value).some(
      (row) => row.key === key,
    )
  );
});

/*
 * The toggle groups cannot hold an absent value either, so All goes by a
 * value no option uses.
 */
const allFilterValue = '*';

const allLabel = computed(() =>
  t(($) => $.dialog.initialMartyriaStyles.filters.all, { ns }),
);

function formatOptionLabel(label: string, count: number) {
  return t(($) => $.dialog.initialMartyriaStyles.filters.optionWithCount, {
    ns,
    label,
    count,
  });
}

interface FilterControl {
  name: InitialMartyriaWordingFilterName;
  label: string;
  value: string | null;
  allCount: number;
  options: {
    value: string;
    label: string;
    /** The language of a label taken from the language's own words. */
    lang?: InitialMartyriaLanguageId;
    count: number;
  }[];
}

const filterLabelSelectors: [
  InitialMartyriaWordingFilterName,
  DialogSelector,
][] = [
  ['number', ($) => $.dialog.initialMartyriaStyles.filters.number],
  ['plagal', ($) => $.dialog.initialMartyriaStyles.filters.plagal],
  ['method', ($) => $.dialog.initialMartyriaStyles.filters.method],
];

/** The filters the language offers, in the order they are shown. */
const filterControls = computed(() => {
  const { number, plagal, method, allCounts } = filters.value;
  const lang = languageId.value;
  const optionsByName: Record<
    InitialMartyriaWordingFilterName,
    FilterControl['options'] | undefined
  > = {
    number: number?.map((option) => ({ ...option, lang })),
    plagal: plagal?.map((option) => ({ ...option, lang })),
    method: method?.map((option) => ({
      ...option,
      label: getInitialMartyriaModeIdentificationMethodLabel(t, option.value),
    })),
  };
  return filterLabelSelectors.flatMap(([name, labelSelector]) => {
    const options = optionsByName[name];
    return options == null
      ? []
      : [
          {
            name,
            label: t(labelSelector, { ns }),
            value: filterSelection.value[name],
            allCount: allCounts[name],
            options,
          } satisfies FilterControl,
        ];
  });
});

function setFilter(
  name: InitialMartyriaWordingFilterName,
  value: AcceptableValue | AcceptableValue[],
) {
  // Clicking the pressed item deselects it; the choice stays.
  if (typeof value !== 'string' || value === '') {
    return;
  }
  filterSelection.value = {
    ...filterSelection.value,
    [name]: value === allFilterValue ? null : value,
  };
}

const plagalHintSelectors = {
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart]: ($) =>
    $.dialog.initialMartyriaStyles.plagalHints.authenticCounterpart,
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass]: ($) =>
    $.dialog.initialMartyriaStyles.plagalHints.plagalClass,
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute]: ($) =>
    $.dialog.initialMartyriaStyles.plagalHints.absolute,
} satisfies Record<InitialMartyriaModeNamingScheme, DialogSelector>;

/** How the chosen plagal naming works, or nothing while All is chosen. */
const plagalHint = computed(() => {
  const scheme = filterSelection.value.plagal;
  return scheme == null ? null : t(plagalHintSelectors[scheme], { ns });
});

function getGroupLabel(key: InitialMartyriaWordingGroupKey) {
  switch (key) {
    case INITIAL_MARTYRIA_NEUME_FONT_GROUP:
      return t(($) => $.dialog.initialMartyriaStyles.neumeFontPresets, { ns });
    case INITIAL_MARTYRIA_COMMON_GROUP:
      return t(($) => $.dialog.initialMartyriaStyles.commonWordings, { ns });
    default:
      return getInitialMartyriaModeIdentificationMethodLabel(t, key);
  }
}

const list = ref<HTMLElement | null>(null);

/*
 * Changing a wording opens on the style's current row, which may be far
 * down the list when it is not a common wording.
 */
function revealCurrentWording() {
  list.value
    ?.querySelector('[aria-pressed="true"]')
    ?.scrollIntoView({ block: 'center' });
}

const captionList = computed(
  () => new Intl.ListFormat(i18next.language, { style: 'short', type: 'unit' }),
);

const plagalCaptionSelectors = {
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart]: ($) =>
    $.dialog.initialMartyriaStyles.captionParts.plagal.authenticCounterpart,
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass]: ($) =>
    $.dialog.initialMartyriaStyles.captionParts.plagal.plagalClass,
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute]: ($) =>
    $.dialog.initialMartyriaStyles.captionParts.plagal.absolute,
} satisfies Record<InitialMartyriaModeNamingScheme, DialogSelector>;

const labelPositionCaptionSelectors = {
  number: {
    before: ($) =>
      $.dialog.initialMartyriaStyles.captionParts.labelBeforeNumber,
    after: ($) => $.dialog.initialMartyriaStyles.captionParts.labelAfterNumber,
  },
  sign: {
    before: ($) => $.dialog.initialMartyriaStyles.captionParts.labelBeforeSign,
    after: ($) => $.dialog.initialMartyriaStyles.captionParts.labelAfterSign,
  },
} satisfies Record<
  'number' | 'sign',
  Record<'before' | 'after', DialogSelector>
>;

function formatCaptionPart(part: InitialMartyriaCaptionPart) {
  switch (part.kind) {
    case 'number':
      return t(($) => $.dialog.initialMartyriaStyles.captionParts.number, {
        ns,
        number: part.number,
      });
    case 'plagal':
      return t(plagalCaptionSelectors[part.scheme], { ns });
    case 'labelPosition':
      return t(labelPositionCaptionSelectors[part.identifier][part.position], {
        ns,
        label: part.label,
      });
    case 'noWords':
      return t(($) => $.dialog.initialMartyriaStyles.captionParts.noWords, {
        ns,
      });
  }
}

/**
 * A common wording keeps its curated caption; any other row is described by
 * the parts that set it apart from the rest of its group.
 */
function getCaption(row: WordingRow) {
  if (row.commonWordingNames.length > 0) {
    return captionList.value.format([
      ...new Set(
        row.commonWordingNames.map((name) =>
          t(getCommonInitialMartyriaWordingCaptionSelector(name), { ns }),
        ),
      ),
    ]);
  }
  return capitalizeInitial(
    captionList.value.format(row.captionParts.map(formatCaptionPart)),
    i18next.language,
  );
}

function rowProps(row: WordingRow, groupKey: InitialMartyriaWordingGroupKey) {
  return {
    base: previewBase.value,
    structure: row.structure,
    lettering: row.lettering,
    samples: samples.value,
    paragraphStyles: props.paragraphStyles,
    pageSetup: props.pageSetup,
    caption: getCaption(row),
    // The common group mixes ways of showing the mode, so each row names its
    // own, as the other groups do in their headings.
    methodLabel:
      groupKey === INITIAL_MARTYRIA_COMMON_GROUP
        ? getInitialMartyriaModeIdentificationMethodLabel(
            t,
            row.structure.modeIdentificationMethod,
          )
        : null,
    captionQuotesLanguage: row.captionQuotesLanguage,
    selected: row.key === currentKey.value,
    inUse: row.key !== currentKey.value && props.usedWordingKeys.has(row.key),
  };
}

/*
 * The modes every row is previewed in: enough of them to tell every
 * wording of the language apart, so no two rows ever look the same. They
 * come from the whole list, so filtering never moves the columns.
 */
const samples = computed(() =>
  getWordingSampleModes(
    getInitialMartyriaWordingRows(groups.value).map((row) => row.structure),
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
 * language with its usual word and transliteration, with every filter at
 * All.
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
    clearFilters();
  },
  { immediate: true },
);
</script>
