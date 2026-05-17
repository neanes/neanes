<template>
  <div
    ref="menu"
    class="menu-container"
    @mousedown="handleMouseDown"
    @mouseleave="handleMouseLeave"
  >
    <button class="neume-button" :disabled="disabled">
      <img
        v-if="mainIcon"
        draggable="false"
        :src="mainIcon"
        :style="imgStyle"
      />
      <span v-if="mainText" :style="textStyle">{{ mainText }}</span>
    </button>
    <div v-if="showMenu" class="menu" :class="direction">
      <div
        v-for="option in options"
        :key="getKey(option)"
        class="menu-item"
        @click="handleChoiceClick(option.neume)"
        @mouseenter="handleMouseEnter(option.neume)"
      >
        <img
          v-if="option.icon"
          draggable="false"
          :src="option.icon"
          :style="imgStyle"
        />
        <span v-if="option.text" :style="textStyle">{{ option.text }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, StyleValue } from 'vue';

import { ButtonMenuMode, EditorPreferences } from '@/models/EditorPreferences';
import { Neume } from '@/models/Neumes';

export interface ButtonWithMenuOption {
  icon?: string;
  text?: string;
  neume: Neume | Neume[];
}

export default defineComponent({
  components: {},
  inject: ['editorPreferences'],
  props: {
    direction: {
      type: String as PropType<'up' | 'down'>,
      default: 'up',
    },
    options: {
      type: Array as PropType<ButtonWithMenuOption[]>,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    fontFamily: {
      type: String,
      default: 'Neanes',
    },
    imgSize: {
      type: String,
      default: undefined,
    },
  },
  emits: ['select'],

  data() {
    return {
      showMenu: false,
      selectedOption: null as Neume | Neume[] | null,
    };
  },

  computed: {
    menuMode() {
      return (this.editorPreferences as EditorPreferences).buttonMenuMode;
    },
    mainIcon() {
      return this.direction === 'up'
        ? this.options.at(-1)!.icon
        : this.options[0].icon;
    },

    mainText() {
      return this.direction === 'up'
        ? this.options.at(-1)!.text
        : this.options[0].text;
    },

    textStyle() {
      return {
        fontFamily: this.fontFamily,
      } as StyleValue;
    },

    imgStyle() {
      return {
        height: this.imgSize ?? undefined,
        width: this.imgSize ?? undefined,
      } as StyleValue;
    },
  },

  mounted() {
    window.addEventListener('pointerdown', this.handleGlobalPointerDown);
  },

  beforeUnmount() {
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('pointerdown', this.handleGlobalPointerDown);
  },

  methods: {
    getKey(option: ButtonWithMenuOption) {
      return Array.isArray(option.neume) ? option.neume[0] : option.neume;
    },

    handleMouseDown() {
      if (this.disabled) {
        return;
      }

      this.showMenu = true;

      if (this.menuMode === ButtonMenuMode.Hold) {
        window.addEventListener('mouseup', this.onMouseUp);
      }
    },

    handleMouseEnter(selectedOption: Neume | Neume[]) {
      if (this.menuMode === ButtonMenuMode.Hold) {
        this.selectedOption = selectedOption;
      }
    },

    handleMouseLeave() {
      if (this.menuMode === ButtonMenuMode.Hold) {
        this.selectedOption = null;
      }
    },

    handleGlobalPointerDown(e: MouseEvent) {
      if (
        this.menuMode === ButtonMenuMode.Click &&
        !(this.$refs.menu as HTMLElement).contains(e.target as Node)
      ) {
        this.showMenu = false;
      }
    },

    handleChoiceClick(selectedOption: Neume | Neume[]) {
      if (this.menuMode === ButtonMenuMode.Click) {
        this.$emit('select', selectedOption);

        this.showMenu = false;
      }
    },

    onMouseUp() {
      if (this.selectedOption) {
        this.$emit('select', this.selectedOption);
      }

      this.showMenu = false;

      window.removeEventListener('mouseup', this.onMouseUp);
    },
  },
});
</script>

<style scoped>
.neume-button {
  height: var(--btn-size);
  width: var(--btn-size);

  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;

  user-select: none;
}

.neume-button img {
  height: var(--btn-size);
  width: var(--btn-size);
}

.menu-container {
  display: flex;
  position: relative;
  height: var(--btn-size);
}

.menu {
  position: absolute;
  z-index: 999;
  background-color: white;
  border: 1px solid black;
  box-sizing: border-box;
  width: var(--btn-size);
}

.menu.up {
  bottom: 0;
}

.menu.down {
  top: 0;
}

.menu-item {
  height: var(--btn-size);
  width: 100%;
  padding: 1px 0;
  box-sizing: border-box;
  text-align: center;
  user-select: none;
  overflow: hidden;
  position: relative;
}

.menu-item:hover {
  background-color: aliceblue;
}
</style>
