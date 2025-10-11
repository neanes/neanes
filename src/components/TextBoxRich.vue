<template>
  <div
    class="rich-text-box-container"
    :class="{ selected: selected }"
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
        :config="editorConfig"
      />
    </div>
    <div class="inline-container" v-else-if="element.inline">
      <div class="inline-top-container" :style="textBoxTopContainerStyle">
        <div
          class="inline-top-inner-container"
          :style="textBoxTopInnerContainerStyle"
        >
          <ckeditor
            ref="editor"
            class="rich-text-editor inline-top"
            :style="textBoxStyleTop"
            :editor="editor"
            :model-value="content"
            @blur="onBlur"
            @ready="onEditorReadyInline"
            :config="editorConfig"
          />
        </div>
      </div>
      <div class="inline-bottom-container" :style="textBoxBottomContainerStyle">
        <ckeditor
          ref="editorBottom"
          class="rich-text-editor inline-bottom"
          :style="textBoxStyleBottom"
          :editor="editor"
          :model-value="contentBottom"
          @blur="onBlur"
          @ready="onEditorReadyInlineBottom"
          :config="editorConfig"
        />
      </div>
    </div>
    <ckeditor
      v-else
      ref="editor"
      class="rich-text-editor single"
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
import { Editor, EditorConfig } from 'ckeditor5';
import { debounce, throttle } from 'throttle-debounce';
import { defineComponent, PropType, StyleValue } from 'vue';
import type { ComponentExposed } from 'vue-component-type-helpers';

import InlineEditor from '@/customEditor';
import { RichTextBoxElement, TextBoxAlignment } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { replaceTokens, TokenMetadata } from '@/utils/replaceTokens';
import { withZoom } from '@/utils/withZoom';

export default defineComponent({
  components: {},
  emits: ['update', 'update:height', 'select-single'],
  props: {
    element: {
      type: Object as PropType<RichTextBoxElement>,
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
    editMode: {
      type: Boolean,
      default: true,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    metadata: Object as PropType<TokenMetadata>,
    recalc: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      editor: InlineEditor,
      editorData: '',

      focusOnReady: false,
      unmounting: false,

      heightBottom: 0,
      heightTop: 0,
      resizeObserver: null as ResizeObserver | null,
      inlineBottomObserver: null as ResizeObserver | null,
      inlineTopObserver: null as ResizeObserver | null,
      debouncedPhoneHome: null as ((x: number) => void) | null,
    };
  },

  watch: {
    'element.centerOnPage'() {
      this.setPadding(this.getEditorInstance());
      this.setPadding(this.getEditorInstanceBottom());
    },
  },

  computed: {
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
        language: {
          content: this.element.rtl ? 'ar' : 'en',
        },
        licenseKey: 'GPL',
        insertNeume: {
          neumeDefaultFontFamily: this.pageSetup.neumeDefaultFontFamily,
          defaultFontSize: this.element.inline
            ? this.pageSetup.lyricsDefaultFontSize
            : this.pageSetup.textBoxDefaultFontSize,
          defaultFontFamily: this.element.inline
            ? this.pageSetup.lyricsDefaultFontFamily
            : this.pageSetup.textBoxDefaultFontFamily,
          fthoraDefaultColor: this.pageSetup.fthoraDefaultColor,
        },
      };
    },

    content() {
      return this.editMode || this.metadata == null
        ? this.element.content
        : replaceTokens(
            this.element.content,
            this.metadata,
            TextBoxAlignment.Center,
          );
    },

    contentBottom() {
      return this.editMode || this.metadata == null
        ? this.element.contentBottom
        : replaceTokens(
            this.element.contentBottom,
            this.metadata,
            TextBoxAlignment.Center,
          );
    },

    contentLeft() {
      return this.editMode || this.metadata == null
        ? this.element.contentLeft
        : replaceTokens(
            this.element.contentLeft,
            this.metadata,
            TextBoxAlignment.Left,
          );
    },

    contentCenter() {
      return this.editMode || this.metadata == null
        ? this.element.contentCenter
        : replaceTokens(
            this.element.contentCenter,
            this.metadata,
            TextBoxAlignment.Center,
          );
    },

    contentRight() {
      return this.editMode || this.metadata == null
        ? this.element.contentRight
        : replaceTokens(
            this.element.contentRight,
            this.metadata,
            TextBoxAlignment.Right,
          );
    },

    containerStyle() {
      const style = {
        width: withZoom(this.element.width),
        height: withZoom(this.element.height),
        '--ck-content-font-family': getFontFamilyWithFallback(
          this.pageSetup.textBoxDefaultFontFamily,
          this.pageSetup.neumeDefaultFontFamily,
        ),
        '--ck-content-font-size': this.element.inline
          ? `${this.pageSetup.lyricsDefaultFontSize}px`
          : `${this.pageSetup.textBoxDefaultFontSize}px`, // no zoom because we will apply zooming on the whole editor
        '--ck-content-line-height': 'normal',
      } as StyleValue;

      return style;
    },

    textBoxStyle() {
      const style: StyleValue = {
        width: `${this.element.width}px`, // no zoom because we scale with the transform
      };

      return style;
    },

    textBoxTopInnerContainerStyle() {
      // The top text box is aligned such that the middle of the oligon sits in middle of the font.
      const style: any = {
        top: withZoom(
          this.element.defaultNeumeFontAscent -
            this.pageSetup.neumeDefaultFontSize * this.element.oligonMidpoint -
            this.element.defaultLyricsFontHeight / 2 -
            (this.heightTop - this.element.defaultLyricsFontHeight) +
            this.element.offsetYTop,
        ),
        lineHeight: this.element.defaultLyricsFontHeight + 'px',
      };

      return style;
    },

    textBoxStyleTop() {
      const style: any = {
        width: `${this.element.width}px`, // no zoom because we scale with the transform
      };

      return style;
    },

    textBoxStyleBottom() {
      const style: any = {
        width: `${this.element.width}px`, // no zoom because we scale with the transform
      };

      return style;
    },

    textBoxTopContainerStyle() {
      const style: any = {
        height: withZoom(this.element.height),
      };

      return style;
    },

    textBoxBottomContainerStyle() {
      // The bottom text box is aligned so that the baseline of the font is aligned with the lyrics baseline.
      const style: any = {
        top: withZoom(
          this.pageSetup.lyricsVerticalOffset -
            (this.heightBottom - this.element.defaultLyricsFontHeight) +
            this.element.offsetYBottom,
        ),
        lineHeight: this.element.defaultLyricsFontHeight + 'px',
      };

      return style;
    },

    multipanelContainerStyle() {
      const style: StyleValue = {
        width: `${this.element.width}px`, // no zoom because we scale with the transform
      };

      return style;
    },
  },

  created() {
    this.debouncedPhoneHome = debounce(100, this.phoneHome);
  },

  beforeUnmount() {
    this.unmounting = true;
    this.update();

    if (this.inlineTopObserver != null) {
      this.inlineTopObserver.disconnect();
    }

    if (this.inlineBottomObserver != null) {
      this.inlineBottomObserver.disconnect();
    }

    if (this.resizeObserver != null) {
      this.resizeObserver.disconnect();
    }
  },

  methods: {
    getEditorInstance() {
      return (this.$refs.editor as ComponentExposed<typeof Ckeditor>)?.instance;
    },

    getEditorInstanceBottom() {
      return (this.$refs.editorBottom as ComponentExposed<typeof Ckeditor>)
        ?.instance;
    },

    getEditorInstanceLeft() {
      return (this.$refs.editorLeft as ComponentExposed<typeof Ckeditor>)
        ?.instance;
    },

    getEditorInstanceCenter() {
      return (this.$refs.editorCenter as ComponentExposed<typeof Ckeditor>)
        ?.instance;
    },

    getEditorInstanceRight() {
      return (this.$refs.editorRight as ComponentExposed<typeof Ckeditor>)
        ?.instance;
    },

    phoneHome(height: number) {
      this.$emit('update:height', height);
    },

    onEditorReady(editor: InlineEditor) {
      if (this.recalc) {
        const height = this.getHeight();

        if (height != null && Math.abs(this.element.height - height) > 0.001) {
          this.debouncedPhoneHome!(height);
        }
      }

      if (this.focusOnReady) {
        editor.editing.view.focus();
        this.focusOnReady = false;
      }

      const element = editor.sourceElement;

      if (this.resizeObserver != null) {
        this.resizeObserver.disconnect();
      }

      this.resizeObserver = new ResizeObserver(
        debounce(100, () => {
          const resizedHeight = this.getHeight();
          console.log('update', resizedHeight, this.element.height);

          if (
            resizedHeight != null &&
            Math.abs(this.element.height - resizedHeight) > 0.001
          ) {
            if (this.recalc) {
              this.debouncedPhoneHome!(resizedHeight);
            } else {
              this.$emit('update', { height: resizedHeight });
            }
          }
        }),
      );

      this.resizeObserver.observe(element!);
      console.log(element);
    },

    onEditorReadyInline() {
      this.heightTop = this.getHeightTop() ?? 0;

      const element = (this.getEditorInstance() as any).sourceElement;

      if (this.inlineTopObserver != null) {
        this.inlineTopObserver.disconnect();
      }

      this.inlineTopObserver = new ResizeObserver(
        throttle(100, () => {
          this.heightTop = this.getHeightTop() ?? 0;
        }),
      );

      this.inlineTopObserver.observe(element);

      this.setPadding(this.getEditorInstance());
    },

    onEditorReadyInlineBottom() {
      if (this.focusOnReady) {
        this.getEditorInstanceBottom()?.editing.view.focus();
        this.focusOnReady = false;
      }

      this.heightBottom = this.getHeightBottom() ?? 0;

      const element = (this.getEditorInstanceBottom() as any).sourceElement;

      if (this.inlineBottomObserver != null) {
        this.inlineBottomObserver.disconnect();
      }

      this.inlineBottomObserver = new ResizeObserver(
        throttle(100, () => {
          this.heightBottom = this.getHeightBottom() ?? 0;
        }),
      );

      this.inlineBottomObserver.observe(element);

      this.setPadding(this.getEditorInstanceBottom());
    },

    onBlur() {
      if (!this.unmounting) {
        this.update();
      }
    },

    update() {
      const updates: Partial<RichTextBoxElement> = {};

      let updated = false;

      const height = this.getHeight();

      const content = this.getEditorInstance()?.getData() ?? '';
      const contentBottom = this.getEditorInstanceBottom()?.getData() ?? '';
      const contentLeft = this.getEditorInstanceLeft()?.getData() ?? '';
      const contentCenter = this.getEditorInstanceCenter()?.getData() ?? '';
      const contentRight = this.getEditorInstanceRight()?.getData() ?? '';

      // This should never happen, but if it does, we don't want
      // to save garbage values.
      if (height == null) {
        return;
      }

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

      if (this.editMode && this.element.contentCenter !== contentCenter) {
        updates.contentCenter = contentCenter;
        updated = true;
      }

      if (this.editMode && this.element.contentRight !== contentRight) {
        updates.contentRight = contentRight;
        updated = true;
      }

      if (
        !this.element.inline &&
        Math.abs(this.element.height - height) > 0.001
      ) {
        updates.height = height;
        updated = true;
      }

      if (this.element.inline) {
        this.heightBottom = this.getHeightBottom() ?? 0;
        this.heightTop = this.getHeightTop() ?? 0;
      }

      if (updated) {
        this.$emit('update', updates);
      }
    },

    getHeight() {
      const element = (this.$el as HTMLElement).querySelector('.ck-content');

      if (element == null) {
        return null;
      }

      const zoom = Number(getComputedStyle(element).getPropertyValue('--zoom'));

      return element.getBoundingClientRect().height / zoom;
    },

    getHeightBottom() {
      const element = (this.$el as HTMLElement).querySelector(
        '.ck-content.inline-bottom',
      );

      if (element == null) {
        return null;
      }

      const zoom = Number(getComputedStyle(element).getPropertyValue('--zoom'));

      return element.getBoundingClientRect().height / zoom;
    },

    getHeightTop() {
      const element = (this.$el as HTMLElement).querySelector(
        '.ck-content.inline-top',
      );

      if (element == null) {
        return null;
      }

      const zoom = Number(getComputedStyle(element).getPropertyValue('--zoom'));

      return element.getBoundingClientRect().height / zoom;
    },

    setPadding(editor: Editor | undefined) {
      if (editor == null) {
        return;
      }

      editor.editing.view.change((writer) => {
        const editable = editor.editing.view.document.getRoot();

        if (this.element.centerOnPage) {
          writer.setStyle(
            'padding-right',
            `${this.pageSetup.innerPageWidth - this.element.width}px`,
            editable!,
          );
        } else {
          writer.removeStyle('padding-right', editable!);
        }
      });
    },

    focus() {
      this.focusOnReady = true;
    },
  },
});
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
  overflow: visible;
  transform-origin: 0 0;
  transform: scale(var(--zoom, 1));
  border: none !important;
}

.rich-text-box-container {
  min-height: 10px;
}

.rich-text-box-container .handle {
  bottom: calc(50% - 5px);
  left: -10px;

  z-index: 1;

  display: none;
}

.rich-text-box-container.selected .handle {
  display: inline;
}

.rich-text-box-multipanel-container {
  display: flex;
}

.rich-text-editor.multipanel {
  outline: 1px dotted black;
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

.inline-container {
  display: flex;
  flex-direction: column;
}

.inline-container,
.rich-text-editor.single {
  outline: 1px dotted black;
}

.selected .inline-container,
.selected .rich-text-editor.single {
  outline: 1px solid goldenrod;
}

.rich-text-editor.inline-top {
  white-space: nowrap !important;
  position: relative;
  border: none;
  overflow: visible;
}

.rich-text-editor.inline-bottom {
  display: inline-block;
  position: relative;
  white-space: nowrap !important;
  border: none;
  overflow: visible;
}

.inline-bottom-container,
.inline-top-container,
.inline-top-inner-container {
  display: inline-block;
  position: relative;
  border: none;
  overflow: visible;
}

:deep(.ck-editor__editable.ck-focused) {
  border: none !important;
  outline: var(--ck-focus-ring) !important;
}

@media print {
  .rich-text-box-container .handle {
    display: none !important;
  }

  .rich-text-editor.multipanel {
    border: none !important;
    outline: none !important;
  }

  :deep(.ck-widget) {
    outline: none !important;
  }

  :deep(.ck-editor__editable.ck-focused) {
    outline: none !important;
  }

  :deep(.ck-widget__type-around) {
    display: none !important;
  }
}
</style>
