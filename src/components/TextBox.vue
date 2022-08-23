<template>
  <div class="text-box-container" :style="containerStyle">
    <ContentEditable
      ref="text"
      class="text-box"
      :class="textBoxClass"
      :style="textBoxStyle"
      :content="content"
      :editable="editMode"
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
import { replaceTokens, TokenMetadata } from '@/utils/replaceTokens';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';

@Component({
  components: {
    ContentEditable,
  },
})
export default class TextBox extends Vue {
  @Prop() element!: TextBoxElement;
  @Prop() pageSetup!: PageSetup;
  @Prop({ default: true }) editMode!: boolean;
  @Prop() metadata!: TokenMetadata;

  get textElement() {
    return this.$refs.text as ContentEditable;
  }

  get content() {
    return this.editMode
      ? this.element.content
      : replaceTokens(
          this.element.content,
          this.metadata,
          this.element.alignment,
        );
  }

  get width() {
    return this.element.inline
      ? withZoom(this.element.width)
      : withZoom(this.pageSetup.innerPageWidth);
  }

  get containerStyle() {
    const style = {
      color: this.element.color,
      fontFamily: getFontFamilyWithFallback(this.element.fontFamily),
      fontSize: withZoom(this.element.fontSize),
      textAlign: this.element.alignment,
      width: this.width,
      height: withZoom(this.element.height),
      webkitTextStrokeWidth: withZoom(this.element.strokeWidth),
    } as CSSStyleDeclaration;

    return style;
  }

  get textBoxStyle() {
    const style: any = {
      width: this.width,
      height: withZoom(this.element.height),
    };

    return style;
  }

  get textBoxClass() {
    return {
      inline: this.element.inline,
      bold: this.element.bold,
      italic: this.element.italic,
      underline: this.element.underline,
    };
  }

  updateContent(content: string) {
    // Nothing actually changed, so do nothing
    if (this.element.content === content) {
      return;
    }

    this.$emit('update:content', content);
  }

  focus() {
    this.textElement.focus(true);
  }
}
</script>

<style scoped>
.text-box-container {
  border: 1px dotted black;
  box-sizing: border-box;
  min-height: 10px;
}

.text-box {
  display: block;

  min-height: 10px;
}

.text-box:focus {
  outline: none;
}

.text-box.inline {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.text-box.bold {
  font-weight: bold;
}

.text-box.italic {
  font-style: italic;
}

.text-box.underline {
  text-decoration: underline;
}
</style>
