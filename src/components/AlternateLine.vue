<template>
  <div
    class="alternate-line-container"
    :style="style"
    @mousedown="handleMouseDown"
  >
    <template v-for="(element, index) in element.elements" :key="index">
      <NeumeBoxSyllable
        v-if="element.elementType === ElementType.Note"
        class="syllable-box"
        :note="element"
        :pageSetup="pageSetup"
        :alternateLine="true"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import { AlternateLineElement, ElementType } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

import NeumeBoxSyllable from './NeumeBoxSyllable.vue';

@Component({
  components: {
    NeumeBoxSyllable,
  },
  emits: ['update'],
})
export default class Annotation extends Vue {
  @Prop({ required: true }) element!: AlternateLineElement;
  @Prop({ required: true }) pageSetup!: PageSetup;

  ElementType = ElementType;

  offsetX: number = 0;
  offsetY: number = 0;

  zoom: number = 1;

  clampingInterval: ReturnType<typeof setTimeout> | null = null;

  get style() {
    return {
      left: withZoom(this.element.x),
      top: withZoom(this.element.y),
      minHeight: withZoom(this.pageSetup.alternateLineDefaultFontSize),
    };
  }

  mounted() {
    this.clampingInterval = setInterval(this.clampToPageBounds, 250);
  }

  beforeDestroy() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);

    if (this.clampingInterval != null) {
      clearInterval(this.clampingInterval);
    }
  }

  handleMouseDown(e: MouseEvent) {
    // We only calculate zoom once when the mouse is pressed down
    // to avoid recalculating it on every mouse move
    this.zoom = Number(getComputedStyle(this.$el).getPropertyValue('--zoom'));

    const draggedEl = this.$el as HTMLElement;
    const rect = draggedEl.getBoundingClientRect();

    // Calculate the offset of the mouse click relative to the element
    this.offsetX = e.clientX - rect.left;
    this.offsetY = e.clientY - rect.top;

    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove(e: MouseEvent) {
    e.preventDefault();

    const draggedEl = this.$el as HTMLElement;
    const pageEl = draggedEl.closest('.page') as HTMLElement;
    if (!draggedEl || !pageEl) {
      console.warn('Could not find dragged element or page element');
      return;
    }

    const elRect = draggedEl.getBoundingClientRect();
    const pageRect = pageEl.getBoundingClientRect();

    const elWidth = elRect.width;
    const elHeight = elRect.height;

    // Compute desired top-left corner of element in viewport space
    const desiredLeft = e.clientX - this.offsetX;
    const desiredTop = e.clientY - this.offsetY;

    // Clamp those values to page bounds
    const clampedLeft = Math.max(
      pageRect.left,
      Math.min(desiredLeft, pageRect.right - elWidth),
    );
    const clampedTop = Math.max(
      pageRect.top,
      Math.min(desiredTop, pageRect.bottom - elHeight),
    );

    // Convert clamped screen coords into coordinates relative to the element's offsetParent
    const offsetParent = draggedEl.offsetParent as HTMLElement;
    const parentRect = offsetParent.getBoundingClientRect();

    const newX = clampedLeft - parentRect.left;
    const newY = clampedTop - parentRect.top;

    this.element.x = newX / this.zoom;
    this.element.y = newY / this.zoom;
  }

  handleMouseUp() {
    const { x, y } = this.element;
    this.$emit('update', { x, y });

    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  clampToPageBounds() {
    const el = this.$el as HTMLElement;
    const pageEl = el.closest('.page') as HTMLElement;
    const offsetParent = el.offsetParent as HTMLElement;

    if (!el || !pageEl || !offsetParent) {
      return;
    }

    const zoom = Number(getComputedStyle(this.$el).getPropertyValue('--zoom'));

    const elRect = el.getBoundingClientRect();
    const pageRect = pageEl.getBoundingClientRect();
    const parentRect = offsetParent.getBoundingClientRect();

    const elWidth = elRect.width;
    const elHeight = elRect.height;

    // Current position relative to offset parent
    const currentX = this.element.x * zoom;
    const currentY = this.element.y * zoom;

    // Convert .page bounds into offsetParent-relative coordinates
    const minX = pageRect.left - parentRect.left;
    const minY = pageRect.top - parentRect.top;
    const maxX = pageRect.right - parentRect.left - elWidth;
    const maxY = pageRect.bottom - parentRect.top - elHeight;

    // Clamp
    this.element.x = Math.max(minX, Math.min(currentX, maxX)) / zoom;
    this.element.y = Math.max(minY, Math.min(currentY, maxY)) / zoom;
  }
}
</script>

<style scoped>
.alternate-line-container {
  position: absolute;
  white-space: nowrap;
  z-index: 1000;
  cursor: default;
  min-width: 10px;
  min-height: 10px;
  display: flex;
}
</style>
