<template>
  <ScorePrintPages
    v-if="pages"
    :key="renderPass"
    ref="printPages"
    :workspace="workspace"
    :pages="pages"
    :fonts="fonts"
    :editor-language="snapshot.editorLanguage"
    :overlays="snapshot.overlays"
    @measured="measured"
    @failed="failed"
  />
</template>
<script setup lang="ts">
import { getFontEmbedCSS, toPng } from 'html-to-image';
import { onMounted, ref, shallowRef, useTemplateRef } from 'vue';

import ScorePrintPages from '@/components/ScorePrintPages.vue';
import { IpcRendererChannels } from '@/ipc/ipcChannels';
import type { Page } from '@/models/Page';
import { Workspace } from '@/models/Workspace';
import {
  getBundledFontLoadDescriptors,
  getScoreFontLoadDescriptors,
} from '@/services/documents/fontReadiness';
import type {
  PngRenderOptions,
  ScoreRenderSnapshot,
} from '@/services/documents/scoreRenderSnapshot';
import type { TextBoxHeightMeasurement } from '@/services/documents/textBoxMeasurement';
import { fontCatalog } from '@/services/FontCatalog';
import { LayoutService } from '@/services/LayoutService';
import { SaveService } from '@/services/SaveService';

const props = defineProps<{
  snapshot: ScoreRenderSnapshot;
  png?: PngRenderOptions;
}>();
const workspace = new Workspace();
const fonts = ref<string[]>([]);
const renderPass = ref(0);
const pages = shallowRef<Page[] | null>(null);
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
const printPages =
  useTemplateRef<InstanceType<typeof ScorePrintPages>>('printPages');
async function complete() {
  if (props.png) {
    try {
      const selected = printPages
        .value!.getPages()
        .map((page, index) => ({ page, pageNumber: index + 1 }))
        .filter(
          ({ pageNumber }) =>
            props.png!.pageNumbers == null ||
            props.png!.pageNumbers.includes(pageNumber),
        );
      if (selected.length) {
        const fontEmbedCSS =
          (await getFontEmbedCSS(selected[0].page)) +
          fontCatalog.getExportFontFeatureValuesCss();
        for (const { page, pageNumber } of selected) {
          const data = (
            await toPng(page, {
              fontEmbedCSS,
              pixelRatio: props.png.dpi / 96,
              style: {
                margin: '0',
                ...(props.png.transparentBackground
                  ? { backgroundColor: 'transparent' }
                  : {}),
              },
            })
          ).replace(/^data:image\/png;base64,/, '');
          if (
            !(await window.ipcRenderer.invoke(
              IpcRendererChannels.ExportRendererImage,
              pageNumber,
              data,
            ))
          ) {
            break;
          }
        }
      }
    } catch (error) {
      failed(error instanceof Error ? error : new Error(String(error)));
      return;
    }
  }
  if (!finished) {
    finished = true;
    window.ipcRenderer.send(IpcRendererChannels.ExportRendererResult, {
      success: true,
    });
  }
}
// Header/footer templates can appear on several pages with different tokens.
// Keep their largest observed height throughout reconciliation to avoid cycles
// when a chapter moves to a different page as its header grows.
const headerFooterHeights = new Map<
  TextBoxHeightMeasurement['element'],
  number
>();
function measured(heights: TextBoxHeightMeasurement[]) {
  try {
    const headerFooters = new Set(
      [
        ...Object.values(workspace.score.headers),
        ...Object.values(workspace.score.footers),
      ].flatMap((container) => container.elements),
    );
    const measuredHeights = new Map<
      TextBoxHeightMeasurement['element'],
      number
    >();
    for (const { element, height } of heights) {
      measuredHeights.set(
        element,
        Math.max(measuredHeights.get(element) ?? 0, height),
      );
    }
    let changed = false;
    for (const [element, measuredHeight] of measuredHeights) {
      const height = headerFooters.has(element)
        ? Math.max(headerFooterHeights.get(element) ?? 0, measuredHeight)
        : measuredHeight;
      if (headerFooters.has(element)) {
        headerFooterHeights.set(element, height);
      }
      if (Math.abs(element.height - height) > 0.01) {
        element.height = height;
        changed = true;
      }
    }
    if (!changed) {
      void complete();
      return;
    }
    if (++renderPass.value >= 12) {
      throw new Error('EXPORT_LAYOUT_DID_NOT_SETTLE');
    }
    pages.value = LayoutService.processPages(workspace, {
      collectDiagnostics: props.snapshot.overlays.showDeveloperPanels,
    }).filter((page) => !page.isEmpty);
  } catch (error) {
    failed(error instanceof Error ? error : new Error('EXPORT_RENDER_FAILED'));
  }
}
onMounted(async () => {
  try {
    document.title = props.snapshot.title;
    fontCatalog.restoreSystemFonts(props.snapshot.systemFonts);
    workspace.score = SaveService.LoadScoreFromJson(props.snapshot.score);
    workspace.filePath = props.snapshot.filePath;
    workspace.tempFileName = props.snapshot.fileName;
    fonts.value = [
      ...fontCatalog.bundledFamilies(),
      ...fontCatalog.systemFamilies(),
    ];
    await Promise.all(
      [
        ...getBundledFontLoadDescriptors(),
        ...getScoreFontLoadDescriptors(props.snapshot.score),
      ].map((descriptor) => document.fonts.load(descriptor)),
    );
    await document.fonts.ready;
    pages.value = LayoutService.processPages(workspace, {
      collectDiagnostics: props.snapshot.overlays.showDeveloperPanels,
    }).filter((page) => !page.isEmpty);
  } catch (error) {
    failed(error instanceof Error ? error : new Error('EXPORT_RENDER_FAILED'));
  }
});
</script>
