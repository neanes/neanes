<template>
  <div
    class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden"
  >
    <div class="flex flex-wrap items-end gap-3 p-1">
      <Field class="w-40">
        <FieldLabel for="initial-martyria-browse-language">
          {{ $t(($) => $.dialog.initialMartyriaStyles.language, { ns }) }}
        </FieldLabel>
        <Select v-model="languageValue">
          <SelectTrigger id="initial-martyria-browse-language" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="id in initialMartyriaLanguageIds"
              :key="id"
              :value="id"
            >
              {{ getInitialMartyriaLanguageName(t, id) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field class="w-44">
        <FieldLabel for="initial-martyria-browse-sample">
          {{ $t(($) => $.dialog.initialMartyriaStyles.sampleMode, { ns }) }}
        </FieldLabel>
        <Select v-model="sampleModeValue">
          <SelectTrigger id="initial-martyria-browse-sample" class="w-full">
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
      </Field>

      <Field class="w-auto">
        <FieldLabel id="initial-martyria-browse-show">
          {{ $t(($) => $.dialog.initialMartyriaStyles.show, { ns }) }}
        </FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          aria-labelledby="initial-martyria-browse-show"
          :model-value="modeIdentificationMethod"
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
      </Field>

      <Field
        v-if="!languageUsesGreekScript"
        orientation="horizontal"
        class="w-auto pb-2"
      >
        <Checkbox
          id="initial-martyria-browse-transliterate"
          v-model="transliterateNoteNames"
        />
        <FieldLabel for="initial-martyria-browse-transliterate">
          {{
            $t(($) => $.dialog.initialMartyriaStyles.transliterateNoteNames, {
              ns,
            })
          }}
        </FieldLabel>
      </Field>

      <Field orientation="horizontal" class="ml-auto w-auto pb-2">
        <Checkbox id="initial-martyria-browse-hide-saved" v-model="hideSaved" />
        <FieldLabel for="initial-martyria-browse-hide-saved">
          {{ $t(($) => $.dialog.initialMartyriaStyles.hideSaved, { ns }) }}
        </FieldLabel>
      </Field>
    </div>

    <ScrollArea class="min-h-0 rounded-md border">
      <div class="space-y-5 p-3">
        <p class="text-xs text-muted-foreground">
          {{
            $t(($) => $.dialog.initialMartyriaStyles.browseDescription, {
              ns,
              shown: visibleTileCount,
              total: tiles.length,
            })
          }}
        </p>
        <section
          v-for="group in groups"
          :key="group.numeralStyle"
          :aria-label="group.label"
        >
          <p
            v-if="groups.length > 1"
            class="mb-2 text-xs font-medium text-muted-foreground"
          >
            {{ group.label }}
          </p>
          <div
            class="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-2"
          >
            <InitialMartyriaStyleTile
              v-for="tile in group.tiles"
              :key="tile.key"
              :style="tile.style"
              :template-id="sampleTemplateId"
              :page-setup="pageSetup"
              :paragraph-styles="paragraphStyles"
              :selected="tile.key === selectedKey"
              @select="selectedKey = tile.key"
            >
              <Badge
                v-if="tile.matchingStyle != null"
                :variant="
                  isBuiltInInitialMartyriaStyleId(tile.matchingStyle.id)
                    ? 'outline'
                    : 'default'
                "
                class="max-w-full"
              >
                <PhLock
                  v-if="isBuiltInInitialMartyriaStyleId(tile.matchingStyle.id)"
                />
                <span class="truncate">
                  {{
                    getInitialMartyriaStyleDisplayName(tile.matchingStyle, t)
                  }}
                </span>
              </Badge>
            </InitialMartyriaStyleTile>
          </div>
        </section>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { PhLock } from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import { computed, ref, watch } from 'vue';

import InitialMartyriaStyleTile from '@/components/InitialMartyriaStyleTile.vue';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
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
  enumerateInitialMartyriaStructures,
  getDefaultBuiltInInitialMartyriaStyle,
  getInitialMartyriaStructureKey,
  getInitialMartyriaStyleDisplayName,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaModeIdentificationMethod,
  initialMartyriaModeIdentificationMethods,
  type InitialMartyriaNumeralStyle,
  type InitialMartyriaStructure,
  type InitialMartyriaStyle,
  isBuiltInInitialMartyriaStyleId,
  usesGreekScript,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import {
  getInitialMartyriaLanguageName,
  getInitialMartyriaModeIdentificationMethodLabel,
  getInitialMartyriaNumeralStyleLabel,
} from '@/utils/initialMartyriaLabels';

import {
  getSampleModeOptions,
  getSampleTemplateId,
  type InitialMartyriaStructureSelection,
  withInitialMartyriaStyleStructure,
} from './InitialMartyriaStylesDialog.shared';

const ns = 'dialog';

const props = defineProps<{
  /** The style whose language, presentation and structure seed the gallery. */
  seed: InitialMartyriaStyle;
  /** Every style, built-in and custom, so tiles can show which are saved. */
  styles: InitialMartyriaStyle[];
  pageSetup: PageSetup;
  paragraphStyles: ParagraphStyle[];
}>();

const { t } = useTranslation();

const languageId = ref<InitialMartyriaLanguageId>(
  props.seed.structure.languageId,
);
const modeIdentificationMethod = ref<InitialMartyriaModeIdentificationMethod>(
  props.seed.structure.modeIdentificationMethod,
);
const transliterateNoteNames = ref(props.seed.structure.transliterateNoteNames);
const flowDirection = ref(props.seed.structure.flowDirection);
const sampleMode = defineModel<number>('sampleMode', { required: true });
const hideSaved = ref(false);
const selection = defineModel<InitialMartyriaStructureSelection | null>(
  'selection',
  { required: true },
);
const selectedKey = ref<string | null>(
  getInitialMartyriaStructureKey(props.seed.structure),
);

const sampleModeOptions = getSampleModeOptions();
const sampleModeValue = computed({
  get: () => String(sampleMode.value),
  set: (value: string) => {
    sampleMode.value = Number(value);
  },
});
const sampleTemplateId = computed(() => getSampleTemplateId(sampleMode.value));
const languageValue = computed({
  get: () => languageId.value,
  set: (value: string) => {
    const nextLanguageId = value as InitialMartyriaLanguageId;
    const languageDefault =
      getDefaultBuiltInInitialMartyriaStyle(nextLanguageId).structure;
    languageId.value = nextLanguageId;
    flowDirection.value = languageDefault.flowDirection;
    transliterateNoteNames.value = languageDefault.transliterateNoteNames;
  },
});
const languageUsesGreekScript = computed(() =>
  usesGreekScript(languageId.value),
);

function setModeIdentificationMethod(value: unknown) {
  if (typeof value === 'string' && value !== '') {
    modeIdentificationMethod.value =
      value as InitialMartyriaModeIdentificationMethod;
  }
}

function baseStructure() {
  return {
    languageId: languageId.value,
    modeIdentificationMethod: modeIdentificationMethod.value,
    transliterateNoteNames: transliterateNoteNames.value,
    flowDirection: flowDirection.value,
  };
}

interface Tile {
  key: string;
  structure: InitialMartyriaStructure;
  style: InitialMartyriaStyle;
  matchingStyle: InitialMartyriaStyle | null;
}

const stylesByKey = computed(() => {
  const byKey = new Map<string, InitialMartyriaStyle>();
  for (const style of props.styles) {
    const key = getInitialMartyriaStructureKey(style.structure);
    if (!byKey.has(key)) {
      byKey.set(key, style);
    }
  }
  return byKey;
});

// The gallery is a view of the structure space: enumerate, render, and
// de-duplicate on demand. Tiles wear the seed style's presentation so the
// user judges structure in their real font.
const tiles = computed<Tile[]>(() =>
  enumerateInitialMartyriaStructures(baseStructure()).map(
    ({ structure, key }) => ({
      key,
      structure,
      style: withInitialMartyriaStyleStructure(
        props.seed,
        structure,
        props.paragraphStyles,
      ),
      matchingStyle: stylesByKey.value.get(key) ?? null,
    }),
  ),
);

const visibleTiles = computed(() =>
  hideSaved.value
    ? tiles.value.filter(
        (tile) => tile.matchingStyle == null || tile.key === selectedKey.value,
      )
    : tiles.value,
);
const visibleTileCount = computed(() => visibleTiles.value.length);

const groups = computed(() => {
  const byNumeralStyle = new Map<InitialMartyriaNumeralStyle, Tile[]>();
  for (const tile of visibleTiles.value) {
    const group = byNumeralStyle.get(tile.structure.numeralStyle) ?? [];
    group.push(tile);
    byNumeralStyle.set(tile.structure.numeralStyle, group);
  }
  return [...byNumeralStyle.entries()].map(([numeralStyle, tiles]) => ({
    numeralStyle,
    label: getInitialMartyriaNumeralStyleLabel(t, numeralStyle),
    tiles,
  }));
});

watch(
  [tiles, selectedKey],
  ([tiles, key]) => {
    const tile = tiles.find((tile) => tile.key === key) ?? null;
    if (tile == null) {
      selectedKey.value = null;
    }
    selection.value =
      tile == null
        ? null
        : { structure: tile.structure, matchingStyle: tile.matchingStyle };
  },
  { immediate: true },
);
</script>
