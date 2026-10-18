<template>
  <WorkspaceTextBoxMeasurement
    v-if="measurement"
    :key="measurement.id"
    :workspace="measurement.workspace"
    :fonts="fonts"
    :editor-language="language"
    @complete="measured"
    @failed="failed"
  />
  <WorkspacePageMeasurement
    v-if="pageMeasurement"
    :workspace="pageMeasurement.workspace"
    :fonts="fonts"
    :editor-language="language"
    @ready="pagesReady"
    @failed="pagesFailed"
  />
</template>
<script setup lang="ts">
import { nextTick, onMounted, shallowRef } from 'vue';

import { useEditorAutomation } from '@/automation/renderer/useEditorAutomation';
import WorkspacePageMeasurement from '@/components/WorkspacePageMeasurement.vue';
import WorkspaceTextBoxMeasurement from '@/components/WorkspaceTextBoxMeasurement.vue';
import { EditorPreferences } from '@/models/EditorPreferences';
import type { Page } from '@/models/Page';
import { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { DocumentService } from '@/services/documents/DocumentService';
import {
  getBundledFontLoadDescriptors,
  getFontFamilyLoadDescriptors,
  getScoreFontLoadDescriptors,
} from '@/services/documents/fontReadiness';
import type { TextBoxHeightMeasurement } from '@/services/documents/textBoxMeasurement';
import { fontCatalog } from '@/services/FontCatalog';
import { LayoutService } from '@/services/LayoutService';
import { LyricService } from '@/services/LyricService';
import { SaveService } from '@/services/SaveService';

const language = 'en';
const fonts = shallowRef<string[]>([]);
const overlays = new EditorPreferences();
const lyrics = new LyricService();
let sequence = 0;
const measurement = shallowRef<{
  id: number;
  workspace: Workspace;
  resolve(): void;
  reject(error: Error): void;
} | null>(null);
const pageMeasurement = shallowRef<{
  workspace: Workspace;
  resolve(pages: Page[]): void;
  reject(error: Error): void;
} | null>(null);
function prepare(workspace: Workspace) {
  if (!workspace.score.staff.lyrics.locked) {
    workspace.score.staff.lyrics.text = lyrics.extractLyrics(
      workspace.score.staff.elements,
      workspace.score.pageSetup.disableGreekMelismata,
    );
  }
}
async function settle(workspace: Workspace) {
  await Promise.all(
    getScoreFontLoadDescriptors(
      SaveService.SaveScoreToJson(workspace.score),
    ).map((d) => document.fonts.load(d)),
  );
  LayoutService.processPages(workspace);
  await new Promise<void>((resolve, reject) => {
    measurement.value = { id: ++sequence, workspace, resolve, reject };
  });
  await nextTick();
  LayoutService.processPages(workspace);
}
function measured(heights: TextBoxHeightMeasurement[]) {
  for (const { element, height } of heights) {
    element.height = height;
  }
  const request = measurement.value!;
  measurement.value = null;
  request.resolve();
}
function failed(error: Error) {
  const request = measurement.value!;
  measurement.value = null;
  request.reject(error);
}
function pagesReady(pages: Page[]) {
  const request = pageMeasurement.value!;
  pageMeasurement.value = null;
  request.resolve(pages);
}
function pagesFailed(error: Error) {
  const request = pageMeasurement.value!;
  pageMeasurement.value = null;
  request.reject(error);
}
// Headless document requests must address an explicitly owned session.
const documents = new DocumentService({
  workspaces: () => [],
  selectedWorkspace: () => null,
  createScore: () => new Score(),
  addWorkspace() {
    throw new Error('SESSION_REQUIRED');
  },
  selectWorkspace() {},
  prepare,
  changed() {},
  elementsChanged() {},
  changeStyles(_workspace, operation) {
    operation();
  },
  async ensureFonts(families) {
    await Promise.all(
      getFontFamilyLoadDescriptors(families).map((d) => document.fonts.load(d)),
    );
  },
  settle,
  fonts: () => fonts.value,
  async saved() {},
  async close() {
    return false;
  },
});
const automation = useEditorAutomation({
  enabled: true,
  requireSessions: true,
  documents,
  busyState: () => null,
  createScore: () => new Score(),
  prepare,
  dispose() {},
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
  renderPages: (workspace) =>
    new Promise<Page[]>((resolve, reject) => {
      pageMeasurement.value = { workspace, resolve, reject };
    }),
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
