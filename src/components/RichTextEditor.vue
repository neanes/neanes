<template>
  <Ckeditor
    ref="editorRef"
    v-bind="$attrs"
    :editor="InlineEditor"
    :model-value="initialData"
    :config="config"
    :disable-watchdog="true"
    :disable-two-way-data-binding="true"
    @ready="onReady"
    @destroy="onDestroy"
  />
</template>

<script setup lang="ts">
import { Ckeditor } from '@ckeditor/ckeditor5-vue';
import type { EditorConfig } from 'ckeditor5';
import { computed, onBeforeUnmount, useTemplateRef, watch } from 'vue';
import type { ComponentExposed } from 'vue-component-type-helpers';

import { NEUME_ELEMENT } from '@/ckeditor-plugins/insertneume/insertneumeediting';
import {
  registerEditor,
  unregisterEditor,
} from '@/composables/useRichTextEditorRegistry';
import InlineEditor from '@/customEditor';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  config: EditorConfig;
  modelValue: string;
  owner: object;
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

// We own content syncing into the editor instead of leaning on
// @ckeditor/ckeditor5-vue's internal `lastEditorData` dedupe. The wrapper above
// receives a frozen `initialData` snapshot for `:model-value`, so its own model->editor
// watcher only seeds the editor at creation. Separately, `disable-two-way-data-binding`
// suppresses the wrapper's editor->model emit. The parent re-pushes content into
// `modelValue` after a flush; a byte-identical round-trip would still call
// `editor.data.set()` -- which resets the model selection to the document start,
// collapsing the user's selection mid-edit. So push to the editor only when the
// incoming content differs from what it already holds. Comparing against the live
// `getData()` (always current, unlike the library's ~300 ms-debounced key) means an
// echo never slips through, while any genuine change -- undo, file load, element
// switch, even one that restores a value the editor held earlier -- is always applied,
// because we call `data.set` directly rather than through a mirror whose own value
// could mask the update. Watching `instance` too applies a change that arrived before
// the editor finished creating.
const initialData = props.modelValue;

watch([() => props.modelValue, instance], ([next, editor]) => {
  if (editor != null && next !== editor.getData()) {
    editor.data.set(next);
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

function onReady(editor: InlineEditor) {
  registerEditor(editor, props.owner);
  registeredEditor = editor;
  editorIsFocused = editor.ui.focusTracker.isFocused;

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

  const onViewClick = () => {
    window.setTimeout(() => {
      if (registeredEditor !== editor) {
        return;
      }

      const selectedElement =
        editor.model.document.selection.getSelectedElement();

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
});
</script>
