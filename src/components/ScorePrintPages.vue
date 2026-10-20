<template>
  <div
    ref="root"
    class="score-print-pages foreground-workspace"
    :style="{ '--zoom': 1, '--zoom-residue': 0 }"
    inert
  >
    <component :is="'style'">{{ paragraphStyleCss }}</component>
    <div
      v-for="(page, pageIndex) in pages"
      :key="`page-${pageIndex}`"
      class="page print"
      :style="pageStyle"
    >
      <ScorePageContent
        :ref="collectPage"
        :score="workspace.score"
        :page="page"
        :page-index="pageIndex"
        :workspace-id="workspace.id"
        :metadata="getTokenMetadata(pageIndex)"
        :is-chapter-opening="runningMarkers[pageIndex].isChapterOpening"
        :fonts="fonts"
        :editor-language="editorLanguage"
        :print-mode="true"
        :overlays="overlays"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, useTemplateRef } from 'vue';

import ScorePageContent from '@/components/ScorePageContent.vue';
import type { ScoreOverlaySettings } from '@/models/EditorPreferences';
import type { Page } from '@/models/Page';
import type { Workspace } from '@/models/Workspace';
import type { TextBoxHeightMeasurement } from '@/services/rendering/textBoxMeasurement';
import { getFileNameFromPath } from '@/utils/getFileNameFromPath';
import { getDisplayedPageNumber } from '@/utils/PageNumbering';
import type { TokenMetadata } from '@/utils/replaceTokens';
import { buildRichTextParagraphStyleCss } from '@/utils/richTextParagraphStyleCss';
import { resolveRunningMarkerPageMetadata } from '@/utils/runningMarkers';
const props = defineProps<{
  workspace: Workspace;
  pages: Page[];
  fonts: string[];
  editorLanguage: string;
  overlays: ScoreOverlaySettings;
}>();
const emit = defineEmits<{
  measured: [heights: TextBoxHeightMeasurement[]];
  failed: [error: Error];
}>();
const score = computed(() => props.workspace.score);
const root = useTemplateRef<HTMLElement>('root');
const paragraphStyleCss = computed(() =>
  buildRichTextParagraphStyleCss(
    score.value.paragraphStyles,
    '.score-print-pages .ck-content',
  ),
);
const pageStyle = computed(() => ({
  width: `${score.value.pageSetup.pageWidth}px`,
  height: `${score.value.pageSetup.pageHeight}px`,
}));
const runningMarkers = computed(() =>
  resolveRunningMarkerPageMetadata(props.pages),
);
const pageContents = new Set<InstanceType<typeof ScorePageContent>>();
function collectPage(instance: unknown) {
  if (instance != null) {
    pageContents.add(instance as InstanceType<typeof ScorePageContent>);
  }
}
function getTokenMetadata(index: number): TokenMetadata {
  return {
    pageNumber: getDisplayedPageNumber(
      score.value.pageSetup,
      props.pages[index].physicalPageNumber,
    ),
    numberOfPages: getDisplayedPageNumber(
      score.value.pageSetup,
      props.pages[props.pages.length - 1].physicalPageNumber,
    ),
    numerals: score.value.pageSetup.numerals,
    fileName:
      props.workspace.filePath == null
        ? props.workspace.tempFileName
        : getFileNameFromPath(props.workspace.filePath),
    filePath: props.workspace.filePath ?? '',
    ...score.value.documentProperties,
    chapter: runningMarkers.value[index].chapter,
    section: runningMarkers.value[index].section,
  };
}
defineExpose({
  getPages: () => [...root.value!.querySelectorAll<HTMLElement>('.page')],
});
onMounted(async () => {
  try {
    await nextTick();
    await Promise.all([...pageContents].map((page) => page.whenReady()));
    await document.fonts.ready;
    await nextTick();
    await Promise.all(
      [...root.value!.querySelectorAll('img')].map((image) => image.decode()),
    );
    const heights = await Promise.all(
      [...pageContents].map((page) => page.measureTextBoxes()),
    );
    emit('measured', heights.flat());
  } catch (error) {
    emit(
      'failed',
      error instanceof Error ? error : new Error('EXPORT_RENDER_FAILED'),
    );
  }
});
</script>
<style scoped>
.page {
  position: relative;
  color: black;
  background: white;
  overflow: clip;
  break-after: page;
  print-color-adjust: exact;
}
.page:last-child {
  break-after: auto;
}
@media print {
  .score-print-pages,
  .score-print-pages :deep(*) {
    visibility: visible;
  }
}
</style>
