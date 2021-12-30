<template>
  <div class="text-box-container" :style="style">
    <ContentEditable
      ref="text"
      class="text-box"
      :content="element.content"
      @blur="updateContent($event)"
    ></ContentEditable>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { TextBoxElement } from '@/models/Element';
import ContentEditable from '@/components/ContentEditable.vue';
import { withZoom } from '@/utils/withZoom';
import { PageSetup } from '@/models/PageSetup';

@Component({
  components: {
    ContentEditable,
  },
})
export default class TextBox extends Vue {
  @Prop() element!: TextBoxElement;
  @Prop() pageSetup!: PageSetup;

  get textElement() {
    return this.$refs.text as ContentEditable;
  }

  get style() {
    const style: any = {
      color: this.element.color,
      fontFamily: this.element.fontFamily,
      fontSize: withZoom(this.element.fontSize),
      textAlign: this.element.alignment,
      width: withZoom(this.pageSetup.innerPageWidth),
    };

    return style;
  }

  updateContent(content: string) {
    // Nothing actually changed, so do nothing
    if (this.element.content === content) {
      return;
    }

    this.$emit('update:content', content);
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
