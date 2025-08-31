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
        @onEditorReady="onEditorReady"
      ></ContentEditable>
      <ContentEditable
        ref="textCenter"
        class="text-box multipanel center"
        :class="textBoxClass"
        :style="textBoxStyle"
        :content="contentCenter"
        :editable="editMode"
        @blur="onBlur"
        @onEditorReady="onEditorReady"
      ></ContentEditable>
      <ContentEditable
        ref="textRight"
        class="text-box multipanel right"
        :class="textBoxClass"
        :style="textBoxStyle"
        :content="contentRight"
        :editable="editMode"
        @blur="onBlur"
        @onEditorReady="onEditorReady"
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
      @onEditorReady="onEditorReady"
    ></ContentEditable>
  </div>
</template>

<script lang="ts">
import { debounce, throttle } from 'throttle-debounce';
import { StyleValue } from 'vue';
import { Component, Prop, Vue, Watch } from 'vue-facing-decorator';

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

  getTextElement() {
    return this.$refs.text as ContentEditable;
  }

  getTextElementLeft() {
    return this.$refs.textLeft as ContentEditable;
  }

  getTextElementRight() {
    return this.$refs.textRight as ContentEditable;
  }

  getTextElementCenter() {
    return this.$refs.textCenter as ContentEditable;
  }

  getTextElementBottom() {
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
      height:
        this.element.inline || this.element.customHeight
          ? withZoom(this.element.height)
          : undefined,
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

    if (height != null && Math.abs(this.element.height - height) > 0.001) {
      this.$emit('update:height', height);
    }

    this.setupResizeObserver();
  }

  beforeUnmount() {
    this.unmounting = true;
    this.update();

    if (this.resizeObserver != null) {
      this.resizeObserver.disconnect();
    }
  }

  setupResizeObserver() {
    if (
      this.getTextElement() ||
      (this.getTextElementLeft() &&
        this.getTextElementCenter() &&
        this.getTextElementRight())
    ) {
      if (this.resizeObserver != null) {
        this.resizeObserver.disconnect();
      }

      this.resizeObserver = new ResizeObserver(
        throttle(100, () => {
          const resizedHeight = this.getHeight();

          if (
            resizedHeight != null &&
            Math.abs(this.element.height - resizedHeight) > 0.001
          ) {
            this.$emit('update', { height: resizedHeight });
          }
        }),
      );

      if (this.getTextElement()) {
        this.resizeObserver.observe(this.getTextElement().htmlElement);
      }

      if (this.getTextElementLeft()) {
        this.resizeObserver.observe(this.getTextElementLeft().htmlElement);
      }
      if (this.getTextElementCenter()) {
        this.resizeObserver.observe(this.getTextElementCenter().htmlElement);
      }
      if (this.getTextElementRight()) {
        this.resizeObserver.observe(this.getTextElementRight().htmlElement);
      }
    }
  }

  @Watch('element.customHeight')
  onCustomHeightChange() {
    if (this.element.customHeight == null) {
      this.update();
    }
  }

  getHeight() {
    if (this.element.multipanel) {
      if (
        this.getTextElementLeft() == null ||
        this.getTextElementCenter() == null ||
        this.getTextElementRight() == null
      ) {
        return null;
      }

      const zoom = Number(
        getComputedStyle(
          this.getTextElementCenter().htmlElement,
        ).getPropertyValue('--zoom'),
      );

      return (
        Math.max(
          this.getTextElementLeft().htmlElement.getBoundingClientRect().height,
          this.getTextElementCenter().htmlElement.getBoundingClientRect()
            .height,
          this.getTextElementRight().htmlElement.getBoundingClientRect().height,
        ) / zoom
      );
    }

    if (this.getTextElement() == null) {
      return null;
    }

    const zoom = Number(
      getComputedStyle(this.getTextElement().htmlElement).getPropertyValue(
        '--zoom',
      ),
    );

    return (
      this.getTextElement().htmlElement.getBoundingClientRect().height / zoom
    );
  }

  onBlur() {
    if (!this.unmounting) {
      this.update();
    }
  }

  setupResizeObserverDebounced = debounce(100, this.setupResizeObserver);

  onEditorReady() {
    this.setupResizeObserverDebounced();
  }

  update() {
    const updates: Partial<TextBoxElement> = {};

    let updated = false;

    const height = this.getHeight();

    const content = this.getTextElement()?.getContent() ?? '';
    const contentBottom = this.getTextElementBottom()?.getContent() ?? '';
    const contentLeft = this.getTextElementLeft()?.getContent() ?? '';
    const contentRight = this.getTextElementRight()?.getContent() ?? '';
    const contentCenter = this.getTextElementCenter()?.getContent() ?? '';

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

    if (
      !this.element.inline &&
      Math.abs(this.element.height - height) > 0.001
    ) {
      updates.height = height;
      updated = true;
    }

    if (updated) {
      this.$emit('update', updates);
    }
  }

  blur() {
    this.getTextElement()?.blur();
  }

  focus() {
    this.getTextElement()?.focus(true);
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

.text-box-container.selected .handle {
  display: inline;
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
