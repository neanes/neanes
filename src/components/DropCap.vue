<template>
  <div class="drop-cap-container">
    <ContentEditable
      ref="text"
      class="drop-cap"
      :style="style"
      :content="element.content"
      :class="[{ selected: element == selectedElement }]"
      @blur="updateText($event)"
    ></ContentEditable>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { DropCapElement, ScoreElement } from '@/models/Element';
import ContentEditable from '@/components/ContentEditable.vue';
import { store } from '@/store';
import { withZoom } from '@/utils/withZoom';

@Component({
  components: {
    ContentEditable,
  },
})
export default class DropCap extends Vue {
  @Prop() element!: DropCapElement;

  editable: boolean = false;

  get pageSetup() {
    return store.state.score.pageSetup;
  }

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
    const style = {
      color: this.element.color || this.pageSetup.dropCapDefaultColor,
      fontFamily:
        this.element.fontFamily || this.pageSetup.dropCapDefaultFontFamily,
      fontSize: withZoom(
        this.element.fontSize || this.pageSetup.dropCapDefaultFontSize,
      ),
    } as CSSStyleDeclaration;

    return style;
  }

  updateText(text: string) {
    this.element.content = text;
    this.$emit('dropCapUpdated', this.element);
  }

  focus() {
    this.textElement.focus();
  }
}
</script>

<style scoped></style>
