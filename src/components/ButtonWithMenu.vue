<template>
  <AppTooltip :tooltip="tooltip">
    <template #default="{ ariaLabel }">
      <div
        ref="menu"
        class="menu-container"
        :aria-label="ariaLabel"
        @mousedown="handleMouseDown"
        @mouseleave="handleMouseLeave"
      >
        <ToolbarButton
          type="button"
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-label="ariaLabel"
          :disabled="disabled"
          @click="handleButtonClick"
        >
          <img
            v-if="mainIcon"
            draggable="false"
            :src="mainIcon"
            :style="imgStyle"
          />
          <span v-if="mainText" :style="textStyle">{{ mainText }}</span>
        </ToolbarButton>
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
  </AppTooltip>
</template>

<script setup lang="ts">
import type { PropType, StyleValue } from 'vue';
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
} from 'vue';

import { editorPreferencesKey } from '@/injectionKeys';
import { ButtonMenuMode } from '@/models/EditorPreferences';
import type { Neume } from '@/models/Neumes';

import type { AppTooltipValue } from './AppTooltip.types';
import AppTooltip from './AppTooltip.vue';
import type { ButtonWithMenuOption } from './ButtonWithMenu.types';
import { ToolbarButton } from './ui/toolbar';

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
  tooltip: {
    type: [String, Object] as PropType<AppTooltipValue>,
    default: undefined,
  },
});

const editorPreferences = inject(editorPreferencesKey)!;

const menu = useTemplateRef<HTMLElement>('menu');
const showMenu = ref(false);
const selectedOption = ref<Neume | Neume[] | null>(null);

const menuMode = computed(() => editorPreferences.value.buttonMenuMode);

const mainOption = computed(() => {
  return props.direction === 'up' ? props.options.at(-1)! : props.options[0];
});

const mainIcon = computed(() => {
  return mainOption.value.icon;
});

const mainText = computed(() => {
  return mainOption.value.text;
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

function handleButtonClick(event: MouseEvent) {
  if (props.disabled || event.detail !== 0) {
    return;
  }

  emit('select', mainOption.value.neume);

  showMenu.value = false;
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
  box-sizing: border-box;
  height: var(--btn-size);
  width: var(--btn-size);
  appearance: auto;
  background: revert;
  border: revert;
  border-radius: revert;
  box-shadow: revert;
  font-weight: revert;

  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;
  outline: revert;
  padding: 0;
  transition: revert;

  user-select: none;
}

.neume-button:hover {
  background: revert;
}

.neume-button:disabled,
.neume-button[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.5;
}

.neume-button img {
  height: var(--btn-size);
  max-width: none;
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
  background-color: var(--color-legacy-chrome-surface);
  border: 1px solid var(--color-legacy-chrome-border);
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
  background-color: var(--color-legacy-chrome-hover);
}
</style>
