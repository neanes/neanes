<template>
  <div
    class="annotation-container"
    :style="style"
    @mousedown="handleMouseDown"
    @dblclick="handleDoubleClick"
  >
    <ckeditor
      ref="editor"
      class="rich-text-editor"
      :editor="editor"
      :model-value="element.text"
      :config="editorConfig"
      @ready="onEditorReady"
    />
  </div>
</template>

<script lang="ts">
import { Ckeditor } from '@ckeditor/ckeditor5-vue';
import { EditorConfig, FontSizeOption } from 'ckeditor5';
import { ComponentExposed } from 'vue-component-type-helpers';
import { Component, Prop, Vue } from 'vue-facing-decorator';

import ContentEditable from '@/components/ContentEditable.vue';
import InlineEditor from '@/customEditor';
import { AnnotationElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { withZoom } from '@/utils/withZoom';

const STAFF_TEXT_LOCK_ID = 'staff-text-ro-lock';

@Component({
  components: {
    Ckeditor,
    ContentEditable,
  },
  emits: ['update', 'delete'],
})
export default class Annotation extends Vue {
  @Prop({ required: true }) element!: AnnotationElement;
  @Prop({ required: true }) pageSetup!: PageSetup;
  @Prop({ required: true }) fonts!: string[];

  editable: boolean = false;

  startX: number = 0;
  startY: number = 0;

  editor = InlineEditor;

  get textElement() {
    return this.$refs.text as ContentEditable;
  }

  get style() {
    return {
      left: withZoom(this.element.x),
      top: withZoom(this.element.y),
      '--ck-content-font-family': getFontFamilyWithFallback(
        this.pageSetup.textBoxDefaultFontFamily,
        this.pageSetup.neumeDefaultFontFamily,
      ),
      '--ck-content-font-size': `${this.pageSetup.lyricsDefaultFontSize}px`, // no zoom because we will apply zooming on the whole editor
      '--ck-content-line-height': 'normal',
    };
  }

  get editorConfig(): EditorConfig {
    const fontSizeOptions: FontSizeOption[] = [];

    for (let i = 8; i <= 72; i++) {
      fontSizeOptions.push({
        title: `${i}`,
        model: `${i}pt`,
      });
    }

    // Add a fall back font to each font so that neumes "just work"
    const fonts = this.fonts.map(
      (x) => x + ',' + this.pageSetup.neumeDefaultFontFamily,
    );

    return {
      fontFamily: {
        options: [
          'default',
          'Source Serif' + ',' + this.pageSetup.neumeDefaultFontFamily,
          'GFS Didot' + ',' + this.pageSetup.neumeDefaultFontFamily,
          'Noto Naskh Arabic' + ',' + this.pageSetup.neumeDefaultFontFamily,
          'Old Standard' + ',' + this.pageSetup.neumeDefaultFontFamily,
          'Omega' + ',' + this.pageSetup.neumeDefaultFontFamily,
          'Neanes',
          'NeanesStathisSeries',
          ...fonts,
        ],
      },
      fontSize: {
        supportAllValues: true,
        options: ['default', ...fontSizeOptions],
      },
      // TODO support rtl
      // language: {
      //   content: this.element.rtl ? 'ar' : 'en',
      // },
      licenseKey: 'GPL',
      insertNeume: {
        neumeDefaultFontFamily: this.pageSetup.neumeDefaultFontFamily,
        defaultFontSize: this.pageSetup.lyricsDefaultFontSize,
        defaultFontFamily: this.pageSetup.lyricsDefaultFontFamily,
        fthoraDefaultColor: this.pageSetup.fthoraDefaultColor,
      },
      toolbar: {
        items: [
          'fontFamily',
          'fontSize',
          '|',
          'bold',
          'italic',
          'underline',
          '|',
          'fontColor',
          '|',
          'link',
          '|',
          'removeFormat',
          '|',
          'insertNeume',
          'insertMartyria',
          'insertPlagal',
        ],
        shouldNotGroupWhenFull: true,
      },
    };
  }

  beforeDestroy() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  getEditorInstance() {
    return (this.$refs.editor as ComponentExposed<typeof Ckeditor>)?.instance;
  }

  onEditorReady(editor: InlineEditor) {
    editor.enableReadOnlyMode(STAFF_TEXT_LOCK_ID);

    editor.ui.focusTracker.on('change:isFocused', (evt, name, isFocused) => {
      if (!isFocused) {
        editor.enableReadOnlyMode(STAFF_TEXT_LOCK_ID);

        const text = editor.getData();

        if (text.trim() === '') {
          this.$emit('delete');
        } else if (this.element.text !== text) {
          this.$emit('update', { text });
        }
      }
    });

    const toolbarEl = editor.ui.view.toolbar.element;
    if (toolbarEl) {
      toolbarEl.style.maxWidth = '400px';
    }
  }

  async handleDoubleClick() {
    const editor = this.getEditorInstance();

    if (editor == null) {
      return;
    }

    if (editor.isReadOnly) {
      editor.disableReadOnlyMode(STAFF_TEXT_LOCK_ID);
      editor.editing.view.focus();
    }
  }

  handleMouseDown(e: MouseEvent) {
    if (this.getEditorInstance()?.isReadOnly === false) {
      return;
    }

    this.startX = e.clientX - this.element.x;
    this.startY = e.clientY - this.element.y;

    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove(e: MouseEvent) {
    e.preventDefault();

    this.element.x = e.clientX - this.startX;
    this.element.y = e.clientY - this.startY;
  }

  handleMouseUp() {
    const { x, y } = this.element;
    this.$emit('update', { x, y });

    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }
}
</script>

<style scoped>
.annotation-container {
  position: absolute;
  white-space: nowrap;
  z-index: 1000;
  cursor: default;
}

.rich-text-editor {
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
  transform-origin: 0 0;
  transform: scale(var(--zoom, 1));
  border: none !important;
}

:deep(p) {
  margin: 0;
}

.ck.ck-editor__editable_inline > *:first-child {
  margin-top: 0;
}

.ck.ck-editor__editable_inline > *:last-child {
  margin-bottom: 0;
}
</style>
