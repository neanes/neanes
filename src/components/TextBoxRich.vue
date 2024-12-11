<template>
  <div
    class="rich-text-box-container"
    :style="containerStyle"
    @click="$emit('select-single')"
  >
    <span class="handle"></span>
    <div
      v-if="element.multipanel"
      class="rich-text-box-multipanel-container"
      :style="multipanelContainerStyle"
    >
      <ckeditor
        ref="editorLeft"
        class="rich-text-editor multipanel left"
        :editor="editor"
        :model-value="contentLeft"
        @blur="onBlur"
        @ready="onEditorReady"
        :config="editorConfig"
      />
      <ckeditor
        ref="editorCenter"
        class="rich-text-editor multipanel center"
        :editor="editor"
        :model-value="contentCenter"
        @blur="onBlur"
        @ready="onEditorReady"
        :config="editorConfig"
      />
      <ckeditor
        ref="editorRight"
        class="rich-text-editor multipanel right"
        :editor="editor"
        :model-value="contentRight"
        @blur="onBlur"
        @ready="onEditorReady"
        :config="editorConfig"
      />
    </div>
    <ckeditor
      v-else
      ref="editor"
      class="rich-text-editor"
      :editor="editor"
      :model-value="content"
      @blur="onBlur"
      @ready="onEditorReady"
      :config="editorConfig"
      :style="textBoxStyle"
    />
  </div>
</template>

<script lang="ts">
import { FontSizeOption } from '@ckeditor/ckeditor5-font/src/fontconfig';
import { Ckeditor } from '@ckeditor/ckeditor5-vue';
import { EditorConfig } from 'ckeditor5';
import { StyleValue } from 'vue';
import type { ComponentExposed } from 'vue-component-type-helpers';
import { Component, Prop, Vue } from 'vue-facing-decorator';

import ContentEditable from '@/components/ContentEditable.vue';
import InlineEditor from '@/customEditor';
import { RichTextBoxElement, TextBoxAlignment } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { replaceTokens, TokenMetadata } from '@/utils/replaceTokens';
import { withZoom } from '@/utils/withZoom';

@Component({
  components: { ContentEditable },
  emits: ['update', 'update:height', 'select-single'],
})
export default class TextBoxRich extends Vue {
  @Prop() element!: RichTextBoxElement;
  @Prop() pageSetup!: PageSetup;
  @Prop() fonts!: string[];
  @Prop({ default: true }) editMode!: boolean;
  @Prop() metadata!: TokenMetadata;

  editor = InlineEditor;
  editorData = '';

  focusOnReady = false;
  unmounting = false;

  get editorConfig(): EditorConfig {
    const fontSizeOptions: FontSizeOption[] = [];

    for (let i = 8; i <= 72; i++) {
      fontSizeOptions.push({
        title: `${i}`,
        model: `${i}pt`,
      });
    }

    return {
      fontFamily: { options: ['default', ...this.fonts] },
      fontSize: {
        supportAllValues: true,
        options: ['default', ...fontSizeOptions],
      },
      language: {
        content: this.element.rtl ? 'ar' : 'en',
      },
      licenseKey: 'GPL',
    };
  }

  get editorInstance() {
    return (this.$refs.editor as ComponentExposed<typeof Ckeditor>)?.instance;
  }

  get editorInstanceLeft() {
    return (this.$refs.editorLeft as ComponentExposed<typeof Ckeditor>)
      ?.instance;
  }

  get editorInstanceCenter() {
    return (this.$refs.editorCenter as ComponentExposed<typeof Ckeditor>)
      ?.instance;
  }

  get editorInstanceRight() {
    return (this.$refs.editorRight as ComponentExposed<typeof Ckeditor>)
      ?.instance;
  }

  get content() {
    return this.editMode
      ? this.element.content
      : replaceTokens(
          this.element.content,
          this.metadata,
          TextBoxAlignment.Center,
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

  get containerStyle() {
    const style = {
      width: withZoom(this.element.width),
      height: withZoom(this.element.height),
      fontFamily: getFontFamilyWithFallback(
        this.pageSetup.textBoxDefaultFontFamily,
      ),
      fontSize: `${this.pageSetup.textBoxDefaultFontSize}px`, // no zoom because we will apply zooming on the whole editor
    } as StyleValue;

    return style;
  }

  get textBoxStyle() {
    const style: StyleValue = {
      width: `${this.element.width}px`, // no zoom because we scale with the transform
    };

    return style;
  }

  get multipanelContainerStyle() {
    const style: StyleValue = {
      width: `${this.element.width}px`, // no zoom because we scale with the transform
    };

    return style;
  }

  beforeUnmount() {
    this.unmounting = true;
    this.update();
  }

  onEditorReady() {
    const height = this.getHeight();

    if (height != null && this.element.height !== height) {
      this.$emit('update:height', height);
    }

    if (this.focusOnReady) {
      this.editorInstance?.editing.view.focus();
      this.focusOnReady = false;
    }
  }

  onBlur() {
    if (!this.unmounting) {
      this.update();
    }
  }

  update() {
    const updates: Partial<RichTextBoxElement> = {};

    let updated = false;

    const height = this.getHeight();

    const content = this.editorInstance?.getData() ?? '';
    const contentLeft = this.editorInstanceLeft?.getData() ?? '';
    const contentCenter = this.editorInstanceCenter?.getData() ?? '';
    const contentRight = this.editorInstanceRight?.getData() ?? '';

    // This should never happen, but if it does, we don't want
    // to save garbage values.
    if (height == null) {
      return;
    }

    if (this.editMode && this.element.content !== content) {
      updates.content = content;
      updated = true;
    }

    if (this.editMode && this.element.contentLeft !== contentLeft) {
      updates.contentLeft = contentLeft;
      updated = true;
    }

    if (this.editMode && this.element.contentCenter !== contentCenter) {
      updates.contentCenter = contentCenter;
      updated = true;
    }

    if (this.editMode && this.element.contentRight !== contentRight) {
      updates.contentRight = contentRight;
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

  getHeight() {
    return (this.$el as HTMLElement).querySelector('.ck-content')?.scrollHeight;
  }

  focus() {
    this.focusOnReady = true;
  }
}
</script>

<style>
/* https://github.com/ckeditor/ckeditor5/issues/952 */
.ck.ck-font-family-dropdown,
.ck.ck-font-size-dropdown {
  .ck.ck-dropdown__panel {
    max-height: 150px !important;
    overflow-y: auto !important;
  }
}
</style>

<style scoped>
:deep(p) {
  margin: 0;
}

.ck.ck-editor__editable_inline > *:first-child {
  margin-top: 0;
}

.ck.ck-editor__editable_inline > *:last-child {
  margin-bottom: 0;
}

.ck-focused:not(.multipanel) {
  background-color: white;
  position: relative;
  z-index: 1;
}

.rich-text-editor {
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  transform-origin: 0 0;
  transform: scale(var(--zoom, 1));
}

.rich-text-box-container {
  border: 1px dotted black;
  box-sizing: border-box;
  min-height: 10px;
}

.rich-text-box-container .handle {
  bottom: calc(50% - 5px);
  left: -10px;

  z-index: 1;

  display: none;
}

.rich-text-box-multipanel-container {
  display: flex;
}

.rich-text-editor.multipanel {
  border: 1px dotted black;
  box-sizing: border-box;
  min-width: 2.5rem;
}

.rich-text-editor.left {
  position: absolute;
  left: 0;
  z-index: 1;
}

.rich-text-editor.center {
  flex: 1;
}

.rich-text-editor.right {
  position: absolute;
  right: 0;
  transform-origin: top right;
}

@media print {
  .rich-text-box-container .handle {
    display: none !important;
  }

  .rich-text-editor.multipanel {
    border: none !important;
  }

  :deep(.ck-widget) {
    outline: none !important;
  }

  :deep(.ck-widget__type-around) {
    display: none !important;
  }
}
</style>
