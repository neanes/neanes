<template>
  <div
    class="text-box-container"
    :style="containerStyle"
    @click="$emit('select-single')"
  >
    <span class="handle"></span>
    <ckeditor
      ref="editor"
      :editor="editor"
      :model-value="element.content"
      @blur="onBlur"
      :config="editorConfig"
      :style="textBoxStyle"
      class="editor"
    ></ckeditor>
  </div>
</template>

<script lang="ts">
import { EditorConfig } from '@ckeditor/ckeditor5-core';
import { CKEditorComponentData } from '@ckeditor/ckeditor5-vue/dist/ckeditor';
import { StyleValue } from 'vue';
import { Component, Prop, Vue } from 'vue-facing-decorator';

import ContentEditable from '@/components/ContentEditable.vue';
import InlineEditor from '@/customEditor';
import { RichTextBoxElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

@Component({
  components: { ContentEditable },
  emits: ['update', 'select-single'],
})
export default class TextBoxRich extends Vue {
  @Prop() element!: RichTextBoxElement;
  @Prop() pageSetup!: PageSetup;
  @Prop() fonts!: string[];

  editor = InlineEditor;
  editorData = '';

  get editorConfig(): EditorConfig {
    return { fontFamily: { options: this.fonts } };
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
    } as StyleValue;

    return style;
  }

  get textBoxStyle() {
    const style: any = {
      width: this.width,
    };

    return style;
  }

  mounted() {
    window._richText = this;
  }

  onBlur() {
    const updates: Partial<RichTextBoxElement> = {};

    let updated = false;

    const height = (this.$el as HTMLElement).querySelector(
      '.ck-content',
    )!.scrollHeight;

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

  blur() {
    //this.textElement.blur();
    //this.editorInstance.editing.view.();
  }

  focus() {
    //this.editorInstance.editing.view.focus();
  }
}
</script>

<style>
/* https://github.com/ckeditor/ckeditor5/issues/952 */
.ck.ck-font-family-dropdown {
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

.editor {
  padding: 0;
  box-sizing: border-box;
}

.text-box-container {
  border: 1px dotted black;
  box-sizing: border-box;
  min-height: 10px;
}

.text-box:focus {
  outline: none;
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
