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
import { defineComponent, PropType } from 'vue';

import { AlternateLineElement, ElementType } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

import NeumeBoxSyllable from './NeumeBoxSyllable.vue';

export default defineComponent({
  components: { NeumeBoxSyllable },
  emits: ['update'],
  props: {
    element: {
      type: Object as PropType<AlternateLineElement>,
      required: true,
    },
    pageSetup: {
      type: Object as PropType<PageSetup>,
      required: true,
    },
  },

  data() {
    return {
      offsetX: 0,
      offsetY: 0,
      elementX: 0,
      elementY: 0,

      zoom: 1,
      ElementType,

      clampingInterval: null as ReturnType<typeof setTimeout> | null,
    };
  },

  computed: {
    style() {
      return {
        left: withZoom(this.elementX),
        top: withZoom(this.elementY),
        minHeight: withZoom(this.pageSetup.alternateLineDefaultFontSize),
      };
    },
  },

  mounted() {
    this.elementX = this.element.x;
    this.elementY = this.element.y;
    this.clampingInterval = setInterval(this.clampToPageBounds, 250);
  },

  beforeUnmount() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);

    if (this.clampingInterval != null) {
      clearInterval(this.clampingInterval);
    }
  },

  methods: {
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
    },

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

      this.elementX = newX / this.zoom;
      this.elementY = newY / this.zoom;
    },

    handleMouseUp() {
      this.$emit('update', { x: this.elementX, y: this.elementY });

      document.removeEventListener('mouseup', this.handleMouseUp);
      document.removeEventListener('mousemove', this.handleMouseMove);
    },

    clampToPageBounds() {
      const el = this.$el as HTMLElement;
      const pageEl = el.closest('.page') as HTMLElement;
      const offsetParent = el.offsetParent as HTMLElement;

      if (!el || !pageEl || !offsetParent) {
        return;
      }

      const zoom = Number(
        getComputedStyle(this.$el).getPropertyValue('--zoom'),
      );

      const elRect = el.getBoundingClientRect();
      const pageRect = pageEl.getBoundingClientRect();
      const parentRect = offsetParent.getBoundingClientRect();

      const elWidth = elRect.width;
      const elHeight = elRect.height;

      // Current position relative to offset parent
      const currentX = this.elementX * zoom;
      const currentY = this.elementY * zoom;

      // Convert .page bounds into offsetParent-relative coordinates
      const minX = pageRect.left - parentRect.left;
      const minY = pageRect.top - parentRect.top;
      const maxX = pageRect.right - parentRect.left - elWidth;
      const maxY = pageRect.bottom - parentRect.top - elHeight;

      // Clamp
      this.elementX = Math.max(minX, Math.min(currentX, maxX)) / zoom;
      this.elementY = Math.max(minY, Math.min(currentY, maxY)) / zoom;
    },
  },
});
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
