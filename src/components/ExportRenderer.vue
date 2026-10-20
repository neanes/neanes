<template>
  <SettledScorePages
    :workspace="workspace"
    :fonts="fonts"
    :editor-language="snapshot.editorLanguage"
    :overlays="snapshot.overlays"
    @ready="complete"
    @failed="failed"
  />
</template>
<script setup lang="ts">
import SettledScorePages from '@/components/SettledScorePages.vue';
import { IpcRendererChannels } from '@/ipc/ipcChannels';
import { Workspace } from '@/models/Workspace';
import { fontCatalog } from '@/services/FontCatalog';
import type { ScoreRenderSnapshot } from '@/services/rendering/scoreRenderSnapshot';
import { SaveService } from '@/services/SaveService';

const props = defineProps<{ snapshot: ScoreRenderSnapshot }>();
const workspace = new Workspace();
fontCatalog.restoreSystemFonts(props.snapshot.systemFonts);
workspace.score = SaveService.LoadScoreFromJson(props.snapshot.score);
workspace.filePath = props.snapshot.filePath;
workspace.tempFileName = props.snapshot.fileName;
document.title = props.snapshot.title;
const fonts = [
  ...fontCatalog.bundledFamilies(),
  ...fontCatalog.systemFamilies(),
];
let finished = false;
function failed(error: Error) {
  if (!finished) {
    finished = true;
    window.ipcRenderer.send(IpcRendererChannels.ExportRendererResult, {
      success: false,
      message: error.message,
    });
  }
}
function complete() {
  if (!finished) {
    finished = true;
    window.ipcRenderer.send(IpcRendererChannels.ExportRendererResult, {
      success: true,
    });
  }
}
</script>
