<template>
  <div
    class="menu-container"
    @mousedown="handleMouseDown"
    @mouseleave="handleMouseLeave"
  >
    <button class="neume-button" :disabled="disabled" @click="handleClick">
      <img draggable="false" :src="mainIcon" v-if="mainIcon" />
      <span :style="textStyle" v-if="mainText">{{ mainText }}</span>
    </button>
    <div class="menu" v-if="showMenu">
      <div
        v-for="option in options"
        :key="getKey(option)"
        class="menu-item"
        @click="handleChoiceClick(option.neume)"
        @mouseenter="handleMouseEnter(option.neume)"
      >
        <img draggable="false" :src="option.icon" v-if="option.icon" />
        <span :style="textStyle" v-if="option.text">{{ option.text }}</span>
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
  inject: ['editorPreferences'],
  components: {},
  emits: ['select'],
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
  },

  data() {
    return {
      showMenu: false,
      selectedOption: null as Neume | Neume[] | null,
    };
  },

  mounted() {
    window.addEventListener('pointerdown', this.handleGlobalPointerDown);
  },

  beforeUnmount() {
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('pointerdown', this.handleGlobalPointerDown);
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
  },

  methods: {
    getKey(option: ButtonWithMenuOption) {
      return Array.isArray(option.neume) ? option.neume[0] : option.neume;
    },

    handleMouseDown() {
      if (this.menuMode === ButtonMenuMode.Hold) {
        if (this.disabled) {
          return;
        }

        this.showMenu = true;
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
        !this.$el.contains(e.target)
      ) {
        this.showMenu = false;
      }
    },

    handleClick() {
      if (this.menuMode === ButtonMenuMode.Click) {
        if (this.disabled) {
          return;
        }

        this.showMenu = true;
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
  bottom: 0;
}

.menu-item {
  height: var(--btn-size);
  width: 100%;
  padding: 3px 0;
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
