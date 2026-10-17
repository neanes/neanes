<template>
  <div class="workspace-page-measurement" inert aria-hidden="true">
    <SettledScorePages
      :workspace="workspace"
      :fonts="fonts"
      :editor-language="editorLanguage"
      :overlays="overlays"
      @ready="ready"
      @failed="failed"
    />
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onErrorCaptured } from 'vue';

import SettledScorePages from '@/components/SettledScorePages.vue';
import { EditorPreferences } from '@/models/EditorPreferences';
import type { Page } from '@/models/Page';
import type { Workspace } from '@/models/Workspace';

// The supplied workspace is a detached copy, never an editor tab or session draft.
defineProps<{
  workspace: Workspace;
  fonts: string[];
  editorLanguage: string;
}>();
const emit = defineEmits<{ ready: [pages: Page[]]; failed: [error: Error] }>();
const overlays = new EditorPreferences();
let finished = false;
const timer = setTimeout(
  () => failed(new Error('Layout measurement timed out.')),
  45_000,
);
function failed(error: Error) {
  if (!finished) {
    finished = true;
    clearTimeout(timer);
    emit('failed', error);
  }
}
function ready(pages: Page[]) {
  if (!finished) {
    finished = true;
    clearTimeout(timer);
    emit('ready', pages);
  }
}
onErrorCaptured((error) => {
  failed(error);
  return false;
});
onBeforeUnmount(() => {
  clearTimeout(timer);
  if (!finished) {
    failed(new Error('Layout measurement was disposed.'));
  }
});
</script>
<style scoped>
.workspace-page-measurement {
  position: absolute;
  left: -99999999px;
  top: 0;
  visibility: hidden;
}
</style>
