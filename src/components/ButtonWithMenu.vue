<template>
  <div
    class="menu-container"
    @mousedown="openMenu"
    @mouseleave="selectedOption = null"
  >
    <button class="neume-button" :disabled="disabled">
      <img draggable="false" :src="mainIcon" v-if="mainIcon" />
      <span :style="textStyle" v-if="mainText">{{ mainText }}</span>
    </button>
    <div class="menu" v-if="showMenu">
      <div
        v-for="option in options"
        :key="getKey(option)"
        class="menu-item"
        @mouseenter="selectedOption = option.neume"
      >
        <img draggable="false" :src="option.icon" v-if="option.icon" />
        <span :style="textStyle" v-if="option.text">{{ option.text }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, StyleValue } from 'vue';

import { Neume } from '@/models/Neumes';

export interface ButtonWithMenuOption {
  icon?: string;
  text?: string;
  neume: Neume | Neume[];
}

export default defineComponent({
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

  beforeUnmount() {
    window.removeEventListener('mouseup', this.onMouseUp);
  },

  computed: {
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

    openMenu() {
      if (this.disabled) {
        return;
      }

      this.showMenu = true;
      window.addEventListener('mouseup', this.onMouseUp);
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
