<template>
  <Toolbar class="chrome-toolbar" loop>
    <ParagraphStyleSelect
      trigger-class="w-48"
      :model-value="element.paragraphStyleId"
      :paragraph-styles="paragraphStyles"
      @update:model-value="
        $emit('update', { paragraphStyleId: $event } as Partial<DropCapElement>)
      "
    />
    <ToolbarSeparator />
    <FontCombobox
      :model-value="resolvedParagraphStyle.fontFamily"
      :options="dropCapFontFamilies"
      @update:model-value="onFontFamilyChanged"
    />
    <FontStyleSelect
      class="w-40"
      :model-value="resolvedParagraphStyle.fontStyle"
      :options="fontStyleOptions"
      :disabled="fontStyleOptions.length <= 1"
      @update:model-value="
        $emit('update', { fontStyle: $event } as Partial<DropCapElement>)
      "
    />
    <InputFontSize
      id="toolbar-drop-cap-font-size"
      :max="500"
      :model-value="resolvedParagraphStyle.fontSize"
      @update:model-value="
        $emit('update', { fontSize: $event } as Partial<DropCapElement>)
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
    </ToggleGroup>
  </Toolbar>
</template>

<script setup lang="ts">
import { PhTextB, PhTextItalic } from '@phosphor-icons/vue';
import type { PropType } from 'vue';
import { computed } from 'vue';

import FontCombobox from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import ParagraphStyleSelect from '@/components/ParagraphStyleSelect.vue';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Toolbar, ToolbarSeparator } from '@/components/ui/toolbar';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import type { DropCapElement } from '@/models/Element';
import {
  type ParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import { fontCatalog } from '@/services/FontCatalog';

const props = defineProps({
  element: {
    type: Object as PropType<DropCapElement>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
  paragraphStyles: {
    type: Array as PropType<ParagraphStyle[]>,
    required: true,
  },
});

const emit = defineEmits(['update']);

const resolvedParagraphStyle = computed(() =>
  resolveParagraphStyle(
    props.paragraphStyles,
    props.element.paragraphStyleId,
    props.element.getParagraphStyleOverrides(),
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
  () => resolvedParagraphStyle.value.fontFamily,
  () => resolvedParagraphStyle.value.fontStyle,
);

const styleValues = computed(() => [...activeStyleAxisValues.value]);

const dropCapFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);

function onStyleValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];

  emit('update', {
    fontStyle: applyStyleAxisToggles(values),
  } as Partial<DropCapElement>);
}

function onFontFamilyChanged(fontFamily: string) {
  emit('update', {
    fontFamily,
    fontStyle: remapStyleForFamily(fontFamily),
  } as Partial<DropCapElement>);
}
</script>
