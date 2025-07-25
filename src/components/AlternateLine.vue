<template>
  <div
    class="alternate-line-container"
    :style="style"
    @mousedown="handleMouseDown"
    @dblclick="handleDoubleClick"
  >
    <template v-for="(element, index) in element.elements" :key="index">
      <NeumeBoxSyllable
        v-if="element.elementType === ElementType.Note"
        class="syllable-box"
        :note="element"
        :pageSetup="pageSetup"
        :alternateLine="true"
      />
      <NeumeBoxEmpty
        v-else-if="element.elementType === ElementType.Empty"
        class="empty-neume-box"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import { AlternateLineElement, ElementType } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

import NeumeBoxEmpty from './NeumeBoxEmpty.vue';
import NeumeBoxSyllable from './NeumeBoxSyllable.vue';

@Component({
  components: {
    NeumeBoxEmpty,
    NeumeBoxSyllable,
  },
  emits: ['update'],
})
export default class Annotation extends Vue {
  @Prop({ required: true }) element!: AlternateLineElement;
  @Prop({ required: true }) pageSetup!: PageSetup;

  ElementType = ElementType;

  startX: number = 0;
  startY: number = 0;

  get style() {
    return {
      left: withZoom(this.element.x),
      top: withZoom(this.element.y),
    };
  }

  beforeDestroy() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  async handleDoubleClick() {
    // TODO
  }

  handleMouseDown(e: MouseEvent) {
    this.startX = e.clientX - this.element.x;
    this.startY = e.clientY - this.element.y;

    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove(e: MouseEvent) {
    e.preventDefault();

    this.element.x = e.clientX - this.startX;
    this.element.y = e.clientY - this.startY;
  }

  handleMouseUp() {
    const { x, y } = this.element;
    this.$emit('update', { x, y });

    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
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
