<template>
  <div
    class="text-box-container"
    :style="containerStyle"
    @click="$emit('select-single')"
  >
    <span class="handle"></span>
    <div class="text-box-multipanel-container" v-if="element.multipanel">
      <ContentEditable
        ref="text"
        class="text-box multipanel left"
        :class="textBoxClass"
        :style="textBoxStyle"
        :content="contentLeft"
        :editable="editMode"
        @blur="updateContentLeft($event)"
      ></ContentEditable>
      <ContentEditable
        ref="text"
        class="text-box multipanel center"
        :class="textBoxClass"
        :style="textBoxStyle"
        :content="contentCenter"
        :editable="editMode"
        @blur="updateContentCenter($event)"
      ></ContentEditable>
      <ContentEditable
        ref="text"
        class="text-box multipanel right"
        :class="textBoxClass"
        :style="textBoxStyle"
        :content="contentRight"
        :editable="editMode"
        @blur="updateContentRight($event)"
      ></ContentEditable>
    </div>
    <ContentEditable
      v-else
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
import { TextBoxAlignment, TextBoxElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { replaceTokens, TokenMetadata } from '@/utils/replaceTokens';
import { withZoom } from '@/utils/withZoom';

@Component({
  components: { ContentEditable },
  emits: [
    'update:content',
    'update:contentLeft',
    'update:contentCenter',
    'update:contentRight',
    'select-single',
  ],
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

  get contentLeft() {
    return this.editMode
      ? this.element.contentLeft
      : replaceTokens(
          this.element.contentLeft,
          this.metadata,
          TextBoxAlignment.Left,
        );
  }

  get contentCenter() {
    return this.editMode
      ? this.element.contentCenter
      : replaceTokens(
          this.element.contentCenter,
          this.metadata,
          TextBoxAlignment.Center,
        );
  }

  get contentRight() {
    return this.editMode
      ? this.element.contentRight
      : replaceTokens(
          this.element.contentRight,
          this.metadata,
          TextBoxAlignment.Right,
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
      width: !this.element.multipanel ? this.width : undefined,
      height:
        this.element.multipanel || this.element.inline
          ? withZoom(this.element.height)
          : undefined,
      textWrap: this.element.alignment === 'center' ? 'balance' : 'pretty',
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

  updateContentLeft(content: string) {
    // Nothing actually changed, so do nothing
    if (this.element.contentLeft === content) {
      return;
    }

    this.$emit('update:contentLeft', content);
  }

  updateContentCenter(content: string) {
    // Nothing actually changed, so do nothing
    if (this.element.contentCenter === content) {
      return;
    }

    this.$emit('update:contentCenter', content);
  }

  updateContentRight(content: string) {
    // Nothing actually changed, so do nothing
    if (this.element.contentRight === content) {
      return;
    }

    this.$emit('update:contentRight', content);
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
  outline: 1px dotted black;
  box-sizing: border-box;
  min-height: 10px;
}

.text-box-multipanel-container {
  display: flex;
}

.text-box {
  display: block;
  box-sizing: border-box;
  min-height: 10px;
}

.text-box:focus {
  outline: none;
}

.text-box:focus:not(.multipanel) {
  outline: var(--ck-focus-ring);
  background-color: white;
  position: relative;
  z-index: 1;
}

.text-box.inline {
  display: flex;
  flex-direction: column;
  justify-content: center;
  white-space: nowrap;
}

.text-box.underline {
  text-decoration: underline;
}

.text-box.multipanel {
  border: 1px dotted black;
  box-sizing: border-box;
  min-width: 2.5rem;
}

.text-box.left {
  position: absolute;
  left: 0;
}

.text-box.center {
  flex: 1;
  text-align: center;
}

.text-box.right {
  position: absolute;
  right: 0;
  text-align: right;
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

  .text-box.multipanel {
    border: none !important;
    outline: none !important;
  }
}
</style>
