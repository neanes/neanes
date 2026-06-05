<template>
  <div class="drop-cap-toolbar">
    <Checkbox
      id="toolbar-drop-cap-use-default-style"
      class="bg-background"
      :model-value="element.useDefaultStyle"
      @update:model-value="
        $emit('update', {
          useDefaultStyle: $event === true,
        } as Partial<DropCapElement>)
      "
    />
    <Label for="toolbar-drop-cap-use-default-style" class="ml-2">{{
      $t(($) => $.toolbar.common.useDefaultStyle, { ns: 'toolbar' })
    }}</Label>
    <span class="divider" />
    <template v-if="!element.useDefaultStyle">
      <FontCombobox
        :model-value="element.fontFamily"
        :options="dropCapFontFamilies"
        @update:model-value="
          $emit('update', {
            fontFamily: $event,
          } as Partial<DropCapElement>)
        "
      />
      <span class="space"></span>
      <InputFontSize
        id="toolbar-drop-cap-font-size"
        :max="500"
        :model-value="element.fontSize"
        @update:model-value="
          $emit('update', {
            fontSize: $event,
          } as Partial<DropCapElement>)
        "
      />
      <span class="space" style="text-align: center">&#47;</span>
      <InputUnit
        id="toolbar-drop-cap-line-height"
        unit="unitless"
        :nullable="true"
        :min="0"
        :step="0.1"
        :model-value="element.lineHeight"
        :format-options="fraction2FormatOptions"
        placeholder="auto"
        @update:model-value="
          $emit('update', {
            lineHeight: $event,
          } as Partial<DropCapElement>)
        "
      />
      <span class="space"></span>
      <ColorPicker
        :model-value="element.color"
        @update:model-value="
          $emit('update', {
            color: $event,
          } as Partial<DropCapElement>)
        "
      />
      <span class="space"></span>
      <button
        class="icon-btn"
        :class="{ selected: bold }"
        @click="
          $emit('update', {
            fontWeight: !bold ? '700' : '400',
          } as Partial<DropCapElement>)
        "
      >
        <b>B</b>
      </button>
      <button
        class="icon-btn"
        :class="{ selected: italic }"
        @click="
          $emit('update', {
            fontStyle: !italic ? 'italic' : 'normal',
          } as Partial<DropCapElement>)
        "
      >
        <i>I</i>
      </button>
      <span class="space"></span>
      <Label for="toolbar-drop-cap-outline">{{
        $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
      }}</Label>
      <InputStrokeWidth
        id="toolbar-drop-cap-outline"
        :model-value="element.strokeWidth"
        @update:model-value="
          $emit('update', {
            strokeWidth: $event,
          } as Partial<DropCapElement>)
        "
      />
      <span class="divider" />
      <Label for="toolbar-drop-cap-line-span" class="mr-2">{{
        $t(($) => $.toolbar.dropCap.lineSpan, { ns: 'toolbar' })
      }}</Label>
      <InputUnit
        id="toolbar-drop-cap-line-span"
        unit="unitless"
        :min="1"
        :max="10"
        :step="1"
        :model-value="element.lineSpan"
        :format-options="fraction0FormatOptions"
        @update:model-value="
          $emit('update', {
            lineSpan: $event,
          } as Partial<DropCapElement>)
        "
      />
      <span class="divider" />
    </template>
    <Label for="toolbar-drop-cap-width" class="mr-2">{{
      $t(($) => $.toolbar.common.width, { ns: 'toolbar' })
    }}</Label>
    <InputUnit
      id="toolbar-drop-cap-width"
      unit="pt"
      :nullable="true"
      :min="4"
      :max="maxWidth"
      :step="0.5"
      :model-value="element.customWidth"
      :format-options="fraction1FormatOptions"
      placeholder="auto"
      @update:model-value="
        $emit('update', {
          customWidth: $event,
        } as Partial<DropCapElement>)
      "
    />

    <span class="space"></span>
    <Label for="toolbar-drop-cap-section-name" class="mr-2">{{
      $t(($) => $.toolbar.common.sectionName, { ns: 'toolbar' })
    }}</Label>
    <Input
      id="toolbar-drop-cap-section-name"
      class="w-auto bg-background"
      type="text"
      :model-value="element.sectionName ?? ''"
      @change="
        $emit('update:sectionName', ($event.target as HTMLInputElement).value)
      "
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';

import ColorPicker from '@/components/ColorPicker.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DropCapElement } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import {
  fraction0FormatOptions,
  fraction1FormatOptions,
  fraction2FormatOptions,
} from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

const props = defineProps({
  element: {
    type: Object as PropType<DropCapElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

defineEmits(['update', 'update:sectionName']);

const bold = computed(() => props.element.fontWeight === '700');
const italic = computed(() => props.element.fontStyle === 'italic');

const dropCapFontFamilies = computed(() => [
  'Source Serif',
  'GFS Didot',
  'Noto Naskh Arabic',
  'Old Standard',
  ...props.fonts,
]);

const maxWidth = computed(() => Unit.toPt(props.pageSetup.innerPageWidth));
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.drop-cap-toolbar {
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
  user-select: none;
}

.icon-btn:hover {
  background: revert;
}

.icon-btn.selected {
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

.divider {
  height: 32px;
  border-right: 1px solid var(--color-legacy-chrome-divider);
  margin: 0 0.5rem;
}

.space {
  width: 16px;
}
</style>
