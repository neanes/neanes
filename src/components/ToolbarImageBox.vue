<template>
  <div class="image-box-toolbar">
    <div style="display: flex; align-items: center">
      <input
        id="toolbar-image-box-inline"
        type="checkbox"
        :checked="element.inline"
        @change="
          $emit('update:inline', ($event.target as HTMLInputElement).checked)
        "
      />
      <label for="toolbar-image-box-inline">{{
        $t('toolbar:common.inline')
      }}</label>
    </div>

    <span class="space" />

    <div style="display: flex; align-items: center">
      <input
        id="toolbar-image-box-lock-aspect-ratio"
        type="checkbox"
        :checked="element.lockAspectRatio"
        @change="
          $emit(
            'update:lockAspectRatio',
            ($event.target as HTMLInputElement).checked,
          )
        "
      />
      <label for="toolbar-image-box-lock-aspect-ratio">{{
        $t('toolbar:imageBox.maintainAspectRatio')
      }}</label>
    </div>

    <span class="space" />

    <div style="display: flex; align-items: center">
      <label class="right-space">{{ $t('toolbar:imageBox.width') }}</label>
      <InputUnit
        :modelValue="element.imageWidth"
        @update:modelValue="onChangeWidth($event)"
        unit="unitless"
        :min="10"
        :max="pageSetup.pageWidth"
        :step="1"
        :precision="0"
      />
    </div>

    <span class="space" />

    <div style="display: flex; align-items: center">
      <label class="right-space">{{ $t('toolbar:imageBox.height') }}</label>
      <InputUnit
        :modelValue="element.imageHeight"
        @update:modelValue="onChangeHeight($event)"
        unit="unitless"
        :min="10"
        :max="pageSetup.pageHeight"
        :step="1"
        :precision="0"
      />
    </div>
    <template v-if="!element.inline">
      <span class="space" />
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
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import { ImageBoxElement, TextBoxAlignment } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';

import InputUnit from './InputUnit.vue';

@Component({
  components: { InputUnit },
  emits: [
    'update:alignment',
    'update:inline',
    'update:lockAspectRatio',
    'update:size',
  ],
})
export default class ToolbarImageBox extends Vue {
  @Prop() element!: ImageBoxElement;
  @Prop() pageSetup!: PageSetup;

  TextBoxAlignment = TextBoxAlignment;

  onChangeHeight(value: number) {
    const aspectRatio = this.element.aspectRatio;

    this.element.imageHeight = value;

    if (this.element.lockAspectRatio) {
      this.element.imageWidth = this.element.imageHeight * aspectRatio;
    }

    this.$emit('update:size', {
      width: this.element.imageWidth,
      height: this.element.imageHeight,
    });
  }

  onChangeWidth(value: number) {
    const aspectRatio = this.element.aspectRatio;

    this.element.imageWidth = value;

    if (this.element.lockAspectRatio) {
      this.element.imageHeight = this.element.imageWidth / aspectRatio;
    }

    this.$emit('update:size', {
      width: this.element.imageWidth,
      height: this.element.imageHeight,
    });
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.image-box-toolbar {
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
