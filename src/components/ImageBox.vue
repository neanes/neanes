<template>
  <div class="image-box-container" :style="containerStyle">
    <vue-draggable-resizable
      :lock-aspect-ratio="element.lockAspectRatio"
      :w="imageWidthZoomed"
      :h="imageHeightZoomed"
      :minHeight="10"
      :minWidth="10"
      :draggable="false"
      :z="1"
      @resizing="onResize"
      @resizestop="onResizeStop"
    >
      <img class="image-box" :src="element.data" :style="imageStyle" />
    </vue-draggable-resizable>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ImageBoxElement } from '@/models/Element';
import ContentEditable from '@/components/ContentEditable.vue';
import { withZoom } from '@/utils/withZoom';

@Component({
  components: {
    ContentEditable,
  },
})
export default class ImageBox extends Vue {
  @Prop() element!: ImageBoxElement;
  @Prop() zoom!: number;

  get imageWidthZoomed() {
    return this.element.imageWidth * this.zoom;
  }

  get imageHeightZoomed() {
    return this.element.imageHeight * this.zoom;
  }

  get containerStyle() {
    const style = {
      justifyContent: this.element.alignment,
      width: withZoom(this.element.width),
      height: withZoom(this.element.imageHeight),
    } as CSSStyleDeclaration;

    if (this.element.inline) {
      style.border = 'none';
    }

    return style;
  }

  get imageStyle() {
    const style: any = {
      width: withZoom(this.element.imageWidth),
      height: withZoom(this.element.imageHeight),
    };

    return style;
  }

  onResize(x: number, y: number, width: number, height: number) {
    this.element.imageWidth = width / this.zoom;
    this.element.imageHeight = height / this.zoom;
  }

  onResizeStop(left: number, top: number, width: number, height: number) {
    this.$emit('update:size', {
      width: width / this.zoom,
      height: height / this.zoom,
    });
  }
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