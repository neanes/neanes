<template>
  <WorkspaceTextBoxMeasurement
    v-if="measurement"
    :key="measurement.id"
    :workspace="measurement.workspace"
    :fonts="fonts"
    :editor-language="language"
    @complete="textBoxes.complete"
    @failed="textBoxes.fail"
  />
  <WorkspacePageMeasurement
    v-if="pageMeasurement"
    :workspace="pageMeasurement.workspace"
    :fonts="fonts"
    :editor-language="language"
    @ready="pages.complete"
    @failed="pages.fail"
  />
</template>
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';

import WorkspacePageMeasurement from '@/automation/components/WorkspacePageMeasurement.vue';
import WorkspaceTextBoxMeasurement from '@/automation/components/WorkspaceTextBoxMeasurement.vue';
import { useEditorAutomation } from '@/automation/renderer/useEditorAutomation';
import { useWorkspaceMeasurements } from '@/automation/renderer/useWorkspaceMeasurements';
import { WorkerSettlement } from '@/automation/renderer/workerSettlement';
import { PrivateDocumentStore } from '@/automation/sessions/privateDocumentStore';
import { EditorPreferences } from '@/models/EditorPreferences';
import { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { fontCatalog } from '@/services/FontCatalog';
import { LayoutService } from '@/services/LayoutService';
import { LyricService } from '@/services/LyricService';
import {
  getBundledFontLoadDescriptors,
  getFontFamilyLoadDescriptors,
  getScoreFontLoadDescriptors,
} from '@/services/rendering/fontReadiness';
import { SaveService } from '@/services/SaveService';

const language = 'en';
const fonts = shallowRef<string[]>([]);
const overlays = new EditorPreferences();
const lyrics = new LyricService();
const settlements = new WorkerSettlement();
// Language and measurement CSS are fixed for this worker's lifetime. Font
// availability can change even without content edits (including a late load).
const invalidateSettlement = () => settlements.invalidate();
watch(fonts, invalidateSettlement, { flush: 'sync' });
document.fonts.addEventListener('loading', invalidateSettlement);
document.fonts.addEventListener('loadingdone', invalidateSettlement);
document.fonts.addEventListener('loadingerror', invalidateSettlement);
onBeforeUnmount(() => {
  document.fonts.removeEventListener('loading', invalidateSettlement);
  document.fonts.removeEventListener('loadingdone', invalidateSettlement);
  document.fonts.removeEventListener('loadingerror', invalidateSettlement);
  settlements.invalidate();
});
const { textBoxes, pages } = useWorkspaceMeasurements();
const measurement = textBoxes.pending;
const pageMeasurement = pages.pending;
function prepare(workspace: Workspace) {
  if (!workspace.score.staff.lyrics.locked) {
    workspace.score.staff.lyrics.text = lyrics.extractLyrics(
      workspace.score.staff.elements,
      workspace.score.pageSetup.disableGreekMelismata,
    );
  }
}
async function settle(workspace: Workspace) {
  if (document.fonts.status === 'loaded' && settlements.has(workspace)) {
    return;
  }
  const complete = settlements.begin(workspace);
  await Promise.all(
    getScoreFontLoadDescriptors(
      SaveService.SaveScoreToJson(workspace.score),
    ).map((d) => document.fonts.load(d)),
  );
  LayoutService.processPages(workspace);
  await textBoxes.start(workspace);
  await nextTick();
  LayoutService.processPages(workspace);
  complete();
}
// One private store lives until the worker shuts down or access is revoked.
const privateStore = new PrivateDocumentStore({
  createScore: () => new Score(),
  prepare,
  dispose: (workspace) => settlements.dispose(workspace),
  fonts: () => fonts.value,
  async ensureFonts(families) {
    await Promise.all(
      getFontFamilyLoadDescriptors(families).map((d) => document.fonts.load(d)),
    );
  },
  settle,
});
const automation = useEditorAutomation({
  enabled: true,
  documents: privateStore.documents,
  privateStore,
  busyState: () => null,
  createScore: () => new Score(),
  prepare,
  dispose: (workspace) => settlements.dispose(workspace),
  settle,
  snapshot: (workspace) => ({
    score: SaveService.SaveScoreToJson(workspace.score),
    filePath: workspace.filePath,
    fileName: workspace.tempFileName,
    title: workspace.score.documentProperties.title,
    editorLanguage: language,
    systemFonts: fontCatalog.snapshotSystemFonts(),
    overlays,
  }),
  renderPages: pages.start,
});
onMounted(async () => {
  await fontCatalog.init();
  fonts.value = [
    ...fontCatalog.bundledFamilies(),
    ...fontCatalog.systemFamilies(),
  ];
  await Promise.all(
    getBundledFontLoadDescriptors().map((d) => document.fonts.load(d)),
  );
  await document.fonts.ready;
  automation.ready();
});
</script>
