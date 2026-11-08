<template>
  <Ckeditor
    ref="editorRef"
    v-bind="$attrs"
    :editor="InlineEditor"
    :model-value="initialData"
    :config="config"
    :disable-two-way-data-binding="true"
    @ready="onReady"
    @destroy="onDestroy"
  />
</template>

<script setup lang="ts">
import { Ckeditor } from '@ckeditor/ckeditor5-vue';
import type { EditorConfig, ViewDocumentDomEventData } from 'ckeditor5';
import { computed, inject, onBeforeUnmount, useTemplateRef, watch } from 'vue';
import type { ComponentExposed } from 'vue-component-type-helpers';

import { Footnotes } from '@/ckeditor-plugins/footnotes/footnotes';
import { NEUME_ELEMENT } from '@/ckeditor-plugins/insertneume/insertneumeediting';
import {
  registerEditor,
  unregisterEditor,
} from '@/composables/useRichTextEditorRegistry';
import { richTextFootnoteControllerKey } from '@/composables/useRichTextFootnotes';
import InlineEditor from '@/customEditor';
import type {
  RichTextBoxContentKey,
  RichTextFootnoteMarker,
} from '@/models/Element';
import {
  FOOTNOTE_ELEMENT,
  richTextFootnoteIds,
} from '@/services/RichTextFootnotes';
import { inferRichTextEditorDirection } from '@/utils/richTextLanguage';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  config: EditorConfig;
  modelValue: string;
  owner: object;
  contentKey?: RichTextBoxContentKey;
  footnotesEditable?: boolean;
  footnoteMarkers?: Readonly<Record<string, RichTextFootnoteMarker>>;
}>();

const emit = defineEmits<{
  blur: [editor: InlineEditor];
  ready: [editor: InlineEditor];
  'select-neume': [];
}>();

const editorRef =
  useTemplateRef<ComponentExposed<typeof Ckeditor>>('editorRef');
const instance = computed(
  () => editorRef.value?.instance as InlineEditor | undefined,
);

// Seed CKEditor once. Apply incoming HTML only when it differs from live data,
// so committing the current content does not reset the caret or native history.
const initialData = props.modelValue;
let loadedModelValue = initialData;
let applyingModel = false;
const footnotes = inject(richTextFootnoteControllerKey, null);
watch(
  () => props.footnoteMarkers,
  (markers) => {
    const editor = instance.value;
    if (editor !== undefined) {
      editor.plugins.get(Footnotes).setMarkers(markers ?? {});
    }
  },
);

// Read the owner's current field, not this component's possibly stale prop:
// a keyed remount can unmount us before Vue delivers the new modelValue.
function canFlush(modelValue: string) {
  return modelValue === loadedModelValue;
}

watch([() => props.modelValue, instance], ([next, editor]) => {
  if (editor != null) {
    if (next !== editor.getData()) {
      applyingModel = true;
      try {
        editor.data.set(next);
      } finally {
        applyingModel = false;
      }
    }
    loadedModelValue = next;
  }
});

let registeredEditor: InlineEditor | null = null;
let unregisterFocusTracker: (() => void) | null = null;
let unregisterViewClick: (() => void) | null = null;
let editorIsFocused = false;

watch(
  () => props.owner,
  (owner) => {
    if (registeredEditor != null) {
      registerEditor(registeredEditor, owner);
    }
  },
);

onBeforeUnmount(() => {
  // A keyed remount can destroy CKEditor while it still owns unsaved data.
  // Treat focused teardown like blur so parents can persist before destroy.
  if (registeredEditor != null && editorIsFocused) {
    emit('blur', registeredEditor);
  }

  unregisterRichTextEditor();
});

// CKEditor writes the editable root's `dir` from `config.language.content` when
// it renders, so on its own the base direction only catches up with the text on
// a remount. That direction is what `text-align: justify` resolves its last line
// against, and the `<span dir="rtl">` the language dropdown applies cannot supply
// it -- an inline span is bidi-isolated, so it reorders its own glyphs and
// contributes nothing to the block. Keep the root in step with the text instead.
function refreshBaseDirection(editor: InlineEditor) {
  const view = editor.editing.view;
  const direction =
    inferRichTextEditorDirection(editor) ??
    editor.locale.contentLanguageDirection;

  view.change((writer) => {
    writer.setAttribute('dir', direction, view.document.getRoot()!);
  });
}

function onReady(editor: InlineEditor) {
  const plugin = editor.plugins.get(Footnotes);
  plugin.setMarkers(props.footnoteMarkers ?? {});
  if (footnotes !== null) {
    plugin.clipboard = {
      copy: (id) => footnotes.copy(id),
      reject: () => footnotes.reject(props.owner),
      paste:
        props.footnotesEditable && footnotes.supports(props.owner)
          ? (payload) => {
              if (!footnotes.supports(props.owner)) {
                throw new Error('INVALID_FOOTNOTE_REFERENCE');
              }
              const id = footnotes.paste(props.owner, payload);
              return id;
            }
          : undefined,
    };
  }
  if (props.footnotesEditable && footnotes?.supports(props.owner)) {
    plugin.enableInsertion(() => {
      if (footnotes.supports(props.owner)) {
        footnotes.insert(props.owner, editor);
      }
    });
    let markerIds = richTextFootnoteIds(editor.getData()).join(',');
    editor.model.document.on('change:data', () => {
      // Plain typing cannot change references. Structural edits can insert or
      // remove whole paragraphs containing markers, so inspect those too.
      if (
        !editor.model.document.differ
          .getChanges()
          .some((change) =>
            change.type === 'attribute'
              ? change.attributeKey === 'footnoteId'
              : change.name !== '$text',
          )
      ) {
        return;
      }
      const html = editor.getData();
      const nextIds = richTextFootnoteIds(html).join(',');
      const changed = nextIds !== markerIds;
      markerIds = nextIds;
      if (
        changed &&
        !applyingModel &&
        props.contentKey !== undefined &&
        footnotes.supports(props.owner)
      ) {
        footnotes.changed(props.owner, props.contentKey, html);
      }
    });
  }

  registerEditor(editor, props.owner);
  registeredEditor = editor;
  editorIsFocused = editor.ui.focusTracker.isFocused;

  refreshBaseDirection(editor);
  editor.model.document.on('change:data', () => refreshBaseDirection(editor));

  const onFocusChanged = (
    _event: unknown,
    _name: string,
    isFocused: boolean,
  ) => {
    editorIsFocused = isFocused;

    if (!isFocused) {
      emit('blur', editor);
    }
  };

  editor.ui.focusTracker.on('change:isFocused', onFocusChanged);
  unregisterFocusTracker = () => {
    editor.ui.focusTracker.off('change:isFocused', onFocusChanged);
  };

  const onViewClick = (
    _event: unknown,
    data: ViewDocumentDomEventData<MouseEvent>,
  ) => {
    const isDoubleClick = data.domEvent.detail === 2;
    window.setTimeout(() => {
      if (registeredEditor !== editor) {
        return;
      }

      const selectedElement =
        editor.model.document.selection.getSelectedElement();

      if (isDoubleClick && selectedElement?.name === FOOTNOTE_ELEMENT) {
        footnotes?.navigate(String(selectedElement.getAttribute('footnoteId')));
      }
      if (selectedElement?.name === NEUME_ELEMENT) {
        emit('select-neume');
      }
    });
  };

  editor.editing.view.document.on('click', onViewClick);
  unregisterViewClick = () => {
    editor.editing.view.document.off('click', onViewClick);
  };

  emit('ready', editor);
}

function onDestroy(editor: InlineEditor) {
  if (registeredEditor === editor) {
    unregisterRichTextEditor();
  }
}

function unregisterRichTextEditor() {
  unregisterViewClick?.();
  unregisterViewClick = null;
  unregisterFocusTracker?.();
  unregisterFocusTracker = null;
  editorIsFocused = false;

  if (registeredEditor != null) {
    unregisterEditor(registeredEditor);
    registeredEditor = null;
  }
}

defineExpose({
  instance,
  canFlush,
});
</script>

<style scoped>
/*
 * CKEditor 5 -> chrome tokens. CKEditor exposes CSS custom properties instead
 * of a Dockview-style theme object. Its balloons/dialogs are teleported outside
 * this component to .ck-body-wrapper, so the selector is intentionally global
 * while the adapter stays colocated with the CKEditor wrapper.
 */
:global(.dark :is(.ckeditor-native-ui, .ck-body-wrapper)) {
  color-scheme: dark;

  --ck-custom-foreground: var(--chrome-ckeditor-custom-foreground);
  --ck-custom-background: var(--chrome-ckeditor-custom-background);
  --ck-custom-border: var(--chrome-ckeditor-custom-border);
  --ck-custom-white: var(--chrome-ckeditor-custom-white);

  --ck-color-base-foreground: var(--chrome-ckeditor-base-foreground);
  --ck-color-base-background: var(--chrome-ckeditor-base-background);
  --ck-color-base-border: var(--chrome-ckeditor-base-border);
  --ck-color-base-action: var(--chrome-ckeditor-base-action);
  --ck-color-base-focus: var(--chrome-ckeditor-base-focus);
  --ck-color-base-text: var(--chrome-ckeditor-base-text);
  --ck-color-base-active: var(--chrome-ckeditor-base-active);
  --ck-color-base-active-focus: var(--chrome-ckeditor-base-active-focus);
  --ck-color-base-error: var(--chrome-ckeditor-base-error);

  --ck-color-focus-border: var(--chrome-ckeditor-focus-border);
  --ck-color-focus-outer-shadow: var(--chrome-ckeditor-focus-outer-shadow);
  --ck-color-focus-disabled-shadow: var(
    --chrome-ckeditor-focus-disabled-shadow
  );
  --ck-color-focus-error-shadow: var(--chrome-ckeditor-focus-error-shadow);
  --ck-color-text: var(--chrome-ckeditor-text);
  --ck-color-shadow-drop: var(--chrome-ckeditor-shadow-drop);
  --ck-color-shadow-drop-active: var(--chrome-ckeditor-shadow-drop-active);
  --ck-color-shadow-inner: var(--chrome-ckeditor-shadow-inner);

  --ck-color-button-default-hover-background: var(
    --chrome-ckeditor-button-default-hover-background
  );
  --ck-color-button-default-active-background: var(
    --chrome-ckeditor-button-default-active-background
  );
  --ck-color-button-on-background: var(--chrome-ckeditor-button-on-background);
  --ck-color-button-on-hover-background: var(
    --chrome-ckeditor-button-on-hover-background
  );
  --ck-color-button-on-active-background: var(
    --chrome-ckeditor-button-on-active-background
  );
  --ck-color-button-on-disabled-background: var(
    --chrome-ckeditor-button-on-disabled-background
  );
  --ck-color-button-on-color: var(--chrome-ckeditor-button-on-color);
  --ck-color-button-action-background: var(
    --chrome-ckeditor-button-action-background
  );
  --ck-color-button-action-hover-background: var(
    --chrome-ckeditor-button-action-hover-background
  );
  --ck-color-button-action-active-background: var(
    --chrome-ckeditor-button-action-active-background
  );
  --ck-color-button-action-disabled-background: var(
    --chrome-ckeditor-button-action-disabled-background
  );
  --ck-color-button-action-text: var(--chrome-ckeditor-button-action-text);
  --ck-color-button-save: var(--chrome-ckeditor-button-save);
  --ck-color-button-cancel: var(--chrome-ckeditor-button-cancel);

  --ck-color-dropdown-panel-background: var(
    --chrome-ckeditor-dropdown-panel-background
  );
  --ck-color-dropdown-panel-border: var(
    --chrome-ckeditor-dropdown-panel-border
  );
  --ck-color-dialog-background: var(--chrome-ckeditor-dialog-background);
  --ck-color-dialog-form-header-border: var(
    --chrome-ckeditor-dialog-form-header-border
  );
  --ck-color-split-button-hover-background: var(
    --chrome-ckeditor-split-button-hover-background
  );
  --ck-color-split-button-hover-border: var(
    --chrome-ckeditor-split-button-hover-border
  );

  --ck-color-input-background: var(--chrome-ckeditor-input-background);
  --ck-color-input-border: var(--chrome-ckeditor-input-border);
  --ck-color-input-text: var(--chrome-ckeditor-input-text);
  --ck-color-input-disabled-background: var(
    --chrome-ckeditor-input-disabled-background
  );
  --ck-color-input-disabled-border: var(
    --chrome-ckeditor-input-disabled-border
  );
  --ck-color-input-disabled-text: var(--chrome-ckeditor-input-disabled-text);

  --ck-color-list-background: var(--chrome-ckeditor-list-background);
  --ck-color-list-button-hover-background: var(
    --chrome-ckeditor-list-button-hover-background
  );
  --ck-color-list-button-on-background: var(
    --chrome-ckeditor-list-button-on-background
  );
  --ck-color-list-button-on-background-focus: var(
    --chrome-ckeditor-list-button-on-background-focus
  );
  --ck-color-list-button-on-text: var(--chrome-ckeditor-list-button-on-text);

  --ck-color-panel-background: var(--chrome-ckeditor-panel-background);
  --ck-color-panel-border: var(--chrome-ckeditor-panel-border);
  --ck-color-toolbar-background: var(--chrome-ckeditor-toolbar-background);
  --ck-color-toolbar-border: var(--chrome-ckeditor-toolbar-border);
  --ck-color-tooltip-background: var(--chrome-ckeditor-tooltip-background);
  --ck-color-tooltip-text: var(--chrome-ckeditor-tooltip-text);

  --ck-color-labeled-field-label-background: var(
    --chrome-ckeditor-labeled-field-label-background
  );
  --ck-color-link-default: var(--chrome-ckeditor-link-default);
  --ck-color-light-red: var(--chrome-ckeditor-light-red);
  --ck-dialog-overlay-background-color: var(
    --chrome-ckeditor-dialog-overlay-background
  );
  --ck-dialog-drop-shadow: var(--chrome-ckeditor-dialog-drop-shadow);
}
</style>

<style>
.neanes-footnote {
  font: normal var(--footnote-reference-size) / 1
    var(--footnote-reference-family);
  font-variant-position: super;
  height: 1em;
  text-align: left;
  letter-spacing: normal;
  word-spacing: normal;
  display: inline-block;
  white-space: pre;
  cursor: default;
}
</style>
