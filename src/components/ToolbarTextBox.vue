<template>
  <div class="text-box-toolbar">
    <template v-if="element.inline">
      <input
        id="toolbar-text-box-use-default-style"
        type="checkbox"
        :checked="element.useDefaultStyle"
        @change="$emit('update:useDefaultStyle', $event.target.checked)"
      />
      <label for="toolbar-text-box-use-default-style">Use default style</label>
      <span class="divider" />
    </template>
    <template v-if="!element.inline || !element.useDefaultStyle">
      <select
        :value="element.fontFamily"
        @change="$emit('update:fontFamily', $event.target.value)"
      >
        <option>Athonite</option>
        <option>Omega</option>

        <option v-for="font in fonts" :key="font" :value="font">
          {{ font }}
        </option>
      </select>
      <span class="space"></span>
      <InputFontSize
        class="drop-caps-input"
        :modelValue="element.fontSize"
        @update:modelValue="$emit('update:fontSize', $event)"
      />
      <span class="space"></span>
      <ColorPicker
        :modelValue="element.color"
        @update:modelValue="$emit('update:color', $event)"
      />
      <span class="space"></span>
      <button
        class="icon-btn"
        :class="{ selected: element.bold }"
        @click="$emit('update:bold', !element.bold)"
      >
        <b>B</b>
      </button>
      <button
        class="icon-btn"
        :class="{ selected: element.italic }"
        @click="$emit('update:italic', !element.italic)"
      >
        <i>I</i>
      </button>
    </template>
    <button
      class="icon-btn"
      :class="{ selected: element.underline }"
      @click="$emit('update:underline', !element.underline)"
    >
      <u>U</u>
    </button>
    <span class="space"></span>
    <button
      class="icon-btn"
      :class="{ selected: element.alignment === TextBoxAlignment.Left }"
      @click="$emit('update:alignment', TextBoxAlignment.Left)"
    >
      <img
        src="@/assets/icons/alignleft.svg"
        width="32"
        height="32"
        title="Align Left"
      />
    </button>
    <button
      class="icon-btn"
      :class="{ selected: element.alignment === TextBoxAlignment.Center }"
      @click="$emit('update:alignment', TextBoxAlignment.Center)"
    >
      <img
        src="@/assets/icons/aligncenter.svg"
        width="32"
        height="32"
        title="Align Center"
      />
    </button>
    <button
      class="icon-btn"
      :class="{ selected: element.alignment === TextBoxAlignment.Right }"
      @click="$emit('update:alignment', TextBoxAlignment.Right)"
    >
      <img
        src="@/assets/icons/alignright.svg"
        width="32"
        height="32"
        title="Align Right"
      />
    </button>
    <template v-if="!element.inline || !element.useDefaultStyle">
      <span class="space" />
      <label class="right-space">Outline</label>
      <InputStrokeWidth
        :modelValue="element.strokeWidth"
        @update:modelValue="$emit('update:strokeWidth', $event)"
      />
    </template>
    <span class="space" />
    <button class="icon-btn" @mousedown.prevent="$emit('insert:pelastikon')">
      <img
        src="@/assets/icons/letterPelastikon.svg"
        width="32"
        height="32"
        title="Insert Pelastikon"
      />
    </button>
    <button class="icon-btn" @mousedown.prevent="$emit('insert:gorthmikon')">
      <img
        src="@/assets/icons/letterGorthmikon.svg"
        width="32"
        height="32"
        title="Insert Gorthmikon"
      />
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';
import { TextBoxAlignment, TextBoxElement } from '@/models/Element';
import ColorPicker from '@/components/ColorPicker.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';

@Component({
  components: { ColorPicker, InputFontSize, InputStrokeWidth },
  emits: [
    'insert:gorthmikon',
    'insert:pelastikon',
    'update:alignment',
    'update:bold',
    'update:color',
    'update:fontFamily',
    'update:fontSize',
    'update:italic',
    'update:strokeWidth',
    'update:underline',
    'update:useDefaultStyle',
  ],
})
export default class ToolbarTextBox extends Vue {
  @Prop() element!: TextBoxElement;
  @Prop() fonts!: string;

  TextBoxAlignment = TextBoxAlignment;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.text-box-toolbar {
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
