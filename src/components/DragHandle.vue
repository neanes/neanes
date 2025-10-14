<template>
  <span class="handle" :style="handleStyle" @mousedown="handleMouseDown" />
</template>

<script lang="ts">
import { defineComponent, PropType, StyleValue } from 'vue';

import { NoteElement, ScoreElementOffset } from '@/models/Element';
import { Neume, VocalExpressionNeume } from '@/models/Neumes';
import { fontService } from '@/services/FontService';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { withZoom } from '@/utils/withZoom';

export default defineComponent({
  components: {},
  emits: ['update'],
  props: {
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
  },

  data() {
    return {
      startX: 0,
      startY: 0,

      offset: { x: 0, y: 0 } as ScoreElementOffset,
    };
  },

  created() {
    this.offset = this.getOffset(this.mark);
  },

  beforeUnmount() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  },

  computed: {
    handleStyle() {
      const left = this.offset.x + (this.x ?? 0);
      const top = this.offset.y + (this.y ?? 0);

      return {
        position: 'absolute',
        left: `calc(${left}em - ${(this.zoom * this.width) / 2}px)`,
        top: `calc(${top}em - ${(this.zoom * this.height) / 2}px)`,
        fontSize: withZoom(this.fontSize),
        height: withZoom(this.height),
        width: withZoom(this.width),
      } as StyleValue;
    },
  },

  methods: {
    handleMouseDown(e: MouseEvent) {
      e.preventDefault();

      this.startX = e.clientX - (this.x ?? 0) * this.fontSize * this.zoom;
      this.startY = e.clientY - (this.y ?? 0) * this.fontSize * this.zoom;

      document.addEventListener('mouseup', this.handleMouseUp);
      document.addEventListener('mousemove', this.handleMouseMove);
    },

    handleMouseMove(e: MouseEvent) {
      e.preventDefault();

      const x = (e.clientX - this.startX) / this.fontSize / this.zoom;
      const y = (e.clientY - this.startY) / this.fontSize / this.zoom;

      this.$emit('update', { x, y });
    },

    handleMouseUp() {
      document.removeEventListener('mouseup', this.handleMouseUp);
      document.removeEventListener('mousemove', this.handleMouseMove);
    },
    getOffset(neume: Neume) {
      const mark = this.getMapping(neume).glyphName;
      const base = this.getMapping(this.note.quantitativeNeume).glyphName;

      const offset = fontService.getMarkAnchorOffset(
        this.fontFamily,
        base,
        mark,
      );

      // Shift offset for vareia
      if (this.note.vareia) {
        const vareiaGlyphName = this.getMapping(
          VocalExpressionNeume.Vareia,
        ).glyphName;

        const vareiaWidth = fontService.getAdvanceWidth(
          this.fontFamily,
          vareiaGlyphName,
        );
        offset.x += vareiaWidth;
      }

      // Shift offset for measure bar
      if (this.note.measureBarLeft) {
        const glyphName = this.getMapping(this.note.measureBarLeft).glyphName;

        const width = fontService.getAdvanceWidth(this.fontFamily, glyphName);
        offset.x += width;
      }

      return offset;
    },

    getMapping(neume: Neume) {
      return NeumeMappingService.getMapping(neume);
    },
  },
});
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
