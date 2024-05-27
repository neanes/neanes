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
  <!-- <div
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
      :plaintextOnly="false"
      @blur="updateContent($event)"
    ></ContentEditable>
  </div> -->
</template>

<script lang="ts">
import { CKEditorComponentData } from '@ckeditor/ckeditor5-vue/dist/ckeditor';
import { StyleValue } from 'vue';
import { Component, Prop, Vue } from 'vue-facing-decorator';

import ContentEditable from '@/components/ContentEditable.vue';
import InlineEditor from '@/customEditor';
import { TextBoxElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
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
export default class TextBoxRich extends Vue {
  @Prop() element!: TextBoxElement;
  @Prop() pageSetup!: PageSetup;
  @Prop({ default: true }) editMode!: boolean;
  @Prop() metadata!: TokenMetadata;

  editor = InlineEditor;
  editorData = '';
  editorConfig = {};

  get editorInstance() {
    return (this.$refs.editor as CKEditorComponentData).instance!;
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
      width: this.width,
      height: withZoom(this.element.height),
    } as StyleValue;

    return style;
  }

  get textBoxStyle() {
    const style: any = {
      width: !this.element.multipanel ? this.width : undefined,
    };

    return style;
  }

  get textBoxClass() {
    return {
      inline: this.element.inline,
      underline: this.element.underline,
    };
  }

  mounted() {
    window._richText = this;
  }

  onBlur() {
    this.element.height =
      document.getElementsByClassName('ck-content')[0].scrollHeight;

    this.updateContent(this.editorInstance.getData());
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
