<template>
  <div class="lyrics-toolbar">
    <input
      id="toolbar-lyrics-use-default-style"
      type="checkbox"
      :checked="element.lyricsUseDefaultStyle"
      @change="
        $emit('update', {
          lyricsUseDefaultStyle: ($event.target as HTMLInputElement).checked,
        } as Partial<NoteElement>)
      "
    />
    <label for="toolbar-lyrics-use-default-style">{{
      $t('toolbar:common.useDefaultStyle')
    }}</label>
    <span class="divider" />
    <template v-if="!element.lyricsUseDefaultStyle">
      <select
        :value="element.lyricsFontFamily"
        @change="
          $emit('update', {
            lyricsFontFamily: ($event.target as HTMLInputElement).value,
          } as Partial<NoteElement>)
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
        @update:modelValue="
          $emit('update', {
            lyricsFontSize: $event,
          } as Partial<NoteElement>)
        "
      />
      <span class="space"></span>
      <ColorPicker
        :modelValue="element.lyricsColor"
        @update:modelValue="
          $emit('update', {
            lyricsColor: $event,
          } as Partial<NoteElement>)
        "
      />
      <span class="space"></span>
      <button
        class="icon-btn"
        :class="{ selected: bold }"
        @click="
          $emit('update', {
            lyricsFontWeight: !bold ? '700' : '400',
          } as Partial<NoteElement>)
        "
      >
        <b>B</b>
      </button>
      <button
        class="icon-btn"
        :class="{ selected: italic }"
        @click="
          $emit('update', {
            lyricsFontStyle: !italic ? 'italic' : 'normal',
          } as Partial<NoteElement>)
        "
      >
        <i>I</i>
      </button>
      <button
        class="icon-btn"
        :class="{ selected: underline }"
        @click="
          $emit('update', {
            lyricsTextDecoration: !underline ? 'underline' : 'none',
          } as Partial<NoteElement>)
        "
      >
        <u>U</u>
      </button>
      <span class="space"></span>
      <label class="right-space">{{ $t('toolbar:common.outline') }}</label>
      <InputStrokeWidth
        :modelValue="element.lyricsStrokeWidth"
        @update:modelValue="
          $emit('update', {
            lyricsStrokeWidth: $event,
          } as Partial<NoteElement>)
        "
      />
    </template>
    <span class="space" />
    <button
      class="icon-btn"
      @mousedown.prevent="$emit('insert:specialCharacter', PELASTIKON)"
    >
      <img
        src="@/assets/icons/letterPelastikon.svg"
        width="32"
        height="32"
        :title="$t('toolbar:common.insertPelastikon')"
      />
    </button>
    <button
      class="icon-btn"
      @mousedown.prevent="$emit('insert:specialCharacter', GORTHMIKON)"
    >
      <img
        src="@/assets/icons/letterGorthmikon.svg"
        width="32"
        height="32"
        :title="$t('toolbar:common.insertGorthmikon')"
      />
    </button>
    <span class="space" />
    <template v-for="character in specialCharacters" :key="character.value">
      <button
        class="icon-btn"
        :class="character.language"
        @mousedown.prevent="$emit('insert:specialCharacter', character.value)"
      >
        {{ character.value }}
      </button>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import ColorPicker from '@/components/ColorPicker.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import { NoteElement } from '@/models/Element';
import {
  E_MACRON,
  E_MACRON_SMALL,
  GORTHMIKON,
  GREEK_OU,
  GREEK_OU_SMALL,
  PELASTIKON,
  STIGMA,
  STIGMA_SMALL,
} from '@/utils/constants';

const specialCharacters = [
  { value: E_MACRON_SMALL, language: 'english' },
  { value: E_MACRON, language: 'english' },
  { value: STIGMA_SMALL, language: 'greek' },
  { value: STIGMA, language: 'greek' },
  { value: GREEK_OU_SMALL, language: 'greek' },
  { value: GREEK_OU, language: 'greek' },
];

export default defineComponent({
  components: { ColorPicker, InputFontSize, InputStrokeWidth },
  emits: ['insert:specialCharacter', 'update'],
  props: {
    element: {
      type: Object as PropType<NoteElement>,
      required: true,
    },
    fonts: {
      type: Array as PropType<string[]>,
      required: true,
    },
  },

  data() {
    return {
      GORTHMIKON,
      PELASTIKON,
      specialCharacters,
    };
  },

  computed: {
    bold() {
      return this.element.lyricsFontWeight === '700';
    },

    italic() {
      return this.element.lyricsFontStyle === 'italic';
    },

    underline() {
      return this.element.lyricsTextDecoration === 'underline';
    },

    lyricsFontFamilies() {
      return [
        'Source Serif',
        'GFS Didot',
        'Noto Naskh Arabic',
        'Old Standard',
        ...this.fonts,
      ];
    },
  },

  methods: {},
});
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
  font-size: 1.25rem;
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

.english {
  font-family: 'Source Serif';
}

.greek {
  font-family: 'GFS Didot';
}
</style>
