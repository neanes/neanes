<template>
  <div class="text-box-toolbar">
    <div class="form-group">
      <input
        id="toolbar-text-box-rtl"
        type="checkbox"
        :checked="element.rtl"
        @change="
          $emit('update:rtl', ($event.target as HTMLInputElement).checked)
        "
      />
      <label for="toolbar-text-box-rtl">{{ $t('toolbar:textbox.rtl') }}</label>
    </div>
    <span class="divider" />
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

import InputUnit from '@/components/InputUnit.vue';
import { RichTextBoxElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

@Component({
  components: { InputUnit },
  emits: [
    'update:marginBottom',
    'update:marginTop',
    'update:rtl',
    'update:sectionName',
  ],
})
export default class ToolbarTextBoxRich extends Vue {
  @Prop() element!: RichTextBoxElement;
  @Prop() pageSetup!: PageSetup;

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
