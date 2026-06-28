<template>
  <span ref="root" class="rich-text-toolbar-item ckeditor-native-ui"></span>
</template>

<script setup lang="ts">
import type { View } from 'ckeditor5';
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue';

import { useActiveOrLastEditorForOwner } from '@/composables/useRichTextEditorRegistry';

const props = defineProps<{
  name: string;
  owner: object;
}>();

const root = useTemplateRef<HTMLElement>('root');
const scopedEditor = useActiveOrLastEditorForOwner(() => props.owner);

let ckeditorView: View | null = null;

onMounted(renderView);
onBeforeUnmount(destroyView);

watch(scopedEditor, renderView, { flush: 'post' });
watch(() => props.name, renderView, { flush: 'post' });

function renderView() {
  destroyView();

  const editor = scopedEditor.value;
  const element = root.value;

  if (editor == null || element == null) {
    return;
  }

  const componentFactory = editor.ui.componentFactory;

  if (!componentFactory.has(props.name)) {
    return;
  }

  const view = componentFactory.create(props.name);

  view.render();
  element.appendChild(view.element!);
  ckeditorView = view;
}

function destroyView() {
  if (ckeditorView == null) {
    return;
  }

  ckeditorView.element!.remove();
  ckeditorView.destroy();
  ckeditorView = null;
}
</script>

<style scoped>
.rich-text-toolbar-item {
  display: inline-flex;
  align-items: center;
}
</style>
