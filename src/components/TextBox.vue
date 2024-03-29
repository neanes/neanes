<template>
  <div
    class="text-box-container"
    :style="containerStyle"
    @click="$emit('select-single')"
  >
    <span class="handle"></span>
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
import { StyleValue } from 'vue';
import { Component, Prop, Vue } from 'vue-facing-decorator';

import ContentEditable from '@/components/ContentEditable.vue';
import { TextBoxElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { replaceTokens, TokenMetadata } from '@/utils/replaceTokens';
import { withZoom } from '@/utils/withZoom';

@Component({
  components: { ContentEditable },
  emits: ['update:content', 'select-single'],
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
    return withZoom(this.element.width);
  }

  get containerStyle() {
    const style = {
      color: this.element.computedColor,
      fontFamily: getFontFamilyWithFallback(this.element.computedFontFamily),
      fontSize: withZoom(this.element.computedFontSize),
      fontWeight: this.element.computedFontWeight,
      fontStyle: this.element.computedFontStyle,
      textAlign: this.element.alignment,
      width: this.width,
      height: withZoom(this.element.height),
      webkitTextStrokeWidth: withZoom(this.element.computedStrokeWidth),
      lineHeight: `${this.element.computedLineHeight ?? 'normal'}`,
      direction: this.pageSetup.melkiteRtl ? 'rtl' : undefined,
    } as StyleValue;

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

  blur() {
    this.textElement.blur();
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

.text-box.underline {
  text-decoration: underline;
}

.text-box-container .handle {
  bottom: calc(50% - 5px);
  left: -10px;

  z-index: 1;

  display: none;
}

@media print {
  .text-box-container .handle {
    display: none !important;
  }
}
</style>
