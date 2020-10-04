<template>
  <span 
    class="staff-text" 
    :style="style"
    @dblclick="handleDoubleClick"
    @mousedown="handleMouseDown">
      <ContentEditable 
      class="staff-text-content"
      ref="text"
      :content="element.text" 
      @blur="updateText($event)"></ContentEditable>
</span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Neume as NeumeType } from '@/models/Neumes';
import { neumeMap } from '@/models/NeumeMappings';
import { StaffTextElement } from '@/models/Element';
import ContentEditable from '@/components/ContentEditable.vue';

@Component({
  components: {
    ContentEditable,
  },
})
export default class StaffText extends Vue {
  @Prop() element!: StaffTextElement;

  editable: boolean = false;

  startX: number = 0;
  startY: number = 0;

  get textElement() {
    return this.$refs.text as ContentEditable;
  }

  get style() {
    return {
      left: this.element.offset.x + 'px',
      top: this.element.offset.y + 'px',
    }
  }

  beforeDestroy() {
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  handleDoubleClick() {
    this.editable = true;
    this.textElement.focus();
    
    document.addEventListener('click', this.handleClick);
  }

  handleClick(e: MouseEvent) {
    const container = this.$el as HTMLElement;

    if (container !== e.target && !container.contains(e.target as Element)) {    
      this.editable = false;
      document.removeEventListener('click', this.handleClick);
    }
  }

  handleMouseDown(e: MouseEvent) {
    if (this.editable) {
      return;
    }

    e.preventDefault();

    this.startX = e.clientX - this.element.offset.x;
    this.startY = e.clientY - this.element.offset.y;
    
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove(e: MouseEvent) {
    e.preventDefault();

    this.element.offset.x = e.clientX - this.startX;
    this.element.offset.y = e.clientY - this.startY;
  }

  handleMouseUp() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  updateText(text: string) {
    this.element.text = text;
  }
}
</script>

<style scoped>
  .staff-text {
    position: relative;
    min-width: 10px;
    height: 100%;
    border: 1px dotted black;
  }

  .staff-text-content {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>