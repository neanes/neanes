<template>
  <div class="text-box-toolbar">
    <select
      :value="element.fontFamily"
      @change="updateFontFamily(($event.target as HTMLInputElement).value)"
    >
      <option>Source Serif</option>
      <option>Athonite</option>
      <option>GFS Didot</option>
      <option>Noto Naskh Arabic</option>
      <option>Omega</option>

      <option v-for="font in fonts" :key="font" :value="font">
        {{ font }}
      </option>
    </select>
    <span class="space"></span>
    <select
      :value="element.fontFamily"
      @change="updateFontSize(($event.target as HTMLInputElement).value)"
    >
      <option>Source Serif</option>
      <option>Athonite</option>
      <option>GFS Didot</option>
      <option>Noto Naskh Arabic</option>
      <option>Omega</option>

      <option
        v-for="fontSize in fontSizes"
        :key="fontSize.value"
        :value="fontSize.value"
      >
        {{ fontSize.display }}
      </option>
    </select>
    <input type="number" />
    <span class="space" style="text-align: center">&#47;</span>
    <InputUnit
      class="drop-caps-input"
      unit="unitless"
      :nullable="true"
      :min="0"
      :step="0.1"
      :modelValue="element.lineHeight"
      :precision="2"
      placeholder="normal"
      @update:modelValue="$emit('update:lineHeight', $event)"
    />
    <span class="space"></span>
    <input
      type="color"
      @input="updateColor(($event.target as HTMLInputElement).value)"
      @mousedown.prevent
    />
    <span class="space"></span>
    <button class="icon-btn" @mousedown.prevent="updateBold">
      <b>B</b>
    </button>
    <button class="icon-btn" @mousedown.prevent="updateItalic">
      <i>I</i>
    </button>
    <button class="icon-btn" @mousedown.prevent="updateUnderline">
      <u>U</u>
    </button>
    <template v-if="!element.multipanel">
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
          :title="$t('toolbar:common.alignLeft')"
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
          :title="$t('toolbar:common.alignCenter')"
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
          :title="$t('toolbar:common.alignRight')"
        />
      </button>
    </template>
    <span class="space" />
    <label class="right-space">{{ $t('toolbar:common.outline') }}</label>
    <InputStrokeWidth
      :modelValue="element.strokeWidth"
      @update:modelValue="$emit('update:strokeWidth', $event)"
    />
    <span class="space" />
    <button class="icon-btn" @mousedown.prevent="$emit('insert:pelastikon')">
      <img
        src="@/assets/icons/letterPelastikon.svg"
        width="32"
        height="32"
        :title="$t('toolbar:common.insertPelastikon')"
      />
    </button>
    <button class="icon-btn" @mousedown.prevent="$emit('insert:gorthmikon')">
      <img
        src="@/assets/icons/letterGorthmikon.svg"
        width="32"
        height="32"
        :title="$t('toolbar:common.insertGorthmikon')"
      />
    </button>

    <template v-if="!element.inline">
      <span class="divider" />

      <input
        id="toolbar-text-box-multipanel"
        type="checkbox"
        :checked="element.multipanel"
        @change="
          $emit(
            'update:multipanel',
            ($event.target as HTMLInputElement).checked,
          )
        "
      />
      <label for="toolbar-text-box-multipanel">{{
        $t('toolbar:textbox.multipanel')
      }}</label></template
    >
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import ColorPicker from '@/components/ColorPicker.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import { TextBoxAlignment, TextBoxElement } from '@/models/Element';
import { Unit } from '@/utils/Unit';

@Component({
  components: { ColorPicker, InputFontSize, InputUnit, InputStrokeWidth },
  emits: [
    'insert:gorthmikon',
    'insert:pelastikon',
    'update:alignment',
    'update:bold',
    'update:color',
    'update:fontFamily',
    'update:fontSize',
    'update:italic',
    'update:lineHeight',
    'update:multipanel',
    'update:strokeWidth',
    'update:underline',
    'update:useDefaultStyle',
  ],
})
export default class ToolbarTextBoxRich extends Vue {
  @Prop() element!: TextBoxElement;
  @Prop() fonts!: string;

  TextBoxAlignment = TextBoxAlignment;

  range: Range | null = null;

  fontSizes = [
    {
      value: Unit.fromPt(12),
      display: '12',
    },
    {
      value: Unit.fromPt(14),
      display: '14',
    },
  ];

  updateFontFamily(fontFamily: string) {
    document.execCommand('fontName', false, fontFamily);
  }

  updateFontSize(fontSize: string) {
    document.execCommand('fontSize', false, `${fontSize}px`);
  }

  updateColor(color: string) {
    document.execCommand('foreColor', false, color);
  }

  updateBold() {
    document.execCommand('bold');
  }

  updateItalic() {
    document.execCommand('italic');
  }

  updateUnderline() {
    document.execCommand('underline');
  }

  saveSelection() {
    if (this.range == null) {
      const selection = window.getSelection();
      this.range = selection?.getRangeAt(0) ?? null;

      console.log('saveSelection', selection, this.range);
    }
  }

  restoreSelection() {
    console.log('restoreSelection');

    if (this.range != null) {
      const selection = window.getSelection();

      selection?.removeAllRanges();
      selection?.addRange(this.range);

      this.range = null;
    }
  }
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
