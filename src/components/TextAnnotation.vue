<template>
  <div
    ref="container"
    class="annotation-container"
    :class="{ selectedAnnotation: selected }"
    :style="style"
    @mousedown="handleMouseDown"
    @dblclick="handleDoubleClick"
  >
    <ckeditor
      ref="editor"
      class="rich-text-editor"
      :editor="ckeditorEditor"
      :model-value="element.text"
      :config="editorConfig"
      :disable-watchdog="true"
      @ready="onEditorReady"
    />
  </div>
</template>

<script setup lang="ts">
import { Ckeditor } from '@ckeditor/ckeditor5-vue';
import type { EditorConfig, FontSizeOption } from 'ckeditor5';
import type { PropType } from 'vue';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import type { ComponentExposed } from 'vue-component-type-helpers';

import InlineEditor from '@/customEditor';
import type { AnnotationElement } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { withZoom } from '@/utils/withZoom';

const ANNOTATION_LOCK_ID = 'ANNOTATION_LOCK_ID';

const emit = defineEmits(['update', 'delete']);
const props = defineProps({
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
});

const container = useTemplateRef<HTMLElement>('container');
const editorRef = useTemplateRef<ComponentExposed<typeof Ckeditor>>('editor');

const offsetX = ref(0);
const offsetY = ref(0);
const elementX = ref(0);
const elementY = ref(0);
const zoom = ref(1);
const ckeditorEditor = InlineEditor;

let clampingInterval: ReturnType<typeof setInterval> | null = null;

const style = computed(() => {
  return {
    left: withZoom(elementX.value),
    top: withZoom(elementY.value),
    '--ck-content-font-family': getFontFamilyWithFallback(
      props.pageSetup.textBoxDefaultFontFamily,
      props.pageSetup.neumeDefaultFontFamily + 'Legacy', // TODO what a terrible hack
    ),
    '--ck-content-font-size': `${props.pageSetup.lyricsDefaultFontSize}px`, // no zoom because we will apply zooming on the whole editor
    '--ck-content-line-height': 'normal',
  };
});

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
    // TODO support rtl
    // language: {
    //   content: props.element.rtl ? 'ar' : 'en',
    // },
    licenseKey: 'GPL',
    insertNeume: {
      neumeDefaultFontFamily: props.pageSetup.neumeDefaultFontFamily,
      defaultFontSize: props.pageSetup.lyricsDefaultFontSize,
      defaultFontFamily: props.pageSetup.lyricsDefaultFontFamily,
      fthoraDefaultColor: props.pageSetup.fthoraDefaultColor,
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
});

onMounted(() => {
  elementX.value = props.element.x;
  elementY.value = props.element.y;
  clampingInterval = setInterval(clampToPageBounds, 250);
});

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('mousemove', handleMouseMove);

  if (clampingInterval != null) {
    clearInterval(clampingInterval);
  }
});

function getEditorInstance() {
  return editorRef.value?.instance;
}

function onEditorReady(editor: InlineEditor) {
  // If the text is empty, we want to focus the editor
  // because this is a new annotation
  if (props.element.text.trim() === '') {
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
        emit('delete');
      } else if (props.element.text !== text) {
        emit('update', { text });
      }
    }
  });

  const toolbarEl = editor.ui.view.toolbar.element;
  if (toolbarEl) {
    toolbarEl.style.maxWidth = '400px';
  }
}

async function handleDoubleClick() {
  const editor = getEditorInstance();

  if (editor == null) {
    return;
  }

  if (editor.isReadOnly) {
    editor.disableReadOnlyMode(ANNOTATION_LOCK_ID);
    editor.editing.view.focus();
  }
}

function handleMouseDown(e: MouseEvent) {
  if (getEditorInstance()?.isReadOnly === false) {
    return;
  }

  // We only calculate zoom once when the mouse is pressed down
  // to avoid recalculating it on every mouse move
  zoom.value = Number(
    getComputedStyle(container.value!).getPropertyValue('--zoom'),
  );

  const draggedEl = container.value!;
  const rect = draggedEl.getBoundingClientRect();

  // Calculate the offset of the mouse click relative to the element
  offsetX.value = e.clientX - rect.left;
  offsetY.value = e.clientY - rect.top;

  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousemove', handleMouseMove);
}

function handleMouseMove(e: MouseEvent) {
  e.preventDefault();

  const draggedEl = container.value!;
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
  const desiredLeft = e.clientX - offsetX.value;
  const desiredTop = e.clientY - offsetY.value;

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
    getComputedStyle(container.value!).getPropertyValue('--zoom'),
  );

  elementX.value = newX / zoom;
  elementY.value = newY / zoom;
}

function clampToPageBounds() {
  const el = container.value;

  if (!el) {
    return;
  }

  const pageEl = el.closest('.page') as HTMLElement;
  const offsetParent = el.offsetParent as HTMLElement;

  if (!pageEl || !offsetParent) {
    return;
  }

  const zoom = Number(getComputedStyle(el).getPropertyValue('--zoom'));

  const elRect = el.getBoundingClientRect();
  const pageRect = pageEl.getBoundingClientRect();
  const parentRect = offsetParent.getBoundingClientRect();

  const elWidth = elRect.width;
  const elHeight = elRect.height;

  // Current position relative to offset parent
  const currentX = elementX.value * zoom;
  const currentY = elementY.value * zoom;

  // Convert .page bounds into offsetParent-relative coordinates
  const minX = pageRect.left - parentRect.left;
  const minY = pageRect.top - parentRect.top;
  const maxX = pageRect.right - parentRect.left - elWidth;
  const maxY = pageRect.bottom - parentRect.top - elHeight;

  // Clamp
  elementX.value = Math.max(minX, Math.min(currentX, maxX)) / zoom;
  elementY.value = Math.max(minY, Math.min(currentY, maxY)) / zoom;
}

function handleMouseUp() {
  emit('update', { x: elementX.value, y: elementY.value });

  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('mousemove', handleMouseMove);
}
</script>

<style scoped>
.annotation-container {
  position: absolute;
  white-space: nowrap;
  z-index: 42;
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
