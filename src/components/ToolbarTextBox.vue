<template>
  <div class="text-box-toolbar">
    <input
      id="toolbar-text-box-use-default-style"
      type="checkbox"
      :checked="element.useDefaultStyle"
      @change="
        $emit(
          'update:useDefaultStyle',
          ($event.target as HTMLInputElement).checked,
        )
      "
    />
    <label for="toolbar-text-box-use-default-style">{{
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
      <InputFontSize
        class="drop-caps-input"
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
        placeholder="normal"
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
    <template v-if="!element.useDefaultStyle">
      <span class="space" />
      <label class="right-space">{{ $t('toolbar:common.outline') }}</label>
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
      }}</label>
      <span class="divider" />

      <template v-if="!element.multipanel">
        <label class="right-space">{{ $t('toolbar:common.height') }}</label>
        <InputUnit
          class="text-box-input-width"
          unit="pt"
          :nullable="true"
          :min="0.5"
          :max="maxWidth"
          :step="0.5"
          :modelValue="element.customHeight"
          :precision="1"
          placeholder="auto"
          @update:modelValue="$emit('update:customHeight', $event)"
        />
      </template>
    </template>
    <template v-else>
      <label class="right-space">{{ $t('toolbar:common.width') }}</label>
      <InputUnit
        class="text-box-input-width"
        unit="pt"
        :nullable="true"
        :min="0.5"
        :max="maxWidth"
        :step="0.5"
        :modelValue="element.customWidth"
        :precision="1"
        placeholder="auto"
        @update:modelValue="$emit('update:customWidth', $event)"
      />
    </template>
    <span class="space"></span>
    <div class="form-group">
      <label class="right-space">{{ $t('toolbar:common.marginTop') }}</label>
      <InputUnit
        class="text-box-input-width"
        unit="pt"
        :min="0"
        :max="maxHeight"
        :step="0.5"
        :modelValue="element.marginTop"
        :precision="1"
        @update:modelValue="$emit('update:marginTop', $event)"
      />
    </div>
    <span class="space"></span>
    <div class="form-group">
      <label class="right-space">{{ $t('toolbar:common.marginBottom') }}</label>
      <InputUnit
        class="text-box-input-width"
        unit="pt"
        :min="0"
        :max="maxHeight"
        :step="0.5"
        :modelValue="element.marginBottom"
        :precision="1"
        @update:modelValue="$emit('update:marginBottom', $event)"
      />
    </div>
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
import { TextBoxAlignment, TextBoxElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

@Component({
  components: { ColorPicker, InputFontSize, InputUnit, InputStrokeWidth },
  emits: [
    'insert:gorthmikon',
    'insert:pelastikon',
    'update:alignment',
    'update:bold',
    'update:color',
    'update:customHeight',
    'update:customWidth',
    'update:fontFamily',
    'update:fontSize',
    'update:italic',
    'update:lineHeight',
    'update:marginBottom',
    'update:marginTop',
    'update:multipanel',
    'update:sectionName',
    'update:strokeWidth',
    'update:underline',
    'update:useDefaultStyle',
  ],
})
export default class ToolbarTextBox extends Vue {
  @Prop() element!: TextBoxElement;
  @Prop() fonts!: string;
  @Prop() pageSetup!: PageSetup;

  TextBoxAlignment = TextBoxAlignment;

  get maxWidth() {
    return Unit.toPt(this.pageSetup.innerPageWidth);
  }

  get maxHeight() {
    return Unit.toPt(this.pageSetup.innerPageHeight);
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

.text-box-input-width {
  width: 8ch;
}
</style>
