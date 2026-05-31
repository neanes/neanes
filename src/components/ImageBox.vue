<template>
  <div
    class="image-box-container"
    :style="containerStyle"
    @click="$emit('select-single')"
  >
    <img
      v-if="printMode"
      class="image-box"
      :src="element.data"
      :style="imageStyle"
    />

    <vue-draggable-resizable
      v-else
      :lock-aspect-ratio="element.lockAspectRatio"
      :w="imageWidthZoomed"
      :h="imageHeightZoomed"
      :min-height="10"
      :min-width="10"
      :draggable="false"
      :z="1"
      @resizing="onResize"
      @resize-stop="onResizeStop"
    >
      <img class="image-box" :src="element.data" :style="imageStyle" />
    </vue-draggable-resizable>
  </div>
</template>

<script setup lang="ts">
import 'vue-draggable-resizable/style.css';

import { computed, PropType, ref, StyleValue, watch } from 'vue';
import VueDraggableResizable from 'vue-draggable-resizable';

import { ImageBoxElement } from '@/models/Element';
import { withZoom } from '@/utils/withZoom';

const props = defineProps({
  element: {
    type: Object as PropType<ImageBoxElement>,
    required: true,
  },
  zoom: {
    type: Number,
    required: true,
  },
  printMode: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:size', 'select-single']);

const imageWidth = ref(props.element.imageWidth);
const imageHeight = ref(props.element.imageHeight);

const imageWidthZoomed = computed(() => imageWidth.value * props.zoom);
const imageHeightZoomed = computed(() => imageHeight.value * props.zoom);

const containerStyle = computed(() => {
  const style = {
    justifyContent: props.element.alignment,
    width: withZoom(props.element.width),
    height: withZoom(imageHeight.value),
  } as Partial<CSSStyleDeclaration>;

  if (props.element.inline) {
    style.border = 'none';
  }

  return style as StyleValue;
});

const imageStyle = computed(() => {
  const style: any = {
    width: withZoom(imageWidth.value),
    height: withZoom(imageHeight.value),
  };

  return style;
});

watch(
  () => props.element.imageWidth,
  (newValue) => {
    imageWidth.value = newValue;
  },
);

watch(
  () => props.element.imageHeight,
  (newValue) => {
    imageHeight.value = newValue;
  },
);

function onResize(x: number, y: number, width: number, height: number) {
  imageWidth.value = width / props.zoom;
  imageHeight.value = height / props.zoom;
}

function onResizeStop(
  left: number,
  top: number,
  width: number,
  height: number,
) {
  emit('update:size', {
    width: width / props.zoom,
    height: height / props.zoom,
  });
}
</script>

<style scoped>
.image-box-container {
  display: flex;
  align-items: center;

  border: 1px dotted black;
  box-sizing: border-box;

  min-height: 10px;
  min-width: 10px;
}

.vdr {
  border: none !important;
  transform: none !important;
}
</style>

<style>
@media print {
  .image-box-container .handle {
    display: none !important;
  }
}
</style>
