<template>
  <span class="handle" :style="handleStyle" @mousedown="handleMouseDown" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import ContentEditable from '@/components/ContentEditable.vue';
import { withZoom } from '@/utils/withZoom';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { Neume, VocalExpressionNeume } from '@/models/Neumes';
import { fontService } from '@/services/FontService';
import { NoteElement, ScoreElementOffset } from '@/models/save/v1/Element';

@Component({
  components: {
    ContentEditable,
  },
})
export default class DragHandle extends Vue {
  @Prop() x!: number | null;
  @Prop() y!: number | null;
  @Prop() fontSize!: number;
  @Prop() note!: NoteElement;
  @Prop() mark!: Neume;
  @Prop({ default: 0.25 }) height!: number;
  @Prop({ default: 0.25 }) width!: number;

  startX: number = 0;
  startY: number = 0;

  offset: ScoreElementOffset = { x: 0, y: 0 };

  created() {
    this.offset = this.getOffset(this.mark);
  }

  beforeDestroy() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseDown(e: MouseEvent) {
    e.preventDefault();

    this.startX = e.clientX - (this.x ?? 0) * this.fontSize;
    this.startY = e.clientY - (this.y ?? 0) * this.fontSize;

    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove(e: MouseEvent) {
    e.preventDefault();

    const x = (e.clientX - this.startX) / this.fontSize;
    const y = (e.clientY - this.startY) / this.fontSize;

    this.$emit('update', { x, y });
  }

  handleMouseUp() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  get handleStyle() {
    const left = this.offset.x + (this.x ?? 0) - this.width / 2;
    const top = this.offset.y + (this.y ?? 0) - this.height / 2;

    return {
      position: 'absolute',
      left: left + 'em',
      top: top + 'em',
      fontSize: withZoom(this.fontSize),
      height: withZoom(this.height, 'em'),
      width: withZoom(this.width, 'em'),
    } as CSSStyleDeclaration;
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
}
</style>
