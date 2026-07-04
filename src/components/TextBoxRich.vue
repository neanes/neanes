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
      <RichTextEditor
        :key="`left-${editorLanguage}-${contentLanguage}-${paragraphStyleDefinitionKey}`"
        ref="editorLeft"
        class="rich-text-editor multipanel left"
        :owner="element"
        :model-value="contentLeft"
        :config="editorConfig"
        @blur="onBlur"
        @ready="onEditorReadyMultipanelSide"
        @select-neume="emit('select-neume')"
      />
      <RichTextEditor
        :key="`center-${editorLanguage}-${contentLanguage}-${paragraphStyleDefinitionKey}`"
        ref="editorCenter"
        class="rich-text-editor multipanel center"
        :owner="element"
        :model-value="contentCenter"
        :config="editorConfig"
        @blur="onBlur"
        @ready="onEditorReady"
        @select-neume="emit('select-neume')"
      />
      <RichTextEditor
        :key="`right-${editorLanguage}-${contentLanguage}-${paragraphStyleDefinitionKey}`"
        ref="editorRight"
        class="rich-text-editor multipanel right"
        :owner="element"
        :model-value="contentRight"
        :config="editorConfig"
        @blur="onBlur"
        @ready="onEditorReadyMultipanelSide"
        @select-neume="emit('select-neume')"
      />
    </div>
    <div v-else-if="element.inline" class="inline-container">
      <div class="inline-top-container" :style="textBoxTopContainerStyle">
        <div
          class="inline-top-inner-container"
          :style="textBoxTopInnerContainerStyle"
        >
          <RichTextEditor
            :key="`inline-top-${editorLanguage}-${contentLanguage}-${paragraphStyleDefinitionKey}`"
            ref="editor"
            class="rich-text-editor inline-top"
            :style="textBoxStyleTop"
            :owner="element"
            :model-value="content"
            :config="editorConfig"
            @blur="onBlur"
            @ready="onEditorReadyInline"
            @select-neume="emit('select-neume')"
          />
        </div>
      </div>
      <div class="inline-bottom-container" :style="textBoxBottomContainerStyle">
        <RichTextEditor
          :key="`inline-bottom-${editorLanguage}-${contentLanguage}-${paragraphStyleDefinitionKey}`"
          ref="editorBottom"
          class="rich-text-editor inline-bottom"
          :style="textBoxStyleBottom"
          :owner="element"
          :model-value="contentBottom"
          :config="editorConfig"
          @blur="onBlur"
          @ready="onEditorReadyInlineBottom"
          @select-neume="emit('select-neume')"
        />
      </div>
    </div>
    <RichTextEditor
      v-else-if="element.scrollable"
      :key="`scrollable-${editorLanguage}-${contentLanguage}-${paragraphStyleDefinitionKey}`"
      ref="editor"
      class="rich-text-editor single scrollable"
      :owner="element"
      :model-value="content"
      :config="editorConfig"
      :style="textBoxStyle"
      @blur="onBlur"
      @ready="onEditorReady"
      @select-neume="emit('select-neume')"
    />
    <RichTextEditor
      v-else
      :key="`single-${editorLanguage}-${contentLanguage}-${paragraphStyleDefinitionKey}`"
      ref="editor"
      class="rich-text-editor single"
      :owner="element"
      :model-value="content"
      :config="editorConfig"
      :style="textBoxStyle"
      @blur="onBlur"
      @ready="onEditorReady"
      @select-neume="emit('select-neume')"
    />
    <component :is="'style'">{{ paragraphStyleCss }}</component>
  </div>
</template>

<script setup lang="ts">
import type { Editor, EditorConfig, FontSizeOption } from 'ckeditor5';
import { debounce, throttle } from 'throttle-debounce';
import type { PropType, StyleValue } from 'vue';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import type { ComponentExposed } from 'vue-component-type-helpers';

import RichTextEditor from '@/components/RichTextEditor.vue';
import { useResizeObserver } from '@/composables/useResizeObserver';
import type InlineEditor from '@/customEditor';
import type {
  RichTextBoxContentKey,
  RichTextBoxElement,
} from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import {
  getTextBoxParagraphStyleFallbackId,
  type ParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import { getFontFamilyWithNeumeFallback } from '@/utils/getFontFamilyWithFallback';
import type { TokenMetadata, TokenScope } from '@/utils/replaceTokens';
import { replaceTokens } from '@/utils/replaceTokens';
import {
  applyRichTextLanguageToEditor,
  getRichTextLanguage,
  getRichTextLanguageCode,
  getRichTextLanguageDirection,
  hasMeaningfulRichTextEditorContent,
  inferRichTextEditorLanguage,
  inferSharedRichTextEditorLanguage,
  RICH_TEXT_LANGUAGE_OPTIONS,
} from '@/utils/richTextLanguage';
import { richTextParagraphStyleClassName } from '@/utils/richTextParagraphStyleClasses';
import { buildRichTextParagraphStyleCss } from '@/utils/richTextParagraphStyleCss';
import { Unit } from '@/utils/Unit';
import { withZoom } from '@/utils/withZoom';

const emit = defineEmits([
  'update',
  'update:height',
  'select-single',
  'select-neume',
]);
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
  paragraphStyles: {
    type: Array as PropType<ParagraphStyle[]>,
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
  tokenScope: {
    type: String as PropType<TokenScope>,
    default: 'body',
  },
  recalc: {
    type: Boolean,
    default: false,
  },
  editorLanguage: {
    type: String,
    default: 'en',
  },
});

const container = useTemplateRef<HTMLElement>('container');
const editorRef =
  useTemplateRef<ComponentExposed<typeof RichTextEditor>>('editor');
const editorBottom =
  useTemplateRef<ComponentExposed<typeof RichTextEditor>>('editorBottom');
const editorLeft =
  useTemplateRef<ComponentExposed<typeof RichTextEditor>>('editorLeft');
const editorCenter =
  useTemplateRef<ComponentExposed<typeof RichTextEditor>>('editorCenter');
const editorRight =
  useTemplateRef<ComponentExposed<typeof RichTextEditor>>('editorRight');

const focusOnReady = ref(false);
const unmounting = ref(false);
const heightBottom = ref(0);
const heightTop = ref(0);
const debouncedPhoneHome = debounce(100, phoneHome);
const { observe: observeResize } = useResizeObserver();
const { observe: observeInlineTop } = useResizeObserver();
const { observe: observeInlineBottom } = useResizeObserver();

const htmlElement = computed(() => container.value!);

const activeContentValues = computed(() => {
  if (props.element.multipanel) {
    return [
      props.element.contentLeft,
      props.element.contentCenter,
      props.element.contentRight,
    ];
  }

  if (props.element.inline) {
    return [props.element.content, props.element.contentBottom];
  }

  return [props.element.content];
});

const hasStoredContent = computed(() =>
  activeContentValues.value.some((html) => html.trim() !== ''),
);

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

const fallbackParagraphStyleId = computed(() =>
  getTextBoxParagraphStyleFallbackId(props.element.inline),
);

const resolvedParagraphStyle = computed(() =>
  resolveParagraphStyle(props.paragraphStyles, fallbackParagraphStyleId.value),
);

const paragraphStyleDefinitions = computed(() =>
  props.paragraphStyles.map((style) => ({
    name: style.id,
    element: 'p',
    classes: [richTextParagraphStyleClassName(style.id)],
  })),
);

const paragraphStyleDefinitionKey = computed(() =>
  props.paragraphStyles.map((style) => style.id).join('|'),
);

const paragraphStyleCss = computed(() =>
  buildRichTextParagraphStyleCss(
    props.paragraphStyles,
    props.pageSetup,
    '.ck-content',
  ),
);

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
    style: {
      definitions: paragraphStyleDefinitions.value,
    },
    licenseKey: 'GPL',
    insertNeume: {
      neumeDefaultFontFamily: props.pageSetup.neumeDefaultFontFamily,
      defaultFontSize: resolvedParagraphStyle.value.fontSize,
      defaultFontFamily: resolvedParagraphStyle.value.fontFamily,
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

function getSelectedFontSize(editor: Editor): string | undefined {
  const fontSize = editor.model.document.selection.getAttribute('fontSize');
  return typeof fontSize === 'string' ? fontSize : undefined;
}

function getFontSizeInPt(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.trim().match(/^([\d.]+)(pt|px)$/);

  if (match == null) {
    return null;
  }

  const size = Number(match[1]);

  if (!Number.isFinite(size)) {
    return null;
  }

  return match[2] === 'pt' ? size : Unit.toPt(size);
}

function getMinimumFontSizeInEditor(editor: Editor) {
  const sizes: number[] = [];

  sizes.push(Unit.toPt(resolvedParagraphStyle.value.fontSize));

  const selectedFontSize = getSelectedFontSize(editor);

  const selectedFontSizeInPt = getFontSizeInPt(selectedFontSize);

  if (selectedFontSizeInPt != null) {
    sizes.push(selectedFontSizeInPt);
  }

  for (const root of editor.model.document.roots) {
    for (const item of editor.model.createRangeIn(root).getItems()) {
      const fontSize = item.getAttribute('fontSize');

      const fontSizeInPt = getFontSizeInPt(fontSize);

      if (fontSizeInPt != null) {
        sizes.push(fontSizeInPt);
      }
    }
  }

  return `${Math.min(...sizes)}pt`;
}

const containerStyle = computed(() => {
  const style: StyleValue = {
    width: withZoom(props.element.width),
    height: withZoom(props.element.height),
    '--ck-content-font-family': getFontFamilyWithNeumeFallback(
      resolvedParagraphStyle.value.fontFamily,
      props.pageSetup.neumeDefaultFontFamily,
    ),
    '--ck-content-font-size': props.element.inline
      ? `${resolvedParagraphStyle.value.fontSize}px`
      : ckContentFontSize.value, // no zoom because we will apply zooming on the whole editor
    '--ck-content-font-color': resolvedParagraphStyle.value.color,
    '--ck-content-line-height': `${resolvedParagraphStyle.value.lineHeight ?? 'normal'}`,
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

watch(
  () => resolvedParagraphStyle.value.fontSize,
  () => {
    refreshCkContentFontSize();
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

function getActiveEditorInstances() {
  if (props.element.multipanel) {
    return [
      getEditorInstanceLeft(),
      getEditorInstanceCenter(),
      getEditorInstanceRight(),
    ];
  }

  if (props.element.inline) {
    return [getEditorInstance(), getEditorInstanceBottom()];
  }

  return [getEditorInstance()];
}

function phoneHome(height: number) {
  emit('update:height', height);
}

const ckContentFontSize = ref(`${resolvedParagraphStyle.value.fontSize}px`);

function getMinimumFontSizeInActiveEditors() {
  const activeEditors = getActiveEditorInstances().filter(
    (editor): editor is InlineEditor => editor != null,
  );

  if (activeEditors.length === 0) {
    return `${resolvedParagraphStyle.value.fontSize}px`;
  }

  const minimumSizes = activeEditors.map((editor) =>
    parseFloat(getMinimumFontSizeInEditor(editor)),
  );

  return `${Math.min(...minimumSizes)}pt`;
}

function refreshCkContentFontSize() {
  ckContentFontSize.value = getMinimumFontSizeInActiveEditors();
}

async function initializeCkContentFontSize() {
  refreshCkContentFontSize();
  await nextTick();
}

function emitRecalculatedHeightIfNeeded() {
  if (!props.recalc) {
    return;
  }

  const height = getHeight();

  if (height != null && Math.abs(props.element.height - height) > 0.001) {
    debouncedPhoneHome(height);
  }
}

function observeCkContentFontSize(editor: InlineEditor) {
  editor.model.document.on('change:data', () => refreshCkContentFontSize());

  editor.model.document.selection.on(
    'change:attribute',
    (_evt, attributeName) => {
      if (attributeName === 'fontSize') {
        refreshCkContentFontSize();
      }
    },
  );
}

async function onEditorReady(editor: InlineEditor) {
  applyInitialLanguage(editor);
  await initializeCkContentFontSize();

  emitRecalculatedHeightIfNeeded();

  if (focusOnReady.value) {
    editor.editing.view.focus();
    focusOnReady.value = false;
  }

  const element = editor.sourceElement;

  observeCkContentFontSize(editor);

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
          // A resize is pure geometry -- there is no pending edit to persist. Route
          // through `update:height` (-> updateRichTextBoxHeight, which only sets
          // the height), not `update` (-> updateRichTextBox), which merges
          // getPendingRichTextBoxUpdates() and would inject the editor's getData()
          // into this height-only change. element.content is stale while editing
          // (the focus-zone suppresses the blur that would flush it), so that merge
          // makes the update two-keyed, breaking the single-key `noHistory` guard
          // -> a spurious undo entry + full save on every height-changing font/size
          // change. (The injected content also echoes back through `:model-value`
          // to editor.data.set(); the selection collapse that once caused is now
          // prevented by RichTextEditor's own echo guard, but the churn is not.)
          emit('update:height', resizedHeight);
        }
      }
    }),
  );
}

async function onEditorReadyMultipanelSide(editor: InlineEditor) {
  applyInitialLanguage(editor);
  await initializeCkContentFontSize();
  emitRecalculatedHeightIfNeeded();
  observeCkContentFontSize(editor);
}

function onEditorReadyInline(editor: InlineEditor) {
  applyInitialLanguage(editor);

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
  applyInitialLanguage(editor);

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

function onBlur() {
  if (!unmounting.value) {
    update();
  }
}

function update() {
  const updates = getPendingUpdates();

  if (updates != null) {
    emit('update', updates);
  }
}

function getPendingUpdates() {
  const updates: Partial<RichTextBoxElement> = {};

  let updated = false;

  const height = getHeight();

  updated =
    addPendingEditorData(updates, 'content', getEditorInstance()) || updated;
  updated =
    addPendingEditorData(updates, 'contentBottom', getEditorInstanceBottom()) ||
    updated;
  updated =
    addPendingEditorData(updates, 'contentLeft', getEditorInstanceLeft()) ||
    updated;
  updated =
    addPendingEditorData(updates, 'contentCenter', getEditorInstanceCenter()) ||
    updated;
  updated =
    addPendingEditorData(updates, 'contentRight', getEditorInstanceRight()) ||
    updated;

  const activeEditors = getActiveEditorInstances();

  if (props.editMode && activeEditors.some(Boolean)) {
    const hasMeaningfulContent = activeEditors.some(
      (editor) => editor != null && hasMeaningfulRichTextEditorContent(editor),
    );

    if (hasMeaningfulContent) {
      const language = inferSharedRichTextEditorLanguage(activeEditors);
      const currentLanguage = getRichTextLanguage(props.element);

      if (
        (currentLanguage?.toLowerCase() ?? null) !==
        (language?.toLowerCase() ?? null)
      ) {
        if (language == null) {
          updates.languageCode = null;
          updates.textDirection = null;
        } else {
          updates.languageCode = getRichTextLanguageCode(language);
          updates.textDirection = getRichTextLanguageDirection(language);
        }
        updated = true;
      }
    }
  }

  if (
    height != null &&
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
    return updates;
  }

  return null;
}

function addPendingEditorData(
  updates: Partial<RichTextBoxElement>,
  propertyName: RichTextBoxContentKey,
  editor: Editor | undefined,
) {
  if (!props.editMode || editor == null) {
    return false;
  }

  const currentContent = editor.getData();

  if (props.element[propertyName] === currentContent) {
    return false;
  }

  updates[propertyName] = currentContent;
  return true;
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
  const editor =
    (props.element.multipanel
      ? getEditorInstanceCenter()
      : props.element.inline
        ? getEditorInstanceBottom()
        : getEditorInstance()) ??
    getEditorInstance() ??
    getEditorInstanceCenter() ??
    getEditorInstanceBottom() ??
    getEditorInstanceLeft() ??
    getEditorInstanceRight();

  if (editor == null) {
    focusOnReady.value = true;
    return;
  }

  editor.editing.view.focus();
}

defineExpose({
  focus,
  getPendingUpdates,
  htmlElement,
});
</script>

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
  color: var(--ck-content-font-color);
  font-family: var(--ck-content-font-family);
  font-size: var(--ck-content-font-size);
  line-height: var(--ck-content-line-height);
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
