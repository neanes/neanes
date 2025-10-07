<template>
  <div
    class="annotation-container"
    :class="{ selectedAnnotation: selected }"
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
import { defineComponent, PropType } from 'vue';
import { ComponentExposed } from 'vue-component-type-helpers';

import InlineEditor from '@/customEditor';
import { AnnotationElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { withZoom } from '@/utils/withZoom';

const ANNOTATION_LOCK_ID = 'ANNOTATION_LOCK_ID';

export default defineComponent({
  components: { Ckeditor },
  emits: ['update', 'delete'],
  props: {
    element: {
      type: Object as PropType<AnnotationElement>,
      required: true,
    },
    pageSetup: {
      type: Object as PropType<PageSetup>,
      required: true,
    },
    fonts: {
      type: Array as PropType<string[]>,
      required: true,
    },
    selected: Boolean,
  },

  data() {
    return {
      offsetX: 0,
      offsetY: 0,
      elementX: 0,
      elementY: 0,

      zoom: 1,

      clampingInterval: null as ReturnType<typeof setTimeout> | null,

      editor: InlineEditor,
    };
  },

  beforeUnmount() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);

    if (this.clampingInterval != null) {
      clearInterval(this.clampingInterval);
    }
  },

  computed: {
    style() {
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
    },

    editorConfig(): EditorConfig {
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
    },
  },

  methods: {
    getEditorInstance() {
      return (this.$refs.editor as ComponentExposed<typeof Ckeditor>)?.instance;
    },

    onEditorReady(editor: InlineEditor) {
      // If the text is empty, we want to focus the editor
      // because this is a new annotation
      if (this.element.text.trim() === '') {
        editor.editing.view.focus();
      } else {
        // Otherwise, we want to enable read-only mode
        editor.enableReadOnlyMode(ANNOTATION_LOCK_ID);
      }

      editor.ui.focusTracker.on('change:isFocused', (evt, name, isFocused) => {
        if (!isFocused) {
          editor.enableReadOnlyMode(ANNOTATION_LOCK_ID);

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

      this.clampingInterval = setInterval(this.clampToPageBounds, 250);
    },

    async handleDoubleClick() {
      const editor = this.getEditorInstance();

      if (editor == null) {
        return;
      }

      if (editor.isReadOnly) {
        editor.disableReadOnlyMode(ANNOTATION_LOCK_ID);
        editor.editing.view.focus();
      }
    },

    handleMouseDown(e: MouseEvent) {
      if (this.getEditorInstance()?.isReadOnly === false) {
        return;
      }

      // We only calculate zoom once when the mouse is pressed down
      // to avoid recalculating it on every mouse move
      this.zoom = Number(getComputedStyle(this.$el).getPropertyValue('--zoom'));

      const draggedEl = this.$el as HTMLElement;
      const rect = draggedEl.getBoundingClientRect();

      // Calculate the offset of the mouse click relative to the element
      this.offsetX = e.clientX - rect.left;
      this.offsetY = e.clientY - rect.top;

      document.addEventListener('mouseup', this.handleMouseUp);
      document.addEventListener('mousemove', this.handleMouseMove);
    },

    handleMouseMove(e: MouseEvent) {
      e.preventDefault();

      const draggedEl = this.$el as HTMLElement;
      const pageEl = draggedEl.closest('.page') as HTMLElement;
      if (!draggedEl || !pageEl) {
        console.warn('Could not find dragged element or page element');
        return;
      }

      const elRect = draggedEl.getBoundingClientRect();
      const pageRect = pageEl.getBoundingClientRect();

      const elWidth = elRect.width;
      const elHeight = elRect.height;

      // Compute desired top-left corner of element in viewport space
      const desiredLeft = e.clientX - this.offsetX;
      const desiredTop = e.clientY - this.offsetY;

      // Clamp those values to page bounds
      const clampedLeft = Math.max(
        pageRect.left,
        Math.min(desiredLeft, pageRect.right - elWidth),
      );
      const clampedTop = Math.max(
        pageRect.top,
        Math.min(desiredTop, pageRect.bottom - elHeight),
      );

      // Convert clamped screen coords into coordinates relative to the element's offsetParent
      const offsetParent = draggedEl.offsetParent as HTMLElement;
      const parentRect = offsetParent.getBoundingClientRect();

      const newX = clampedLeft - parentRect.left;
      const newY = clampedTop - parentRect.top;

      const zoom = Number(
        getComputedStyle(this.$el).getPropertyValue('--zoom'),
      );

      this.elementX = newX / zoom;
      this.elementY = newY / zoom;
    },

    clampToPageBounds() {
      const el = this.$el as HTMLElement;
      const pageEl = el.closest('.page') as HTMLElement;
      const offsetParent = el.offsetParent as HTMLElement;

      if (!el || !pageEl || !offsetParent) {
        return;
      }

      const zoom = Number(
        getComputedStyle(this.$el).getPropertyValue('--zoom'),
      );

      const elRect = el.getBoundingClientRect();
      const pageRect = pageEl.getBoundingClientRect();
      const parentRect = offsetParent.getBoundingClientRect();

      const elWidth = elRect.width;
      const elHeight = elRect.height;

      // Current position relative to offset parent
      const currentX = this.elementX * zoom;
      const currentY = this.elementY * zoom;

      // Convert .page bounds into offsetParent-relative coordinates
      const minX = pageRect.left - parentRect.left;
      const minY = pageRect.top - parentRect.top;
      const maxX = pageRect.right - parentRect.left - elWidth;
      const maxY = pageRect.bottom - parentRect.top - elHeight;

      // Clamp
      this.elementX = Math.max(minX, Math.min(currentX, maxX)) / zoom;
      this.elementY = Math.max(minY, Math.min(currentY, maxY)) / zoom;
    },

    handleMouseUp() {
      this.$emit('update', { x: this.elementX, y: this.elementY });

      document.removeEventListener('mouseup', this.handleMouseUp);
      document.removeEventListener('mousemove', this.handleMouseMove);
    },
  },
});
</script>

<style scoped>
.annotation-container {
  position: absolute;
  white-space: nowrap;
  z-index: 1000;
  cursor: default;
  padding: 0 10px;
  transform-origin: 0 0;
  transform: scale(var(--zoom, 1));
}

.selectedAnnotation {
  outline: 1px solid goldenrod;
}

.rich-text-editor {
  padding: 0;
  box-sizing: border-box;
  overflow: visible;

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
