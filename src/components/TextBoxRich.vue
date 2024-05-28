<template>
  <div
    class="rich-text-box-container"
    :style="containerStyle"
    @click="$emit('select-single')"
  >
    <span class="handle"></span>
    <ckeditor
      ref="editor"
      :editor="editor"
      :model-value="element.content"
      @blur="onBlur"
      @ready="onEditorReady"
      :config="editorConfig"
      :style="textBoxStyle"
      class="rich-text-editor"
    ></ckeditor>
  </div>
</template>

<script lang="ts">
import { EditorConfig } from '@ckeditor/ckeditor5-core';
import { FontSizeOption } from '@ckeditor/ckeditor5-font/src/fontconfig';
import { CKEditorComponentData } from '@ckeditor/ckeditor5-vue/dist/ckeditor';
import { StyleValue } from 'vue';
import { Component, Prop, Vue } from 'vue-facing-decorator';

import ContentEditable from '@/components/ContentEditable.vue';
import InlineEditor from '@/customEditor';
import { RichTextBoxElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { withZoom } from '@/utils/withZoom';

@Component({
  components: { ContentEditable },
  emits: ['update', 'update:height', 'select-single'],
})
export default class TextBoxRich extends Vue {
  @Prop() element!: RichTextBoxElement;
  @Prop() pageSetup!: PageSetup;
  @Prop() fonts!: string[];

  editor = InlineEditor;
  editorData = '';

  focusOnReady = false;

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
    };
  }

  get editorInstance() {
    return (this.$refs.editor as CKEditorComponentData).instance!;
  }

  get width() {
    return withZoom(this.element.width);
  }

  get containerStyle() {
    const style = {
      width: this.width,
      height: withZoom(this.element.height),
      fontFamily: getFontFamilyWithFallback(
        this.pageSetup.textBoxDefaultFontFamily,
      ),
      fontSize: withZoom(this.pageSetup.textBoxDefaultFontSize),
    } as StyleValue;

    return style;
  }

  get textBoxStyle() {
    const style: StyleValue = {
      width: this.width,
    };

    return style;
  }

  onEditorReady() {
    const height = this.getHeight();

    if (this.element.height !== height) {
      this.$emit('update:height', height);
    }

    if (this.focusOnReady) {
      this.editorInstance.editing.view.focus();
      this.focusOnReady = false;
    }
  }

  onBlur() {
    const updates: Partial<RichTextBoxElement> = {};

    let updated = false;

    const height = this.getHeight();

    const content = this.editorInstance.getData();

    if (this.element.content !== content) {
      updates.content = content;
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
    return (this.$el as HTMLElement).querySelector('.ck-content')!.scrollHeight;
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

.ck-focused {
  background-color: white;
  position: relative;
  z-index: 1;
}

.rich-text-editor {
  padding: 0;
  box-sizing: border-box;
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

@media print {
  .rich-text-box-container .handle {
    display: none !important;
  }

  :deep(.ck-widget) {
    outline: none !important;
  }

  :deep(.ck-widget__type-around) {
    display: none !important;
  }
}
</style>
