<template>
  <div class="lyrics-toolbar">
    <input
      id="toolbar-lyrics-use-default-style"
      type="checkbox"
      :checked="element.lyricsUseDefaultStyle"
      @change="
        $emit(
          'update:lyricsUseDefaultStyle',
          ($event.target as HTMLInputElement).checked,
        )
      "
    />
    <label for="toolbar-lyrics-use-default-style">Use default style</label>
    <span class="divider" />
    <template v-if="!element.lyricsUseDefaultStyle">
      <select
        :value="element.lyricsFontFamily"
        @change="
          $emit(
            'update:lyricsFontFamily',
            ($event.target as HTMLInputElement).value,
          )
        "
      >
        <option v-for="font in lyricsFontFamilies" :key="font" :value="font">
          {{ font }}
        </option>
      </select>
      <span class="space"></span>
      <InputFontSize
        class="lyrics-input"
        :modelValue="element.lyricsFontSize"
        @update:modelValue="$emit('update:lyricsFontSize', $event)"
      />
      <span class="space"></span>
      <ColorPicker
        :modelValue="element.lyricsColor"
        @update:modelValue="$emit('update:lyricsColor', $event)"
      />
      <span class="space"></span>
      <button
        class="icon-btn"
        :class="{ selected: bold }"
        @click="$emit('update:lyricsFontWeight', !bold)"
      >
        <b>B</b>
      </button>
      <button
        class="icon-btn"
        :class="{ selected: italic }"
        @click="$emit('update:lyricsFontStyle', !italic)"
      >
        <i>I</i>
      </button>
      <button
        class="icon-btn"
        :class="{ selected: underline }"
        @click="$emit('update:lyricsTextDecoration', !underline)"
      >
        <u>U</u>
      </button>
      <span class="space"></span>
      <label class="right-space">Outline</label>
      <InputStrokeWidth
        :modelValue="element.lyricsStrokeWidth"
        @update:modelValue="$emit('update:lyricsStrokeWidth', $event)"
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
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import { NoteElement } from '@/models/Element';

@Component({
  components: { ColorPicker, InputFontSize, InputStrokeWidth },
  emits: [
    'insert:gorthmikon',
    'insert:pelastikon',
    'update:lyricsColor',
    'update:lyricsFontFamily',
    'update:lyricsFontSize',
    'update:lyricsFontStyle',
    'update:lyricsFontWeight',
    'update:lyricsStrokeWidth',
    'update:lyricsTextDecoration',
    'update:lyricsUseDefaultStyle',
  ],
})
export default class ToolbarLyrics extends Vue {
  @Prop() element!: NoteElement;
  @Prop() fonts!: string[];

  get bold() {
    return this.element.lyricsFontWeight === '700';
  }

  get italic() {
    return this.element.lyricsFontStyle === 'italic';
  }

  get underline() {
    return this.element.lyricsTextDecoration === 'underline';
  }

  get lyricsFontFamilies() {
    return [
      'Source Serif',
      'GFS Didot',
      'Noto Naskh Arabic',
      'Omega',
      ...this.fonts,
    ];
  }
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
