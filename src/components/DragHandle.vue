<template>
  <span class="handle" :style="handleStyle" @mousedown="handleMouseDown" />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, PropType, ref, StyleValue } from 'vue';

import { NoteElement, ScoreElementOffset } from '@/models/Element';
import { Neume, VocalExpressionNeume } from '@/models/Neumes';
import { fontService } from '@/services/FontService';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { withZoom } from '@/utils/withZoom';

const emit = defineEmits(['update']);
const props = defineProps({
  x: {
    type: [Number, null],
    required: true,
  },
  y: {
    type: [Number, null],
    required: true,
  },
  fontSize: {
    type: Number,
    required: true,
  },
  zoom: {
    type: Number,
    default: 1,
  },
  note: {
    type: Object as PropType<NoteElement>,
    required: true,
  },
  mark: {
    type: String as PropType<Neume>,
    required: true,
  },
  height: {
    type: Number,
    default: 8,
  },
  width: {
    type: Number,
    default: 8,
  },
  fontFamily: {
    type: String,
    required: true,
  },
});

const startX = ref(0);
const startY = ref(0);
const offset = ref<ScoreElementOffset>(getOffset(props.mark));

const handleStyle = computed(() => {
  const left = offset.value.x + (props.x ?? 0);
  const top = offset.value.y + (props.y ?? 0);

  return {
    position: 'absolute',
    left: `calc(${left}em - ${(props.zoom * props.width) / 2}px)`,
    top: `calc(${top}em - ${(props.zoom * props.height) / 2}px)`,
    fontSize: withZoom(props.fontSize),
    height: withZoom(props.height),
    width: withZoom(props.width),
  } as StyleValue;
});

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('mousemove', handleMouseMove);
});

function handleMouseDown(e: MouseEvent) {
  e.preventDefault();

  startX.value = e.clientX - (props.x ?? 0) * props.fontSize * props.zoom;
  startY.value = e.clientY - (props.y ?? 0) * props.fontSize * props.zoom;

  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousemove', handleMouseMove);
}

function handleMouseMove(e: MouseEvent) {
  e.preventDefault();

  const x = (e.clientX - startX.value) / props.fontSize / props.zoom;
  const y = (e.clientY - startY.value) / props.fontSize / props.zoom;

  emit('update', { x, y });
}

function handleMouseUp() {
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('mousemove', handleMouseMove);
}

function getOffset(neume: Neume) {
  const mark = getMapping(neume).glyphName;
  const base = getMapping(props.note.quantitativeNeume).glyphName;

  const offset = fontService.getMarkAnchorOffset(props.fontFamily, base, mark);

  // Shift offset for vareia
  if (props.note.vareia) {
    const vareiaGlyphName = getMapping(VocalExpressionNeume.Vareia).glyphName;

    const vareiaWidth = fontService.getAdvanceWidth(
      props.fontFamily,
      vareiaGlyphName,
    );
    offset.x += vareiaWidth;
  }

  // Shift offset for measure bar
  if (props.note.measureBarLeft) {
    const glyphName = getMapping(props.note.measureBarLeft).glyphName;

    const width = fontService.getAdvanceWidth(props.fontFamily, glyphName);
    offset.x += width;
  }

  return offset;
}

function getMapping(neume: Neume) {
  return NeumeMappingService.getMapping(neume);
}
</script>

<style scoped>
.handle {
  position: relative;
  z-index: 999;
  background-color: lightskyblue;
  display: inline-block;
  opacity: 0.6;
}
</style>
