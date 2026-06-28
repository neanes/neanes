<template>
  <div
    ref="container"
    class="annotation-container"
    :class="{ selectedAnnotation: selected }"
    :style="style"
    @mousedown="handleMouseDown"
    @dblclick="handleDoubleClick"
  >
    <RichTextEditor
      :key="`${editorLanguage}-${contentLanguage}`"
      ref="editor"
      class="rich-text-editor"
      :owner="element"
      :model-value="element.text"
      :config="editorConfig"
      @ready="onEditorReady"
      @blur="handleEditorBlur"
      @select-neume="emit('select-neume')"
    />
  </div>
</template>

<script setup lang="ts">
import type { EditorConfig, FontSizeOption } from 'ckeditor5';
import type { PropType } from 'vue';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import type { ComponentExposed } from 'vue-component-type-helpers';

import RichTextEditor from '@/components/RichTextEditor.vue';
import type InlineEditor from '@/customEditor';
import type { AnnotationElement } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  type ParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import {
  applyRichTextLanguageToEditor,
  getRichTextLanguage,
  getRichTextLanguageCode,
  getRichTextLanguageDirection,
  hasMeaningfulRichTextEditorContent,
  inferRichTextEditorLanguage,
  RICH_TEXT_LANGUAGE_OPTIONS,
} from '@/utils/richTextLanguage';
import { withZoom } from '@/utils/withZoom';

const ANNOTATION_LOCK_ID = 'ANNOTATION_LOCK_ID';

const emit = defineEmits(['update', 'delete', 'select-neume']);
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
  paragraphStyles: {
    type: Array as PropType<ParagraphStyle[]>,
    required: true,
  },
  editorLanguage: {
    type: String,
    default: 'en',
  },
  selected: Boolean,
});

const container = useTemplateRef<HTMLElement>('container');
const editorRef =
  useTemplateRef<ComponentExposed<typeof RichTextEditor>>('editor');

const offsetX = ref(0);
const offsetY = ref(0);
const elementX = ref(0);
const elementY = ref(0);
const focusOnReady = ref(false);
const zoom = ref(1);

let clampingInterval: ReturnType<typeof setInterval> | null = null;

const hasStoredContent = computed(() => props.element.text.trim() !== '');

const defaultInitialLanguage = computed(() => {
  const storedLanguage = getRichTextLanguage(props.element);

  if (storedLanguage != null) {
    return storedLanguage;
  }

  return !hasStoredContent.value &&
    (props.pageSetup.melkiteRtl || props.pageSetup.numerals === 'easternArabic')
    ? 'ar:rtl'
    : null;
});

const contentLanguage = computed(() => {
  const language =
    getRichTextLanguage(props.element) ?? defaultInitialLanguage.value;

  return language == null ? 'en' : getRichTextLanguageCode(language);
});

const annotationStyle = computed(() =>
  resolveParagraphStyle(
    props.paragraphStyles,
    BUILT_IN_PARAGRAPH_STYLE_IDS.Annotation,
  ),
);

const style = computed(() => {
  return {
    left: withZoom(elementX.value),
    top: withZoom(elementY.value),
    '--ck-content-font-family': getFontFamilyWithFallback(
      annotationStyle.value.fontFamily,
      props.pageSetup.neumeDefaultFontFamily + 'Legacy', // TODO what a terrible hack
    ),
    '--ck-content-font-size': `${annotationStyle.value.fontSize}px`, // no zoom because we will apply zooming on the whole editor
    '--ck-content-font-color': annotationStyle.value.color,
    '--ck-content-line-height': annotationStyle.value.lineHeight ?? 'normal',
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
    language: {
      ui: props.editorLanguage,
      content: contentLanguage.value,
      textPartLanguage: RICH_TEXT_LANGUAGE_OPTIONS,
    },
    licenseKey: 'GPL',
    insertNeume: {
      neumeDefaultFontFamily: props.pageSetup.neumeDefaultFontFamily,
      defaultFontSize: annotationStyle.value.fontSize,
      defaultFontFamily: annotationStyle.value.fontFamily,
    },
  };
});

onMounted(() => {
  elementX.value = props.element.x;
  elementY.value = props.element.y;
  clampingInterval = setInterval(clampToPageBounds, 250);
});

watch(
  () => props.element.x,
  (x) => {
    elementX.value = x;
  },
);

watch(
  () => props.element.y,
  (y) => {
    elementY.value = y;
  },
);

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
  applyInitialLanguage(editor);

  if (focusOnReady.value || props.element.text.trim() === '') {
    focusOnReady.value = false;
    focusEditor(editor);
  } else {
    // Existing annotations stay read-only until selected or double-clicked.
    editor.enableReadOnlyMode(ANNOTATION_LOCK_ID);
  }
}

function handleEditorBlur(editor: InlineEditor) {
  editor.enableReadOnlyMode(ANNOTATION_LOCK_ID);
  const updates = getPendingUpdates();
  const text = updates.text ?? props.element.text;

  if (text.trim() === '') {
    emit('delete');
  } else if (Object.keys(updates).length > 0) {
    emit('update', updates);
  }
}

function getPendingUpdates() {
  const editor = getEditorInstance();
  const updates: Partial<AnnotationElement> = {};

  if (editor == null) {
    return updates;
  }

  Object.assign(updates, getRichTextLanguageUpdates(editor));

  const text = editor.getData();

  if (props.element.text !== text) {
    updates.text = text;
  }

  return updates;
}

function applyInitialLanguage(editor: InlineEditor) {
  const language = defaultInitialLanguage.value;

  if (language == null) {
    return;
  }

  const languageCode = getRichTextLanguageCode(language);
  const textDirection = getRichTextLanguageDirection(language);

  if (hasMeaningfulRichTextEditorContent(editor)) {
    if (inferRichTextEditorLanguage(editor) == null) {
      applyRichTextLanguageToEditor(editor, languageCode, textDirection);
    }

    return;
  }

  const command = editor.commands.get('textPartLanguage')!;

  if (!command.isEnabled) {
    return;
  }

  editor.execute('textPartLanguage', {
    languageCode,
    textDirection,
  });
}

function getRichTextLanguageUpdates(editor: InlineEditor) {
  const updates: Partial<AnnotationElement> = {};

  if (!hasMeaningfulRichTextEditorContent(editor)) {
    return updates;
  }

  const language = inferRichTextEditorLanguage(editor);
  const currentLanguage = getRichTextLanguage(props.element);

  if (
    (currentLanguage?.toLowerCase() ?? null) ===
    (language?.toLowerCase() ?? null)
  ) {
    return updates;
  }

  if (language == null) {
    updates.languageCode = null;
    updates.textDirection = null;
  } else {
    updates.languageCode = getRichTextLanguageCode(language);
    updates.textDirection = getRichTextLanguageDirection(language);
  }

  return updates;
}

async function handleDoubleClick() {
  const editor = getEditorInstance();

  if (editor == null) {
    return;
  }

  focusEditor(editor);
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

function focus() {
  const editor = getEditorInstance();

  if (editor == null) {
    focusOnReady.value = true;
    return;
  }

  focusEditor(editor);
}

function focusEditor(editor: InlineEditor) {
  if (editor.isReadOnly) {
    editor.disableReadOnlyMode(ANNOTATION_LOCK_ID);
  }

  editor.editing.view.focus();
}

function handleMouseMove(e: MouseEvent) {
  e.preventDefault();

  const draggedEl = container.value!;
  const pageEl = draggedEl.closest('.page') as HTMLElement | null;

  if (pageEl == null) {
    console.warn('Could not find page element');
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

  const pageEl = el.closest('.page') as HTMLElement | null;
  const offsetParent = el.offsetParent as HTMLElement | null;

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

function getCurrentText() {
  return getEditorInstance()?.getData() ?? props.element.text;
}

defineExpose({
  focus,
  getCurrentText,
  getPendingUpdates,
});
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
  color: var(--ck-content-font-color);
  font-family: var(--ck-content-font-family);
  font-size: var(--ck-content-font-size);
  line-height: var(--ck-content-line-height);

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
