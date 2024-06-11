<template>
  <div class="text-box-toolbar">
    <input
      id="toolbar-text-box-rtl"
      type="checkbox"
      :checked="element.rtl"
      @change="$emit('update:rtl', ($event.target as HTMLInputElement).checked)"
    />
    <label for="toolbar-text-box-rtl">{{ $t('toolbar:textbox.rtl') }}</label>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import { RichTextBoxElement } from '@/models/Element';

@Component({
  components: {},
  emits: ['update:rtl'],
})
export default class ToolbarTextBoxRich extends Vue {
  @Prop() element!: RichTextBoxElement;
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
