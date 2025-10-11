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
      :minHeight="10"
      :minWidth="10"
      :draggable="false"
      :z="1"
      @resizing="onResize"
      @resizeStop="onResizeStop"
    >
      <img class="image-box" :src="element.data" :style="imageStyle" />
    </vue-draggable-resizable>
  </div>
</template>

<script lang="ts">
import 'vue-draggable-resizable/style.css';

import { defineComponent, PropType, StyleValue } from 'vue';
import VueDraggableResizable from 'vue-draggable-resizable';

import { ImageBoxElement } from '@/models/Element';
import { withZoom } from '@/utils/withZoom';

export default defineComponent({
  components: { VueDraggableResizable },
  emits: ['update:size', 'select-single'],
  props: {
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
  },

  data() {
    return {
      imageWidth: 0,
      imageHeight: 0,
    };
  },

  computed: {
    imageWidthZoomed() {
      return this.imageWidth * this.zoom;
    },

    imageHeightZoomed() {
      return this.imageHeight * this.zoom;
    },

    containerStyle() {
      const style = {
        justifyContent: this.element.alignment,
        width: withZoom(this.element.width),
        height: withZoom(this.imageHeight),
      } as Partial<CSSStyleDeclaration>;

      if (this.element.inline) {
        style.border = 'none';
      }

      return style as StyleValue;
    },

    imageStyle() {
      const style: any = {
        width: withZoom(this.imageWidth),
        height: withZoom(this.imageHeight),
      };

      return style;
    },
  },

  created() {
    this.imageWidth = this.element.imageWidth;
    this.imageHeight = this.element.imageHeight;
  },

  watch: {
    'element.imageWidth'(newValue: number) {
      this.imageWidth = newValue;
    },
    'element.imageHeight'(newValue: number) {
      this.imageHeight = newValue;
    },
  },

  methods: {
    onResize(x: number, y: number, width: number, height: number) {
      this.imageWidth = width / this.zoom;
      this.imageHeight = height / this.zoom;
    },

    onResizeStop(left: number, top: number, width: number, height: number) {
      this.$emit('update:size', {
        width: width / this.zoom,
        height: height / this.zoom,
      });
    },
  },
});
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
