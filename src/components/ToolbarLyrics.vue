<template>
  <div class="lyrics-toolbar">
    <Checkbox
      id="toolbar-lyrics-use-default-style"
      class="bg-background"
      :model-value="element.lyricsUseDefaultStyle"
      @update:model-value="
        $emit('update', {
          lyricsUseDefaultStyle: $event === true,
        } as Partial<NoteElement>)
      "
    />
    <Label for="toolbar-lyrics-use-default-style" class="ml-2">{{
      $t(($) => $.toolbar.common.useDefaultStyle, { ns: 'toolbar' })
    }}</Label>
    <span class="divider" />
    <template v-if="!element.lyricsUseDefaultStyle">
      <FontCombobox
        :model-value="element.lyricsFontFamily"
        :options="lyricsFontFamilies"
        @update:model-value="
          $emit('update', {
            lyricsFontFamily: $event,
          } as Partial<NoteElement>)
        "
      />
      <span class="space"></span>
      <InputFontSize
        :model-value="element.lyricsFontSize"
        @update:model-value="
          $emit('update', {
            lyricsFontSize: $event,
          } as Partial<NoteElement>)
        "
      />
      <span class="space"></span>
      <ColorPicker
        :model-value="element.lyricsColor"
        @update:model-value="
          $emit('update', {
            lyricsColor: $event,
          } as Partial<NoteElement>)
        "
      />
      <span class="space"></span>
      <ToggleGroup
        type="multiple"
        variant="outline"
        :model-value="styleValues"
        @update:model-value="onStyleValuesChanged"
      >
        <ToggleGroupItem value="bold" class="icon-btn" aria-label="Toggle bold">
          <PhTextB class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="italic"
          class="icon-btn"
          aria-label="Toggle italic"
        >
          <PhTextItalic class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="underline"
          class="icon-btn"
          aria-label="Toggle underline"
        >
          <PhTextUnderline class="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      <span class="space"></span>
      <Label class="mr-2">{{
        $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
      }}</Label>
      <InputStrokeWidth
        :model-value="element.lyricsStrokeWidth"
        @update:model-value="
          $emit('update', {
            lyricsStrokeWidth: $event,
          } as Partial<NoteElement>)
        "
      />
    </template>
    <span class="space" />
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.common.insertPelastikon, { ns: 'toolbar' })"
    >
      <button
        class="icon-btn"
        @mousedown.prevent="$emit('insert:specialCharacter', PELASTIKON)"
      >
        <img src="@/assets/icons/letterPelastikon.svg" />
      </button>
    </AppTooltip>
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.common.insertGorthmikon, { ns: 'toolbar' })"
    >
      <button
        class="icon-btn"
        @mousedown.prevent="$emit('insert:specialCharacter', GORTHMIKON)"
      >
        <img src="@/assets/icons/letterGorthmikon.svg" />
      </button>
    </AppTooltip>
    <span class="space" />
    <template v-for="character in specialCharacters" :key="character.value">
      <button
        class="icon-btn"
        :class="character.language"
        :aria-label="character.value"
        @mousedown.prevent="$emit('insert:specialCharacter', character.value)"
      >
        {{ character.value }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { PhTextB, PhTextItalic, PhTextUnderline } from '@phosphor-icons/vue';
import type { PropType } from 'vue';
import { computed } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import ColorPicker from '@/components/ColorPicker.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { NoteElement } from '@/models/Element';
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
  { value: E_MACRON_SMALL, language: 'english' },
  { value: E_MACRON, language: 'english' },
  { value: STIGMA_SMALL, language: 'greek' },
  { value: STIGMA, language: 'greek' },
  { value: GREEK_OU_SMALL, language: 'greek' },
  { value: GREEK_OU, language: 'greek' },
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

const bold = computed(() => props.element.lyricsFontWeight === '700');
const italic = computed(() => props.element.lyricsFontStyle === 'italic');
const underline = computed(
  () => props.element.lyricsTextDecoration === 'underline',
);
const styleValues = computed(() => [
  ...(bold.value ? ['bold'] : []),
  ...(italic.value ? ['italic'] : []),
  ...(underline.value ? ['underline'] : []),
]);

const lyricsFontFamilies = computed(() => [
  'Source Serif',
  'GFS Didot',
  'Noto Naskh Arabic',
  'Old Standard',
  ...props.fonts,
]);

function onStyleValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];

  emit('update', {
    lyricsFontWeight: values.includes('bold') ? '700' : '400',
    lyricsFontStyle: values.includes('italic') ? 'italic' : 'normal',
    lyricsTextDecoration: values.includes('underline') ? 'underline' : 'none',
  } as Partial<NoteElement>);
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.lyrics-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  background-color: var(--color-legacy-chrome-menu-surface);

  padding: 0.25rem;

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
  font-size: 1.25rem;
  user-select: none;
}

.icon-btn:hover {
  background: revert;
}

.divider {
  height: 32px;
  border-right: 1px solid var(--color-legacy-chrome-divider);
  margin: 0 0.5rem;
}

.icon-btn.selected,
.icon-btn[data-state='on'] {
  background: var(--color-legacy-chrome-selected);
}

.icon-btn img {
  height: var(--btn-icon-size, var(--btn-size));
  max-width: none;
  width: var(--btn-icon-size, var(--btn-size));
}

.icon-btn[aria-disabled='true'],
.icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.space {
  width: 16px;
}

.english {
  font-family: 'Source Serif';
}

.greek {
  font-family: 'GFS Didot';
}
</style>
