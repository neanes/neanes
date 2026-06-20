<template>
  <div
    ref="container"
    class="alternate-line-container"
    :style="style"
    @mousedown="handleMouseDown"
  >
    <template v-for="(childElement, index) in element.elements" :key="index">
      <NeumeBoxSyllable
        v-if="childElement.elementType === ElementType.Note"
        class="syllable-box"
        :note="childElement as NoteElement"
        :page-setup="pageSetup"
        :alternate-line="true"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

import type { AlternateLineElement, NoteElement } from '@/models/Element';
import { ElementType } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

import NeumeBoxSyllable from './NeumeBoxSyllable.vue';

const emit = defineEmits(['update']);
const props = defineProps({
  element: {
    type: Object as PropType<AlternateLineElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

const container = useTemplateRef<HTMLElement>('container');
const offsetX = ref(0);
const offsetY = ref(0);
const elementX = ref(0);
const elementY = ref(0);
const zoom = ref(1);
const clampingInterval = ref<ReturnType<typeof setTimeout> | null>(null);

const style = computed(() => {
  return {
    left: withZoom(elementX.value),
    top: withZoom(elementY.value),
    minHeight: withZoom(props.pageSetup.alternateLineDefaultFontSize),
  };
});

onMounted(() => {
  elementX.value = props.element.x;
  elementY.value = props.element.y;
  clampingInterval.value = setInterval(clampToPageBounds, 250);
});

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('mousemove', handleMouseMove);

  if (clampingInterval.value != null) {
    clearInterval(clampingInterval.value);
  }
});

function handleMouseDown(e: MouseEvent) {
  // We only calculate zoom once when the mouse is pressed down
  // to avoid recalculating it on every mouse move
  zoom.value = Number(
    getComputedStyle(container.value!).getPropertyValue('--zoom'),
  );

  const draggedEl = container.value!;
  const rect = draggedEl.getBoundingClientRect();

  // Calculate the offset of the mouse click relative to the element
  offsetX.value = e.clientX - rect.left;
  offsetY.value = e.clientY - rect.top;

  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousemove', handleMouseMove);
}

function handleMouseMove(e: MouseEvent) {
  e.preventDefault();

  const draggedEl = container.value!;
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
  const desiredLeft = e.clientX - offsetX.value;
  const desiredTop = e.clientY - offsetY.value;

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

  elementX.value = newX / zoom.value;
  elementY.value = newY / zoom.value;
}

function handleMouseUp() {
  emit('update', { x: elementX.value, y: elementY.value });

  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('mousemove', handleMouseMove);
}

function clampToPageBounds() {
  const el = container.value;

  if (!el) {
    return;
  }

  const pageEl = el.closest('.page') as HTMLElement;
  const offsetParent = el.offsetParent as HTMLElement;

  if (!pageEl || !offsetParent) {
    return;
  }

  const zoom = Number(
    getComputedStyle(container.value!).getPropertyValue('--zoom'),
  );

  const elRect = el.getBoundingClientRect();
  const pageRect = pageEl.getBoundingClientRect();
  const parentRect = offsetParent.getBoundingClientRect();

  const elWidth = elRect.width;
  const elHeight = elRect.height;

  // Current position relative to offset parent
  const currentX = elementX.value * zoom;
  const currentY = elementY.value * zoom;

  // Convert .page bounds into offsetParent-relative coordinates
  const minX = pageRect.left - parentRect.left;
  const minY = pageRect.top - parentRect.top;
  const maxX = pageRect.right - parentRect.left - elWidth;
  const maxY = pageRect.bottom - parentRect.top - elHeight;

  // Clamp
  elementX.value = Math.max(minX, Math.min(currentX, maxX)) / zoom;
  elementY.value = Math.max(minY, Math.min(currentY, maxY)) / zoom;
}
</script>

<style scoped>
.alternate-line-container {
  position: absolute;
  white-space: nowrap;
  z-index: 42;
  cursor: default;
  min-width: 10px;
  min-height: 10px;
  display: flex;
}
</style>
