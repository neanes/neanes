<template>
  <div class="lyrics-toolbar" @mousedown.prevent.self>
    <input
      id="toolbar-lyrics-use-default-style"
      type="checkbox"
      :checked="element.useDefaultStyle"
      @change="
        $emit(
          'update:useDefaultStyle',
          ($event.target as HTMLInputElement).checked,
        )
      "
    />
    <label for="toolbar-lyrics-use-default-style">Use default style</label>
    <span class="divider" />
    <template v-if="!element.useDefaultStyle">
      <ColorPicker
        :modelValue="element.lyricsColor"
        @update:modelValue="$emit('update:lyricsColor', $event)"
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

import ColorPicker from '@/components/ColorPicker.vue';
import { NoteElement } from '@/models/Element';

@Component({
  components: { ColorPicker },
  emits: [
    'insert:gorthmikon',
    'insert:pelastikon',
    'update:lyricsColor',
    'update:useDefaultStyle',
  ],
})
export default class ToolbarLyrics extends Vue {
  @Prop() element!: NoteElement;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.lyrics-toolbar {
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

.divider {
  height: 32px;
  border-right: 1px solid #666;
  margin: 0 0.5rem;
}

.icon-btn.selected {
  background-color: var(--btn-color-selected);
}

.space {
  width: 16px;
}
</style>
