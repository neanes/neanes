<template>
  <div
    class="text-box-container"
    :style="containerStyle"
    @click="$emit('select-single')"
  >
    <ckeditor
      ref="editor"
      :editor="editor"
      :model-value="element.content"
      @blur="onBlur"
      :config="editorConfig"
      :style="textBoxStyle"
    ></ckeditor>
  </div>
</template>

<script lang="ts">
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
  editorConfig = {
    fontFamily: {
      options: this.fonts,
    },
  };

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
      padding: 0,
    };

    return style;
  }

  mounted() {
    window._richText = this;
  }

  onBlur() {
    const updates: Partial<RichTextBoxElement> = {};

    let updated = false;

    const height =
      document.getElementsByClassName('ck-content')[0].scrollHeight;

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

  updateContent(content: string) {
    // Nothing actually changed, so do nothing
    if (this.element.content === content) {
      return;
    }

    this.$emit('update:content', content);
  }

  blur() {
    //this.textElement.blur();
    //this.editorInstance.editing.view.();
  }

  focus() {
    this.editorInstance.editing.view.focus();
  }
}
</script>

<style scoped>
:deep(p) {
  margin: 0;
}

.text-box-container {
  border: 1px dotted black;
  box-sizing: border-box;
  min-height: 10px;
}

.text-box-multipanel-container {
  display: flex;
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
  }
}
</style>
