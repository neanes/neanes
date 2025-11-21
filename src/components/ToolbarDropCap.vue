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
      $t('toolbar:common.useDefaultStyle')
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
        :modelValue="element.fontSize"
        @update:modelValue="
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
        :modelValue="element.lineHeight"
        :precision="2"
        placeholder="auto"
        @update:modelValue="
          $emit('update', {
            lineHeight: $event,
          } as Partial<DropCapElement>)
        "
      />
      <span class="space"></span>
      <ColorPicker
        :modelValue="element.color"
        @update:modelValue="
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
      <label class="right-space">{{ $t('toolbar:common.outline') }}</label>
      <InputStrokeWidth
        :modelValue="element.strokeWidth"
        @update:modelValue="
          $emit('update', {
            strokeWidth: $event,
          } as Partial<DropCapElement>)
        "
      />
      <span class="divider" />
      <label class="right-space">{{ $t('toolbar:dropCap.lineSpan') }}</label>
      <InputUnit
        class="drop-caps-input-width"
        unit="unitless"
        :min="1"
        :max="10"
        :step="1"
        :modelValue="element.lineSpan"
        :precision="0"
        @update:modelValue="
          $emit('update', {
            lineSpan: $event,
          } as Partial<DropCapElement>)
        "
      />
      <span class="divider" />
    </template>
    <label class="right-space">{{ $t('toolbar:common.width') }}</label>
    <InputUnit
      class="drop-caps-input-width"
      unit="pt"
      :nullable="true"
      :min="4"
      :max="maxWidth"
      :step="0.5"
      :modelValue="element.customWidth"
      :precision="1"
      placeholder="auto"
      @update:modelValue="
        $emit('update', {
          customWidth: $event,
        } as Partial<DropCapElement>)
      "
    />

    <span class="space"></span>
    <div class="form-group">
      <label class="right-space">{{ $t('toolbar:common.sectionName') }}</label>
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

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import ColorPicker from '@/components/ColorPicker.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import { DropCapElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

export default defineComponent({
  components: { ColorPicker, InputFontSize, InputStrokeWidth, InputUnit },
  emits: ['update', 'update:sectionName'],
  props: {
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
  },

  data() {
    return {};
  },

  computed: {
    bold() {
      return this.element.fontWeight === '700';
    },

    italic() {
      return this.element.fontStyle === 'italic';
    },

    dropCapFontFamilies() {
      return [
        'Source Serif',
        'GFS Didot',
        'Noto Naskh Arabic',
        'Old Standard',
        ...this.fonts,
      ];
    },

    maxWidth() {
      return Unit.toPt(this.pageSetup.innerPageWidth);
    },
  },

  methods: {},
});
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
