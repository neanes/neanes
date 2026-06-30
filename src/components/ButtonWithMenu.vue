<template>
  <AppTooltip :tooltip="tooltip">
    <template #default="{ ariaLabel }">
      <div
        ref="menu"
        class="menu-container"
        @mousedown="handleMouseDown"
        @mouseleave="handleMouseLeave"
      >
        <ToolbarButton
          type="button"
          variant="secondary"
          class="chrome-button"
          :aria-label="ariaLabel"
          :disabled="disabled"
          @click="handleButtonClick"
        >
          <NeumeIcon v-if="mainIcon" :name="mainIcon" :size="imgSize" />
          <span v-if="mainText" :style="pargraphStyle">{{ mainText }}</span>
        </ToolbarButton>
        <div v-if="showMenu" class="menu chrome-menu" :class="direction">
          <div
            v-for="option in options"
            :key="getKey(option)"
            class="menu-item chrome-menu-item"
            @click="handleChoiceClick(option.neume)"
            @mouseenter="handleMouseEnter(option.neume)"
          >
            <NeumeIcon v-if="option.icon" :name="option.icon" :size="imgSize" />
            <span v-if="option.text" :style="pargraphStyle">{{
              option.text
            }}</span>
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
import NeumeIcon from './NeumeIcon.vue';
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

const pargraphStyle = computed(() => {
  return {
    fontFamily: props.fontFamily,
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
.menu-container {
  display: flex;
  position: relative;
  height: var(--chrome-button-size);
}

.menu {
  position: absolute;
  z-index: 40;
  width: var(--chrome-button-size);
}

.menu.up {
  bottom: 0;
}

.menu.down {
  top: 0;
}

.menu-item {
  height: var(--chrome-button-size);
  width: 100%;
  padding: 1px 0;
}
</style>
