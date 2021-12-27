<template>
  <div class="text-box-container">
    <ContentEditable
      ref="text"
      class="text-box"
      :style="style"
      :content="element.content"
      :class="[{ selected: element == selectedElement }]"
      @blur="updateText($event)"
    ></ContentEditable>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Neume as NeumeType } from '@/models/Neumes';
import { ScoreElement, TextBoxAlignment } from '@/models/Element';
import { neumeMap } from '@/models/NeumeMappings';
import { TextBoxElement } from '@/models/Element';
import ContentEditable from '@/components/ContentEditable.vue';
import { store } from '@/store';

@Component({
  components: {
    ContentEditable,
  },
})
export default class TextBox extends Vue {
  @Prop() element!: TextBoxElement;

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
    const style: any = {
      color: this.element.color,
      fontFamily: this.element.fontFamily,
      fontSize: this.element.fontSize + 'px',
      textAlign: this.element.alignment,
      width: this.pageSetup.innerPageWidth + 'px',
    };

    return style;
  }

  updateText(text: string) {
    this.element.content = text;
    this.$emit('scoreUpdated');
  }

  focus() {
    this.textElement.focus();
  }
}
</script>

<style scoped>
.text-box-container {
  border: 1px dotted black;
  box-sizing: border-box;
}

.text-box {
  height: 100%;
  width: 100%;
  display: block;

  min-height: 10px;
}
</style>
