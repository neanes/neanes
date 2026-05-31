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
export interface ButtonWithMenuOption {
  icon?: string;
  text?: string;
  neume: import('@/models/Neumes').Neume | import('@/models/Neumes').Neume[];
}
</script>

<script setup lang="ts">
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
  StyleValue,
  useTemplateRef,
} from 'vue';

import { editorPreferencesKey } from '@/injectionKeys';
import { ButtonMenuMode } from '@/models/EditorPreferences';
import { Neume } from '@/models/Neumes';

const emit = defineEmits(['select']);
const props = defineProps({
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
});

const editorPreferences = inject(editorPreferencesKey)!;

const menu = useTemplateRef<HTMLElement>('menu');
const showMenu = ref(false);
const selectedOption = ref<Neume | Neume[] | null>(null);

const menuMode = computed(() => editorPreferences.value.buttonMenuMode);

const mainIcon = computed(() => {
  return props.direction === 'up'
    ? props.options.at(-1)!.icon
    : props.options[0].icon;
});

const mainText = computed(() => {
  return props.direction === 'up'
    ? props.options.at(-1)!.text
    : props.options[0].text;
});

const textStyle = computed(() => {
  return {
    fontFamily: props.fontFamily,
  } as StyleValue;
});

const imgStyle = computed(() => {
  return {
    height: props.imgSize ?? undefined,
    width: props.imgSize ?? undefined,
  } as StyleValue;
});

onMounted(() => {
  window.addEventListener('pointerdown', handleGlobalPointerDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('pointerdown', handleGlobalPointerDown);
});

function getKey(option: ButtonWithMenuOption) {
  return Array.isArray(option.neume) ? option.neume[0] : option.neume;
}

function handleMouseDown() {
  if (props.disabled) {
    return;
  }

  showMenu.value = true;

  if (menuMode.value === ButtonMenuMode.Hold) {
    window.addEventListener('mouseup', onMouseUp);
  }
}

function handleMouseEnter(option: Neume | Neume[]) {
  if (menuMode.value === ButtonMenuMode.Hold) {
    selectedOption.value = option;
  }
}

function handleMouseLeave() {
  if (menuMode.value === ButtonMenuMode.Hold) {
    selectedOption.value = null;
  }
}

function handleGlobalPointerDown(e: MouseEvent) {
  if (
    menuMode.value === ButtonMenuMode.Click &&
    !menu.value?.contains(e.target as Node)
  ) {
    showMenu.value = false;
  }
}

function handleChoiceClick(option: Neume | Neume[]) {
  if (menuMode.value === ButtonMenuMode.Click) {
    emit('select', option);

    showMenu.value = false;
  }
}

function onMouseUp() {
  if (selectedOption.value) {
    emit('select', selectedOption.value);
  }

  showMenu.value = false;

  window.removeEventListener('mouseup', onMouseUp);
}
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
