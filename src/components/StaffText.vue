<template>
  <div class="staff-text-container">
      <ContentEditable 
        ref="text"
        class="staff-text" 
        :style="style"
        :content="element.text" 
        :class="[{ selected: element == selectedElement }]"
        :editable="editable"
        @dblclick.native="handleDoubleClick"
        @mousedown.native="handleMouseDown"
        @blur="updateText($event)"></ContentEditable>
      </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Neume as NeumeType } from '@/models/Neumes';
import { ScoreElement } from '@/models/Element';
import { neumeMap } from '@/models/NeumeMappings';
import { StaffTextElement } from '@/models/Element';
import ContentEditable from '@/components/ContentEditable.vue';
import { store } from '@/store';

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

  get selectedElement() {
    return store.state.selectedElement;
  }

  set selectedElement(element: ScoreElement | null) {
    store.mutations.setSelectedElement(element);
  }

  get textElement() {
    return this.$refs.text as ContentEditable;
  }

  get style() {
    return {
      left: this.element.offset.x + 'px',
      top: this.element.offset.y + 'px',
    }
  }

  mounted() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  beforeDestroy() {
    document.removeEventListener('mousedown', this.checkForOutsideClick);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  focus() {
    this.editable = true;
    Vue.nextTick(this.textElement.focus);
    document.addEventListener('mousedown', this.checkForOutsideClick);
  }

  handleDoubleClick() {
    this.editable = true;
    Vue.nextTick(this.textElement.focus);
  }

  checkForOutsideClick(e: MouseEvent) {
    const container = this.$el as HTMLElement;

    if (container !== e.target && !container.contains(e.target as Element)) {    
      this.editable = false;

      // Clear any text selection that the user may have made
      window.getSelection()!.removeAllRanges();

      // If the user didn't click another element, then
      // clear the selected element
      // TODO do we really want to clear the selected element?
      Vue.nextTick(() => {
        if (this.selectedElement === this.element) {
              this.selectedElement = null;
        }
      })
      
      document.removeEventListener('mousedown', this.checkForOutsideClick);
    }
  }

  handleMouseDown(e: MouseEvent) {
    if (this.selectedElement !== this.element) {
      this.selectedElement = this.element;
      document.addEventListener('mousedown', this.checkForOutsideClick);
    }

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

  handleKeyDown(e: KeyboardEvent) {
    if (this.selectedElement !== this.element) {
      return;
    }

    if (e.code == 'Delete' && !this.editable) {
      store.mutations.removeElement(this.element);
      e.preventDefault();
    }
  }

  updateText(text: string) {
    this.element.text = text;

    if (text.trim() === '') {
      store.mutations.removeElement(this.element);
    }
  }
}
</script>

<style scoped>
  .staff-text {
    position: relative;
    min-width: 10px;
    border: 1px dotted transparent;
  }

  .staff-text.selected {
    border: 1px dotted rgb(8, 8, 8);
  }

  .staff-text-container {
    position: relative;

    display: flex;
    flex-direction: column;
    align-items: center;
    white-space: nowrap;

    width: 0;
    max-width: 0;

    top: -20px;
  }

  /* .staff-text-content {
    width: 100%;
    height: 100%;
    display: block;
  } */
</style>