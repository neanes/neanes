<template>
  <div
    ref="container"
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
        :editor="ckeditorEditor"
        :model-value="contentLeft"
        :config="editorConfig"
        :disable-watchdog="true"
        @blur="onBlur"
      />
      <ckeditor
        ref="editorCenter"
        class="rich-text-editor multipanel center"
        :editor="ckeditorEditor"
        :model-value="contentCenter"
        :config="editorConfig"
        :disable-watchdog="true"
        @blur="onBlur"
        @ready="onEditorReady"
      />
      <ckeditor
        ref="editorRight"
        class="rich-text-editor multipanel right"
        :editor="ckeditorEditor"
        :model-value="contentRight"
        :config="editorConfig"
        :disable-watchdog="true"
        @blur="onBlur"
      />
    </div>
    <div v-else-if="element.inline" class="inline-container">
      <div class="inline-top-container" :style="textBoxTopContainerStyle">
        <div
          class="inline-top-inner-container"
          :style="textBoxTopInnerContainerStyle"
        >
          <ckeditor
            ref="editor"
            class="rich-text-editor inline-top"
            :style="textBoxStyleTop"
            :editor="ckeditorEditor"
            :model-value="content"
            :config="editorConfig"
            :disable-watchdog="true"
            @blur="onBlur"
            @ready="onEditorReadyInline"
          />
        </div>
      </div>
      <div class="inline-bottom-container" :style="textBoxBottomContainerStyle">
        <ckeditor
          ref="editorBottom"
          class="rich-text-editor inline-bottom"
          :style="textBoxStyleBottom"
          :editor="ckeditorEditor"
          :model-value="contentBottom"
          :config="editorConfig"
          :disable-watchdog="true"
          @blur="onBlur"
          @ready="onEditorReadyInlineBottom"
        />
      </div>
    </div>
    <ckeditor
      v-else-if="element.scrollable"
      ref="editor"
      class="rich-text-editor single scrollable"
      :editor="ckeditorEditor"
      :model-value="content"
      :config="editorConfig"
      :disable-watchdog="true"
      :style="textBoxStyle"
      @blur="onBlur"
      @ready="onEditorReady"
    />
    <ckeditor
      v-else
      ref="editor"
      class="rich-text-editor single"
      :editor="ckeditorEditor"
      :model-value="content"
      :config="editorConfig"
      :disable-watchdog="true"
      :style="textBoxStyle"
      @blur="onBlur"
      @ready="onEditorReady"
    />
  </div>
</template>

<script setup lang="ts">
import type { FontSizeOption } from '@ckeditor/ckeditor5-font';
import { Ckeditor } from '@ckeditor/ckeditor5-vue';
import type { Editor, EditorConfig } from 'ckeditor5';
import { debounce, throttle } from 'throttle-debounce';
import type { PropType, StyleValue } from 'vue';
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import type { ComponentExposed } from 'vue-component-type-helpers';

import { useResizeObserver } from '@/composables/useResizeObserver';
import InlineEditor from '@/customEditor';
import type { RichTextBoxElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import type { TokenMetadata } from '@/utils/replaceTokens';
import { replaceTokens } from '@/utils/replaceTokens';
import { withZoom } from '@/utils/withZoom';

const emit = defineEmits(['update', 'update:height', 'select-single']);
const props = defineProps({
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
  metadata: {
    type: Object as PropType<TokenMetadata>,
    default: undefined,
  },
  recalc: {
    type: Boolean,
    default: false,
  },
});

const ckeditorEditor = InlineEditor;

const container = useTemplateRef<HTMLElement>('container');
const editorRef = useTemplateRef<ComponentExposed<typeof Ckeditor>>('editor');
const editorBottom =
  useTemplateRef<ComponentExposed<typeof Ckeditor>>('editorBottom');
const editorLeft =
  useTemplateRef<ComponentExposed<typeof Ckeditor>>('editorLeft');
const editorCenter =
  useTemplateRef<ComponentExposed<typeof Ckeditor>>('editorCenter');
const editorRight =
  useTemplateRef<ComponentExposed<typeof Ckeditor>>('editorRight');

const focusOnReady = ref(false);
const unmounting = ref(false);
const heightBottom = ref(0);
const heightTop = ref(0);
const debouncedPhoneHome = debounce(100, phoneHome);
const { observe: observeResize } = useResizeObserver();
const { observe: observeInlineTop } = useResizeObserver();
const { observe: observeInlineBottom } = useResizeObserver();

const htmlElement = computed(() => container.value!);

const editorConfig = computed((): EditorConfig => {
  const fontSizeOptions: FontSizeOption[] = [];

  for (let i = 8; i <= 72; i++) {
    fontSizeOptions.push({
      title: `${i}`,
      model: `${i}pt`,
    });
  }

  // Add a fall back font to each font so that neumes "just work"
  const fonts = props.fonts.map(
    (x) => x + ',' + props.pageSetup.neumeDefaultFontFamily,
  );

  return {
    fontFamily: {
      options: [
        'default',
        'Source Serif' + ',' + props.pageSetup.neumeDefaultFontFamily,
        'GFS Didot' + ',' + props.pageSetup.neumeDefaultFontFamily,
        'Noto Naskh Arabic' + ',' + props.pageSetup.neumeDefaultFontFamily,
        'Old Standard' + ',' + props.pageSetup.neumeDefaultFontFamily,
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
      content: props.element.rtl ? 'ar' : 'en',
    },
    licenseKey: 'GPL',
    insertNeume: {
      neumeDefaultFontFamily: props.pageSetup.neumeDefaultFontFamily,
      defaultFontSize: props.element.inline
        ? props.pageSetup.lyricsDefaultFontSize
        : props.pageSetup.textBoxDefaultFontSize,
      defaultFontFamily: props.element.inline
        ? props.pageSetup.lyricsDefaultFontFamily
        : props.pageSetup.textBoxDefaultFontFamily,
      fthoraDefaultColor: props.pageSetup.fthoraDefaultColor,
    },
  };
});

const content = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.content
    : replaceTokens(
        props.element.content,
        props.metadata,
        TextBoxAlignment.Center,
      );
});

const contentBottom = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.contentBottom
    : replaceTokens(
        props.element.contentBottom,
        props.metadata,
        TextBoxAlignment.Center,
      );
});

const contentLeft = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.contentLeft
    : replaceTokens(
        props.element.contentLeft,
        props.metadata,
        TextBoxAlignment.Left,
      );
});

const contentCenter = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.contentCenter
    : replaceTokens(
        props.element.contentCenter,
        props.metadata,
        TextBoxAlignment.Center,
      );
});

const contentRight = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.contentRight
    : replaceTokens(
        props.element.contentRight,
        props.metadata,
        TextBoxAlignment.Right,
      );
});

const containerStyle = computed(() => {
  const style: StyleValue = {
    width: withZoom(props.element.width),
    height: withZoom(props.element.height),
    '--ck-content-font-family': getFontFamilyWithFallback(
      props.pageSetup.textBoxDefaultFontFamily,
      props.pageSetup.neumeDefaultFontFamily,
    ),
    '--ck-content-font-size': props.element.inline
      ? `${props.pageSetup.lyricsDefaultFontSize}px`
      : `${props.pageSetup.textBoxDefaultFontSize}px`, // no zoom because we will apply zooming on the whole editor
    '--ck-content-line-height': 'normal',
  };

  return style;
});

const textBoxStyle = computed(() => {
  const style: StyleValue = {
    width: `${props.element.width}px`, // no zoom because we scale with the transform
    maxHeight: withZoom(
      props.pageSetup.pageHeight -
        props.element.y -
        props.pageSetup.bottomMargin,
    ),
  };

  return style;
});

const textBoxTopInnerContainerStyle = computed(() => {
  // The top text box is aligned such that the middle of the oligon sits in middle of the font.
  const style: any = {
    top: withZoom(
      props.element.defaultNeumeFontAscent -
        props.pageSetup.neumeDefaultFontSize * props.element.oligonMidpoint -
        props.element.defaultLyricsFontHeight / 2 -
        (heightTop.value - props.element.defaultLyricsFontHeight) +
        props.element.offsetYTop,
    ),
    lineHeight: props.element.defaultLyricsFontHeight + 'px',
  };

  return style;
});

const textBoxStyleTop = computed(() => {
  const style: any = {
    width: `${props.element.width}px`, // no zoom because we scale with the transform
  };

  return style;
});

const textBoxStyleBottom = computed(() => {
  const style: any = {
    width: `${props.element.width}px`, // no zoom because we scale with the transform
  };

  return style;
});

const textBoxTopContainerStyle = computed(() => {
  const style: any = {
    height: withZoom(props.element.height),
  };

  return style;
});

const textBoxBottomContainerStyle = computed(() => {
  // The bottom text box is aligned so that the baseline of the font is aligned with the lyrics baseline.
  const style: any = {
    top: withZoom(
      props.pageSetup.lyricsVerticalOffset -
        (heightBottom.value - props.element.defaultLyricsFontHeight) +
        props.element.offsetYBottom,
    ),
    lineHeight: props.element.defaultLyricsFontHeight + 'px',
  };

  return style;
});

const multipanelContainerStyle = computed(() => {
  const style: StyleValue = {
    width: `${props.element.width}px`, // no zoom because we scale with the transform
  };

  return style;
});

watch(
  () => props.element.centerOnPage,
  () => {
    setPadding(getEditorInstance());
    setPadding(getEditorInstanceBottom());
  },
);

onBeforeUnmount(() => {
  unmounting.value = true;
  update();
  // Observers are disconnected automatically by useResizeObserver's own
  // onBeforeUnmount hook.
});

function getEditorInstance() {
  return editorRef.value?.instance;
}

function getEditorInstanceBottom() {
  return editorBottom.value?.instance;
}

function getEditorInstanceLeft() {
  return editorLeft.value?.instance;
}

function getEditorInstanceCenter() {
  return editorCenter.value?.instance;
}

function getEditorInstanceRight() {
  return editorRight.value?.instance;
}

function phoneHome(height: number) {
  emit('update:height', height);
}

function onEditorReady(editor: InlineEditor) {
  if (props.recalc) {
    const height = getHeight();

    if (height != null && Math.abs(props.element.height - height) > 0.001) {
      debouncedPhoneHome(height);
    }
  }

  if (focusOnReady.value) {
    editor.editing.view.focus();
    focusOnReady.value = false;
  }

  const element = editor.sourceElement;

  observeResize(
    element!,
    debounce(100, () => {
      const resizedHeight = getHeight();

      if (
        resizedHeight != null &&
        Math.abs(props.element.height - resizedHeight) > 0.001
      ) {
        if (props.recalc) {
          debouncedPhoneHome(resizedHeight);
        } else {
          emit('update', { height: resizedHeight });
        }
      }
    }),
  );
}

function onEditorReadyInline(editor: InlineEditor) {
  heightTop.value = getHeightTop() ?? 0;

  const element = editor.sourceElement;

  observeInlineTop(
    element!,
    throttle(100, () => {
      heightTop.value = getHeightTop() ?? 0;
    }),
  );

  setPadding(editor);
}

function onEditorReadyInlineBottom(editor: InlineEditor) {
  if (focusOnReady.value) {
    editor.editing.view.focus();
    focusOnReady.value = false;
  }

  heightBottom.value = getHeightBottom() ?? 0;

  const element = editor.sourceElement;

  observeInlineBottom(
    element!,
    throttle(100, () => {
      heightBottom.value = getHeightBottom() ?? 0;
    }),
  );

  setPadding(editor);
}

function onBlur() {
  if (!unmounting.value) {
    update();
  }
}

function update() {
  const updates: Partial<RichTextBoxElement> = {};

  let updated = false;

  const height = getHeight();

  const currentContent = getEditorInstance()?.getData() ?? '';
  const currentContentBottom = getEditorInstanceBottom()?.getData() ?? '';
  const currentContentLeft = getEditorInstanceLeft()?.getData() ?? '';
  const currentContentCenter = getEditorInstanceCenter()?.getData() ?? '';
  const currentContentRight = getEditorInstanceRight()?.getData() ?? '';

  // This should never happen, but if it does, we don't want
  // to save garbage values.
  if (height == null) {
    return;
  }

  if (props.editMode && props.element.content !== currentContent) {
    updates.content = currentContent;
    updated = true;
  }

  if (props.editMode && props.element.contentBottom !== currentContentBottom) {
    updates.contentBottom = currentContentBottom;
    updated = true;
  }

  if (props.editMode && props.element.contentLeft !== currentContentLeft) {
    updates.contentLeft = currentContentLeft;
    updated = true;
  }

  if (props.editMode && props.element.contentCenter !== currentContentCenter) {
    updates.contentCenter = currentContentCenter;
    updated = true;
  }

  if (props.editMode && props.element.contentRight !== currentContentRight) {
    updates.contentRight = currentContentRight;
    updated = true;
  }

  if (
    !props.element.inline &&
    Math.abs(props.element.height - height) > 0.001
  ) {
    updates.height = height;
    updated = true;
  }

  if (props.element.inline) {
    heightBottom.value = getHeightBottom() ?? 0;
    heightTop.value = getHeightTop() ?? 0;
  }

  if (updated) {
    emit('update', updates);
  }
}

function getHeight() {
  const element = container.value?.querySelector('.ck-content');

  if (element == null) {
    return null;
  }

  const zoom = Number(getComputedStyle(element).getPropertyValue('--zoom'));

  return element.getBoundingClientRect().height / zoom;
}

function getHeightBottom() {
  const element = container.value?.querySelector('.ck-content.inline-bottom');

  if (element == null) {
    return null;
  }

  const zoom = Number(getComputedStyle(element).getPropertyValue('--zoom'));

  return element.getBoundingClientRect().height / zoom;
}

function getHeightTop() {
  const element = container.value?.querySelector('.ck-content.inline-top');

  if (element == null) {
    return null;
  }

  const zoom = Number(getComputedStyle(element).getPropertyValue('--zoom'));

  return element.getBoundingClientRect().height / zoom;
}

function setPadding(editor: Editor | undefined) {
  if (editor == null) {
    return;
  }

  editor.editing.view.change((writer) => {
    const editable = editor.editing.view.document.getRoot();

    if (props.element.centerOnPage) {
      writer.setStyle(
        'padding-right',
        `${props.pageSetup.innerPageWidth - props.element.width}px`,
        editable!,
      );
    } else {
      writer.removeStyle('padding-right', editable!);
    }
  });
}

function focus() {
  focusOnReady.value = true;
}

defineExpose({
  focus,
  htmlElement,
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

/*
 * CKEditor sizes inline spans but leaves the parent <p>/<li> at the editor's
 * default line-height, so small inline text still reserves a default-size line
 * box. When a block has explicit font-size spans, collapse the parent line box
 * and let the sized children supply their own leading, so two 8pt lines stack
 * like two 8pt lines. The :has() guard avoids collapsing plain text, which is a
 * bare text node the child rule can't reach.
 */
:deep(.ck-content :is(p, li):has(span[style*='font-size'])) {
  line-height: 0;
}

:deep(.ck-content :is(p, li):has(span[style*='font-size']) *) {
  line-height: normal;
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

.rich-text-editor.scrollable {
  overflow-y: auto;
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
