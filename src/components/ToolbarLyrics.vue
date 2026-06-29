<template>
  <Toolbar class="chrome-toolbar" loop>
    <TextStyleSelect
      trigger-class="w-48"
      :model-value="element.textStyleId"
      :text-styles="textStyles"
      @update:model-value="
        $emit('update', { textStyleId: $event } as Partial<NoteElement>)
      "
    />
    <ToolbarSeparator />
    <FontCombobox
      :model-value="resolvedTextStyle.fontFamily"
      :options="lyricsFontFamilies"
      @update:model-value="onFontFamilyChanged"
    />
    <FontStyleSelect
      class="w-40"
      :model-value="resolvedTextStyle.fontStyle"
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
      :model-value="resolvedTextStyle.fontSize"
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
        class="chrome-button"
        :class="{ selected: isFontStyleAxisActive('bold') }"
        :disabled="!isFontStyleAxisToggleEnabled('bold')"
        aria-label="Toggle bold"
      >
        <PhTextB class="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="italic"
        class="chrome-button"
        :class="{ selected: isFontStyleAxisActive('italic') }"
        :disabled="!isFontStyleAxisToggleEnabled('italic')"
        aria-label="Toggle italic"
      >
        <PhTextItalic class="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="underline"
        class="chrome-button"
        :class="{ selected: underline }"
        aria-label="Toggle underline"
      >
        <PhTextUnderline class="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
    <ToolbarSeparator />
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.common.insertPelastikon, { ns: 'toolbar' })"
    >
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @mousedown.prevent="$emit('insert:specialCharacter', PELASTIKON)"
      >
        <NeumeIcon name="letterPelastikon" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.common.insertGorthmikon, { ns: 'toolbar' })"
    >
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @mousedown.prevent="$emit('insert:specialCharacter', GORTHMIKON)"
      >
        <NeumeIcon name="letterGorthmikon" />
      </ToolbarButton>
    </AppTooltip>
    <ToolbarSeparator />
    <ToolbarButton
      v-for="character in specialCharacters"
      :key="character"
      variant="secondary"
      class="chrome-button character-button"
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
import NeumeIcon from '@/components/NeumeIcon.vue';
import TextStyleSelect from '@/components/ParagraphStyleSelect.vue';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from '@/components/ui/toolbar';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import type { NoteElement } from '@/models/Element';
import { resolveTextStyle, type TextStyle } from '@/models/TextStyle';
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
  textStyles: {
    type: Array as PropType<TextStyle[]>,
    required: true,
  },
});

const emit = defineEmits(['insert:specialCharacter', 'update']);

const resolvedTextStyle = computed(() =>
  resolveTextStyle(
    props.textStyles,
    props.element.textStyleId,
    props.element.getTextStyleOverrides(),
  ),
);

const {
  fontStyleOptions,
  activeStyleAxisValues,
  isFontStyleAxisActive,
  isFontStyleAxisToggleEnabled,
  applyStyleAxisToggles,
  remapStyleForFamily,
} = useFontStyleControls(
  () => resolvedTextStyle.value.fontFamily,
  () => resolvedTextStyle.value.fontStyle,
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
