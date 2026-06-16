<template>
  <Toolbar class="lyrics-toolbar h-auto w-full gap-0 border-0 p-1" loop>
    <template v-if="!element.lyricsUseDefaultStyle">
      <FontCombobox
        :model-value="element.lyricsFontFamily"
        :options="lyricsFontFamilies"
        @update:model-value="onFontFamilyChanged"
      />
      <FontStyleSelect
        class="w-40"
        :model-value="element.lyricsFontStyle"
        :options="fontStyleOptions"
        :disabled="fontStyleOptions.length <= 1"
        @update:model-value="
          $emit('update', {
            lyricsFontStyle: $event,
          } as Partial<NoteElement>)
        "
      />
      <InputFontSize
        id="toolbar-lyrics-font-size"
        :model-value="element.lyricsFontSize"
        @update:model-value="
          $emit('update', {
            lyricsFontSize: $event,
          } as Partial<NoteElement>)
        "
      />
      <ToolbarSeparator />
      <ToggleGroup
        type="multiple"
        variant="outline"
        :model-value="styleValues"
        @update:model-value="onStyleValuesChanged"
      >
        <ToggleGroupItem
          value="bold"
          class="icon-btn"
          :class="{ selected: isFontStyleAxisActive('bold') }"
          :disabled="!isFontStyleAxisToggleEnabled('bold')"
          aria-label="Toggle bold"
        >
          <PhTextB class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="italic"
          class="icon-btn"
          :class="{ selected: isFontStyleAxisActive('italic') }"
          :disabled="!isFontStyleAxisToggleEnabled('italic')"
          aria-label="Toggle italic"
        >
          <PhTextItalic class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="underline"
          class="icon-btn"
          :class="{ selected: underline }"
          aria-label="Toggle underline"
        >
          <PhTextUnderline class="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToolbarSeparator />
    </template>
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.common.insertPelastikon, { ns: 'toolbar' })"
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="icon-btn"
        @mousedown.prevent="$emit('insert:specialCharacter', PELASTIKON)"
      >
        <img src="@/assets/icons/letterPelastikon.svg" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.common.insertGorthmikon, { ns: 'toolbar' })"
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="icon-btn"
        @mousedown.prevent="$emit('insert:specialCharacter', GORTHMIKON)"
      >
        <img src="@/assets/icons/letterGorthmikon.svg" />
      </ToolbarButton>
    </AppTooltip>
    <ToolbarSeparator />
    <ToolbarButton
      v-for="character in specialCharacters"
      :key="character"
      variant="secondary"
      size="icon-sm"
      class="icon-btn character-button"
      :class="getCharacterLanguage(character)"
      :aria-label="character"
      @mousedown.prevent="$emit('insert:specialCharacter', character)"
    >
      {{ character }}
    </ToolbarButton>
  </Toolbar>
</template>

<script setup lang="ts">
import { PhTextB, PhTextItalic, PhTextUnderline } from '@phosphor-icons/vue';
import type { PropType } from 'vue';
import { computed } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from '@/components/ui/toolbar';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import type { NoteElement } from '@/models/Element';
import { fontCatalog } from '@/services/FontCatalog';
import {
  E_MACRON,
  E_MACRON_SMALL,
  GORTHMIKON,
  GREEK_OU,
  GREEK_OU_SMALL,
  PELASTIKON,
  STIGMA,
  STIGMA_SMALL,
} from '@/utils/constants';

const specialCharacters = [
  E_MACRON_SMALL,
  E_MACRON,
  STIGMA_SMALL,
  STIGMA,
  GREEK_OU_SMALL,
  GREEK_OU,
];

const props = defineProps({
  element: {
    type: Object as PropType<NoteElement>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

const emit = defineEmits(['insert:specialCharacter', 'update']);

const {
  fontStyleOptions,
  activeStyleAxisValues,
  isFontStyleAxisActive,
  isFontStyleAxisToggleEnabled,
  applyStyleAxisToggles,
  remapStyleForFamily,
} = useFontStyleControls(
  () => props.element.lyricsFontFamily,
  () => props.element.lyricsFontStyle,
);

const underline = computed(
  () => props.element.lyricsTextDecoration === 'underline',
);
const styleValues = computed(() => [
  ...activeStyleAxisValues.value,
  ...(underline.value ? ['underline'] : []),
]);

const lyricsFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);

function onStyleValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];

  emit('update', {
    lyricsFontStyle: applyStyleAxisToggles(values),
    lyricsTextDecoration: values.includes('underline') ? 'underline' : 'none',
  } as Partial<NoteElement>);
}

function onFontFamilyChanged(lyricsFontFamily: string) {
  emit('update', {
    lyricsFontFamily,
    lyricsFontStyle: remapStyleForFamily(lyricsFontFamily),
  } as Partial<NoteElement>);
}

function getCharacterLanguage(character: string) {
  return character === E_MACRON_SMALL || character === E_MACRON
    ? 'english'
    : 'greek';
}
</script>

<style scoped>
.lyrics-toolbar {
  flex-wrap: wrap;
  background-color: var(--color-legacy-chrome-menu-surface);

  --btn-size: 32px;
}

.icon-btn {
  box-sizing: border-box;
  height: var(--btn-size);
  width: var(--btn-size);
  appearance: auto;
  background: revert;
  border: revert;
  border-radius: revert;
  box-shadow: revert;
  font-weight: revert;

  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;
  outline: revert;
  padding: 0;
  transition: revert;
  user-select: none;
}

.icon-btn:hover {
  background: revert;
}

.icon-btn.selected,
.icon-btn[data-state='on'],
.icon-btn[aria-pressed='true'] {
  background: var(--color-legacy-chrome-selected);
}

.icon-btn > img {
  height: var(--btn-size);
  max-width: none;
  width: var(--btn-size);
}

.icon-btn[aria-disabled='true'],
.icon-btn[data-disabled],
.icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.character-button {
  font-size: 1.25rem;
}

.english {
  font-family: 'Source Serif';
}

.greek {
  font-family: 'GFS Didot';
}
</style>
