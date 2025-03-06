<template>
  <div class="drop-cap-toolbar">
    <input
      id="toolbar-drop-cap-use-default-style"
      type="checkbox"
      :checked="element.useDefaultStyle"
      @change="
        $emit(
          'update:useDefaultStyle',
          ($event.target as HTMLInputElement).checked,
        )
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
          $emit('update:fontFamily', ($event.target as HTMLInputElement).value)
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
        @update:modelValue="$emit('update:fontSize', $event)"
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
        @update:modelValue="$emit('update:lineHeight', $event)"
      />
      <span class="space"></span>
      <ColorPicker
        :modelValue="element.color"
        @update:modelValue="$emit('update:color', $event)"
      />
      <span class="space"></span>
      <button
        class="icon-btn"
        :class="{ selected: bold }"
        @click="$emit('update:bold', !bold)"
      >
        <b>B</b>
      </button>
      <button
        class="icon-btn"
        :class="{ selected: italic }"
        @click="$emit('update:italic', !italic)"
      >
        <i>I</i>
      </button>
      <span class="space"></span>
      <label class="right-space">{{ $t('toolbar:common.outline') }}</label>
      <InputStrokeWidth
        :modelValue="element.strokeWidth"
        @update:modelValue="$emit('update:strokeWidth', $event)"
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
        @update:modelValue="$emit('update:lineSpan', $event)"
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
      @update:modelValue="$emit('update:customWidth', $event)"
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
import { Component, Prop, Vue } from 'vue-facing-decorator';

import ColorPicker from '@/components/ColorPicker.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import { DropCapElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

@Component({
  components: { ColorPicker, InputFontSize, InputStrokeWidth, InputUnit },
  emits: [
    'update:bold',
    'update:color',
    'update:customWidth',
    'update:fontFamily',
    'update:fontSize',
    'update:italic',
    'update:strokeWidth',
    'update:useDefaultStyle',
    'update:lineHeight',
    'update:lineSpan',
    'update:sectionName',
  ],
})
export default class ToolbarDropCap extends Vue {
  @Prop() element!: DropCapElement;
  @Prop() fonts!: string[];
  @Prop() pageSetup!: PageSetup;

  get bold() {
    return this.element.fontWeight === '700';
  }

  get italic() {
    return this.element.fontStyle === 'italic';
  }

  get dropCapFontFamilies() {
    return [
      'Source Serif',
      'Athonite',
      'GFS Didot',
      'Noto Naskh Arabic',
      'Omega',
      'PFGoudyInitials',
      ...this.fonts,
    ];
  }

  get maxWidth() {
    return Unit.toPt(this.pageSetup.innerPageWidth);
  }
}
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
