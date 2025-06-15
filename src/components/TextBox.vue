<template>
  <div
    class="text-box-container"
    :style="containerStyle"
    :class="{ selected: selected }"
    @click="$emit('select-single')"
  >
    <span class="handle"></span>
    <div class="text-box-multipanel-container" v-if="element.multipanel">
      <ContentEditable
        ref="textLeft"
        class="text-box multipanel left"
        :class="textBoxClass"
        :style="textBoxStyle"
        :content="contentLeft"
        :editable="editMode"
        @blur="onBlur"
      ></ContentEditable>
      <ContentEditable
        ref="textCenter"
        class="text-box multipanel center"
        :class="textBoxClass"
        :style="textBoxStyle"
        :content="contentCenter"
        :editable="editMode"
        @blur="onBlur"
      ></ContentEditable>
      <ContentEditable
        ref="textRight"
        class="text-box multipanel right"
        :class="textBoxClass"
        :style="textBoxStyle"
        :content="contentRight"
        :editable="editMode"
        @blur="onBlur"
      ></ContentEditable>
    </div>
    <div class="inline-container" v-else-if="element.inline">
      <ContentEditable
        ref="text"
        class="text-box inline-top"
        :class="textBoxClass"
        :style="textBoxStyleTop"
        :content="content"
        :editable="editMode"
        @blur="onBlur"
      ></ContentEditable>
      <ContentEditable
        ref="textBottom"
        class="text-box inline-bottom"
        :class="textBoxClass"
        :style="textBoxStyleBottom"
        :content="contentBottom"
        :editable="editMode"
        @blur="onBlur"
      ></ContentEditable>
    </div>
    <ContentEditable
      v-else
      ref="text"
      class="text-box single"
      :class="textBoxClass"
      :style="textBoxStyle"
      :content="content"
      :editable="editMode"
      @blur="onBlur"
    ></ContentEditable>
  </div>
</template>

<script lang="ts">
import { throttle } from 'throttle-debounce';
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
  emits: ['update', 'update:height', 'select-single'],
})
export default class TextBox extends Vue {
  @Prop() element!: TextBoxElement;
  @Prop() pageSetup!: PageSetup;
  @Prop({ default: true }) editMode!: boolean;
  @Prop() selected!: boolean;
  @Prop() metadata!: TokenMetadata;

  resizeObserver: ResizeObserver | null = null;
  unmounting = false;

  get textElement() {
    return this.$refs.text as ContentEditable;
  }

  get textElementLeft() {
    return this.$refs.textLeft as ContentEditable;
  }

  get textElementRight() {
    return this.$refs.textRight as ContentEditable;
  }

  get textElementCenter() {
    return this.$refs.textCenter as ContentEditable;
  }

  get textElementBottom() {
    return this.$refs.textBottom as ContentEditable;
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

  get contentBottom() {
    return this.editMode
      ? this.element.contentBottom
      : replaceTokens(
          this.element.contentBottom,
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
      minHeight: withZoom(this.element.minHeight),
      webkitTextStrokeWidth: withZoom(this.element.computedStrokeWidth),
      lineHeight: `${this.element.computedLineHeight ?? 'normal'}`,
      direction: this.pageSetup.melkiteRtl ? 'rtl' : undefined,
    } as StyleValue;

    return style;
  }

  get textBoxStyle() {
    const style: any = {
      width: !this.element.multipanel ? this.width : undefined,
      height: this.element.inline ? withZoom(this.element.height) : undefined,
      minHeight: withZoom(this.element.minHeight),
      textWrap: this.element.alignment === 'center' ? 'balance' : 'pretty',
    };

    return style;
  }

  get textBoxStyleTop() {
    const style: any = {
      width: this.width,
      height: withZoom(this.element.height),
      textWrap: this.element.alignment === 'center' ? 'balance' : 'pretty',
    };

    return style;
  }

  get textBoxStyleBottom() {
    const style: any = {
      width: this.width,
      textWrap: this.element.alignment === 'center' ? 'balance' : 'pretty',
      top: withZoom(this.pageSetup.lyricsVerticalOffset),
    };

    return style;
  }

  get textBoxClass() {
    return {
      underline: this.element.underline,
    };
  }

  mounted() {
    const height = this.getHeight();

    if (height != null && this.element.height !== height) {
      this.$emit('update:height', height);
    }

    if (this.textElement) {
      const element = this.textElement.htmlElement;

      if (this.resizeObserver != null) {
        this.resizeObserver.disconnect();
      }

      this.resizeObserver = new ResizeObserver(
        throttle(100, () => {
          const resizedHeight = this.getHeight();

          if (resizedHeight != null && this.element.height !== resizedHeight) {
            this.$emit('update', { height: resizedHeight });
          }
        }),
      );

      this.resizeObserver.observe(element);
    }
  }

  beforeUnmount() {
    this.unmounting = true;
    this.update();

    if (this.resizeObserver != null) {
      this.resizeObserver.disconnect();
    }
  }

  getHeight() {
    if (this.element.multipanel) {
      const zoom = Number(
        getComputedStyle(this.textElementCenter.htmlElement).getPropertyValue(
          '--zoom',
        ),
      );

      return (
        Math.max(
          this.textElementLeft.htmlElement.getBoundingClientRect().height,
          this.textElementCenter.htmlElement.getBoundingClientRect().height,
          this.textElementRight.htmlElement.getBoundingClientRect().height,
        ) / zoom
      );
    }

    const zoom = Number(
      getComputedStyle(this.textElement.htmlElement).getPropertyValue('--zoom'),
    );

    return this.textElement.htmlElement.getBoundingClientRect().height / zoom;
  }

  onBlur() {
    if (!this.unmounting) {
      this.update();
    }
  }

  update() {
    const updates: Partial<TextBoxElement> = {};

    let updated = false;

    const height = this.getHeight();

    const content = this.textElement?.getContent() ?? '';
    const contentBottom = this.textElementBottom?.getContent() ?? '';
    const contentLeft = this.textElementLeft?.getContent() ?? '';
    const contentRight = this.textElementRight?.getContent() ?? '';
    const contentCenter = this.textElementCenter?.getContent() ?? '';

    // This should never happen, but if it does, we don't want
    // to save garbage values.
    if (height == null) {
      return;
    }

    // Nothing actually changed, so do nothing
    if (this.editMode && this.element.content !== content) {
      updates.content = content;
      updated = true;
    }

    if (this.editMode && this.element.contentBottom !== contentBottom) {
      updates.contentBottom = contentBottom;
      updated = true;
    }

    if (this.editMode && this.element.contentLeft !== contentLeft) {
      updates.contentLeft = contentLeft;
      updated = true;
    }

    if (this.editMode && this.element.contentRight !== contentRight) {
      updates.contentRight = contentRight;
      updated = true;
    }

    if (this.editMode && this.element.contentCenter !== contentCenter) {
      updates.contentCenter = contentCenter;
      updated = true;
    }

    if (this.element.height != height) {
      updates.height = height;
      updated = true;
    }

    if (updated) {
      this.$emit('update', updates);
    }
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

.text-box.inline-top {
  display: flex;
  flex-direction: column;
  justify-content: center;
  white-space: nowrap !important;
}

.text-box.inline-bottom {
  display: inline-block;
  position: relative;
  white-space: nowrap !important;
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

.inline-container {
  display: flex;
  flex-direction: column;
}

.inline-container,
.text-box.single {
  outline: 1px dotted black;
}

.selected .inline-container,
.selected .text-box.single {
  outline: 1px solid goldenrod;
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
