<template>
  <div class="color-picker-container">
    <div ref="swatch" class="swatch" @click="open">
      <div class="swatch--color" :style="colorStyle" />
    </div>
    <template v-if="isOpen">
      <div class="popover" :style="popupStyle">
        <div class="cover" @click="close" />
        <Sketch
          :model-value="color"
          :preset-colors="presetColors"
          :disable-alpha="true"
          @update:model-value="onColorChanged"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Sketch } from '@ckpack/vue-color';
import type { StyleValue } from 'vue';
import { computed, ref, useTemplateRef, watch } from 'vue';

interface Color {
  hex: string;
}

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  historyKey: {
    type: String,
    default: 'colorPicker_presetColors',
  },
});

const swatch = useTemplateRef<HTMLElement>('swatch');
const isOpen = ref(false);
const presetColors = ref<string[]>([]);
const popupPositionTop = ref(0);
const maxHistorySize = 8;
const color = ref(props.modelValue);

const colorStyle = computed(() => {
  return {
    backgroundColor: color.value,
  } as StyleValue;
});

const popupStyle = computed(() => {
  return {
    top: `${popupPositionTop.value}px`,
  } as StyleValue;
});

watch(
  () => props.modelValue,
  (newValue) => {
    color.value = newValue;
  },
);

function open() {
  presetColors.value = JSON.parse(localStorage.getItem(props.historyKey)!) || [
    '#000000',
    '#800000',
    '#FF0000',
  ];

  // Fist, try to position the popup underneath the swatch
  popupPositionTop.value =
    swatch.value!.getBoundingClientRect().top + swatch.value!.offsetHeight;

  // If the popover goes off the bottom of the screen, position above the swatch
  const popoverHeightPx = 260;

  if (popupPositionTop.value + popoverHeightPx > window.innerHeight) {
    popupPositionTop.value -= popoverHeightPx + swatch.value!.offsetHeight;
  }

  isOpen.value = true;
}

function onColorChanged(colorValue: Color) {
  color.value = colorValue.hex;
}

function close() {
  const index = presetColors.value.indexOf(color.value);

  if (index >= 0) {
    presetColors.value.splice(index, 1);
  }

  presetColors.value.unshift(color.value);
  presetColors.value = presetColors.value.slice(0, maxHistorySize);
  localStorage.setItem(props.historyKey, JSON.stringify(presetColors.value));

  isOpen.value = false;

  if (color.value !== props.modelValue) {
    emit('update:modelValue', color.value);
  }
}
</script>

<style scoped>
.color-picker-container {
  display: flex;
  width: 46px;
  height: 24px;
}

.swatch {
  padding: 5px;
  background: white;
  border-radius: 1px;
  box-shadow: rgb(0 0 0 / 10%) 0px 0px 0px 1px;
  display: flex;
  cursor: pointer;
  flex: 1;
}

.swatch--color {
  border-radius: 2px;
  flex: 1;
}

.popover {
  position: fixed;
  z-index: 1;
}

.cover {
  position: fixed;
  top: 0px;
  right: 0px;
  bottom: 0px;
  left: 0px;
  /* pointer-events: none; */
}
</style>
