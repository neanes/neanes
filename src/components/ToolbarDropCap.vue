<template>
  <div class="drop-cap-toolbar">
    <input
      id="toolbar-drop-cap-use-default-style"
      type="checkbox"
      :checked="element.useDefaultStyle"
      @change="
        $emit('update', {
          useDefaultStyle: ($event.target as HTMLInputElement).checked,
        } as Partial<DropCapElement>)
      "
    />
    <label for="toolbar-drop-cap-use-default-style">{{
      $t(($) => $.toolbar.common.useDefaultStyle, { ns: 'toolbar' })
    }}</label>
    <span class="divider" />
    <template v-if="!element.useDefaultStyle">
      <select
        :value="element.fontFamily"
        @change="
          $emit('update', {
            fontFamily: ($event.target as HTMLInputElement).value,
          } as Partial<DropCapElement>)
        "
      >
        <option v-for="font in dropCapFontFamilies" :key="font" :value="font">
          {{ font }}
        </option>
      </select>
      <span class="space"></span>
      <InputFontSize
        class="drop-caps-input"
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
        class="drop-caps-input"
        unit="unitless"
        :nullable="true"
        :min="0"
        :step="0.1"
        :model-value="element.lineHeight"
        :precision="2"
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
      <label class="right-space">{{
        $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
      }}</label>
      <InputStrokeWidth
        :model-value="element.strokeWidth"
        @update:model-value="
          $emit('update', {
            strokeWidth: $event,
          } as Partial<DropCapElement>)
        "
      />
      <span class="divider" />
      <label class="right-space">{{
        $t(($) => $.toolbar.dropCap.lineSpan, { ns: 'toolbar' })
      }}</label>
      <InputUnit
        class="drop-caps-input-width"
        unit="unitless"
        :min="1"
        :max="10"
        :step="1"
        :model-value="element.lineSpan"
        :precision="0"
        @update:model-value="
          $emit('update', {
            lineSpan: $event,
          } as Partial<DropCapElement>)
        "
      />
      <span class="divider" />
    </template>
    <label class="right-space">{{
      $t(($) => $.toolbar.common.width, { ns: 'toolbar' })
    }}</label>
    <InputUnit
      class="drop-caps-input-width"
      unit="pt"
      :nullable="true"
      :min="4"
      :max="maxWidth"
      :step="0.5"
      :model-value="element.customWidth"
      :precision="1"
      placeholder="auto"
      @update:model-value="
        $emit('update', {
          customWidth: $event,
        } as Partial<DropCapElement>)
      "
    />

    <span class="space"></span>
    <div class="form-group">
      <label class="right-space">{{
        $t(($) => $.toolbar.common.sectionName, { ns: 'toolbar' })
      }}</label>
      <input
        type="text"
        :value="element.sectionName"
        @change="
          $emit('update:sectionName', ($event.target as HTMLInputElement).value)
        "
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';

import ColorPicker from '@/components/ColorPicker.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import { DropCapElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
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

  background-color: lightgray;

  padding: 0.25rem;
}

.drop-caps-input-width {
  width: 8ch;
}

.icon-btn {
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn.selected {
  background-color: var(--btn-color-selected);
}

label.right-space {
  margin-right: 0.5rem;
}

.divider {
  height: 32px;
  border-right: 1px solid #666;
  margin: 0 0.5rem;
}

.space {
  width: 16px;
}
</style>
