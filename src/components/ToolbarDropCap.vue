<template>
  <div class="drop-cap-toolbar">
    <input
      id="toolbar-drop-cap-use-default-style"
      type="checkbox"
      :checked="element.useDefaultStyle"
      @change="$emit('update:useDefaultStyle', $event.target.checked)"
    />
    <label for="toolbar-drop-cap-use-default-style">Use default style</label>
    <span class="divider" />
    <template v-if="!element.useDefaultStyle">
      <select
        :value="element.fontFamily"
        @change="$emit('update:fontFamily', $event.target.value)"
      >
        <option v-for="font in dropCapFontFamilies" :key="font" :value="font">
          {{ font }}
        </option>
      </select>
      <span class="space"></span>
      <InputFontSize
        class="drop-caps-input"
        :value="element.fontSize"
        @input="$emit('update:fontSize', $event)"
      />
      <span class="space"></span>
      <InputUnit
        class="drop-caps-input"
        unit="unitless"
        :nullable="true"
        :min="0"
        :step="0.1"
        :value="element.lineHeight"
        placeholder="Line Height"
        @input="$emit('update:lineHeight', $event)"
      />
      <span class="space"></span>
      <ColorPicker
        :value="element.color"
        @input="$emit('update:color', $event)"
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
      <label class="right-space">Outline</label>
      <InputStrokeWidth
        :value="element.strokeWidth"
        @input="$emit('update:strokeWidth', $event)"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { DropCapElement } from '@/models/Element';
import ColorPicker from '@/components/ColorPicker.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';

@Component({
  components: { ColorPicker, InputFontSize, InputStrokeWidth, InputUnit },
})
export default class ToolbarDropCap extends Vue {
  @Prop() element!: DropCapElement;
  @Prop() fonts!: string;

  get bold() {
    return this.element.fontWeight === '700';
  }

  get italic() {
    return this.element.fontStyle === 'italic';
  }

  get dropCapFontFamilies() {
    return ['Athonite', 'Omega', 'PFGoudyInitials', ...this.fonts];
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
