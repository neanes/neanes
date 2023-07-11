<template>
  <span class="handle" :style="handleStyle" @mousedown="handleMouseDown" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';
import ContentEditable from '@/components/ContentEditable.vue';
import { withZoom } from '@/utils/withZoom';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { Neume, VocalExpressionNeume } from '@/models/Neumes';
import { fontService } from '@/services/FontService';
import { NoteElement, ScoreElementOffset } from '@/models/save/v1/Element';
import { StyleValue } from 'vue';

@Component({
  components: { ContentEditable },
  emits: ['update'],
})
export default class DragHandle extends Vue {
  @Prop() x!: number | null;
  @Prop() y!: number | null;
  @Prop() fontSize!: number;
  @Prop({ default: 1 }) zoom!: number;
  @Prop() note!: NoteElement;
  @Prop() mark!: Neume;
  @Prop({ default: 8 }) height!: number;
  @Prop({ default: 8 }) width!: number;

  startX: number = 0;
  startY: number = 0;

  offset: ScoreElementOffset = { x: 0, y: 0 };

  created() {
    this.offset = this.getOffset(this.mark);
  }

  beforeUnmount() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseDown(e: MouseEvent) {
    e.preventDefault();

    this.startX = e.clientX - (this.x ?? 0) * this.fontSize * this.zoom;
    this.startY = e.clientY - (this.y ?? 0) * this.fontSize * this.zoom;

    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove(e: MouseEvent) {
    e.preventDefault();

    const x = (e.clientX - this.startX) / this.fontSize / this.zoom;
    const y = (e.clientY - this.startY) / this.fontSize / this.zoom;

    this.$emit('update', { x, y });
  }

  handleMouseUp() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  get handleStyle() {
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
  }

  getOffset(neume: Neume) {
    const mark = this.getMapping(neume).glyphName;
    const base = this.getMapping(this.note.quantitativeNeume).glyphName;

    const offset = fontService.getMarkAnchorOffset(base, mark);

    // Shift offset for vareia
    if (this.note.vareia) {
      const vareiaGlyphName = this.getMapping(
        VocalExpressionNeume.Vareia,
      ).glyphName;

      const vareiaWidth = fontService.getAdvanceWidth(vareiaGlyphName);
      offset.x += vareiaWidth;
    }

    // Shift offset for measure bar
    if (this.note.measureBarLeft) {
      const glyphName = this.getMapping(this.note.measureBarLeft).glyphName;

      const width = fontService.getAdvanceWidth(glyphName);
      offset.x += width;
    }

    return offset;
  }

  getMapping(neume: Neume) {
    return NeumeMappingService.getMapping(neume);
  }
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
