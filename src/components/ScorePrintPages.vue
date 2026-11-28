<template>
  <div
    :id="styleScopeId"
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
        :page-index="pageIndex + pageOffset"
        :workspace-id="workspace.id"
        :metadata="pageMetadata[pageIndex]"
        :is-chapter-opening="pageMetadata[pageIndex].isChapterOpening"
        :measurement-boxes="measurementBoxes"
        :fonts="fonts"
        :editor-language="editorLanguage"
        :print-mode="true"
        :overlays="overlays"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  useId,
  useTemplateRef,
} from 'vue';

import ScorePageContent from '@/components/ScorePageContent.vue';
import type { ScoreOverlaySettings } from '@/models/EditorPreferences';
import type { Page } from '@/models/Page';
import type { Workspace } from '@/models/Workspace';
import { getPrintPageMetadata } from '@/services/rendering/printPageMetadata';
import {
  getResizableTextBoxes,
  type MeasuredTextBox,
  type TextBoxHeightMeasurement,
} from '@/services/rendering/textBoxMeasurement';
import { buildRichTextParagraphStyleCss } from '@/utils/richTextParagraphStyleCss';
const props = withDefaults(
  defineProps<{
    workspace: Workspace;
    pages: Page[];
    fonts: string[];
    editorLanguage: string;
    overlays: ScoreOverlaySettings;
    measureTextOnly?: boolean;
    measurementBoxes?: ReadonlySet<MeasuredTextBox>;
    renderOnly?: boolean;
    pageOffset?: number;
    metadata?: ReturnType<typeof getPrintPageMetadata>;
  }>(),
  { measurementBoxes: undefined, pageOffset: 0, metadata: undefined },
);
const emit = defineEmits<{
  ready: [];
  measured: [heights: TextBoxHeightMeasurement[]];
  failed: [error: Error];
}>();
const score = computed(() => props.workspace.score);
const styleScopeId = `score-print-${useId()}`;
const root = useTemplateRef<HTMLElement>('root');
const paragraphStyleCss = computed(() =>
  buildRichTextParagraphStyleCss(
    score.value.paragraphStyles,
    `#${styleScopeId} .ck-content`,
  ),
);
const pageStyle = computed(() => ({
  width: `${score.value.pageSetup.pageWidth}px`,
  height: `${score.value.pageSetup.pageHeight}px`,
}));
const pageMetadata = computed(
  () => props.metadata ?? getPrintPageMetadata(props.workspace, props.pages),
);
const pageContents = new Set<InstanceType<typeof ScorePageContent>>();
function collectPage(instance: unknown) {
  if (instance != null) {
    pageContents.add(instance as InstanceType<typeof ScorePageContent>);
  }
}
defineExpose({
  getPages: () => [...root.value!.querySelectorAll<HTMLElement>('.page')],
});
let disposed = false;
onBeforeUnmount(() => {
  disposed = true;
});
onMounted(async () => {
  try {
    await nextTick();
    await Promise.all([...pageContents].map((page) => page.whenReady()));
    await document.fonts.ready;
    await nextTick();
    if (!props.measureTextOnly) {
      const images = [...root.value!.querySelectorAll('img')];
      // CKEditor marks sized images as lazy. A hidden window never scrolls
      // them into view, so they would not load and decode() would not settle.
      for (const image of images) {
        image.loading = 'eager';
      }
      await Promise.all(images.map((image) => image.decode()));
    }
    if (props.renderOnly) {
      if (!disposed) {
        emit('ready');
      }
      return;
    }
    const targets =
      props.measurementBoxes ?? new Set(getResizableTextBoxes(score.value));
    const heights = await Promise.all(
      [...pageContents].map((page) => page.measureTextBoxes(targets)),
    );
    if (!disposed) {
      emit('measured', heights.flat());
    }
  } catch (error) {
    if (disposed) {
      return;
    }
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
