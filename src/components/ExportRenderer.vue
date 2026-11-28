<template>
  <ScorePrintPages
    v-if="pdfBatch"
    :key="pdfBatch.offset"
    ref="pdfPrintPages"
    :workspace="workspace"
    :pages="pdfBatch.pages"
    :fonts="fonts"
    :editor-language="snapshot.editorLanguage"
    :overlays="snapshot.overlays"
    :page-offset="pdfBatch.offset"
    :metadata="pdfBatch.metadata"
    render-only
    @ready="printPdfBatch"
    @failed="failed"
  />
  <SettledScorePages
    v-else
    ref="settledPages"
    :workspace="workspace"
    :fonts="fonts"
    :editor-language="snapshot.editorLanguage"
    :overlays="snapshot.overlays"
    :measurement-boxes="pdfMeasurementBoxes"
    @ready="complete"
    @failed="failed"
  />
</template>
<script setup lang="ts">
import { getFontEmbedCSS, toPng } from 'html-to-image';
import { shallowRef, useTemplateRef } from 'vue';

import ScorePrintPages from '@/components/ScorePrintPages.vue';
import SettledScorePages from '@/components/SettledScorePages.vue';
import { IpcRendererChannels } from '@/ipc/ipcChannels';
import type { Page } from '@/models/Page';
import { Workspace } from '@/models/Workspace';
import { fontCatalog } from '@/services/FontCatalog';
import {
  collectPdfElementLinkTargets,
  preparePdfElementLinks,
} from '@/services/rendering/pdfElementLinks';
import { getPrintPageMetadata } from '@/services/rendering/printPageMetadata';
import type {
  PdfRenderOptions,
  PngRenderOptions,
  ScoreRenderSnapshot,
} from '@/services/rendering/scoreRenderSnapshot';
import { getResizableTextBoxes } from '@/services/rendering/textBoxMeasurement';
import { SaveService } from '@/services/SaveService';

const props = defineProps<{
  snapshot: ScoreRenderSnapshot;
  png?: PngRenderOptions;
  pdf?: PdfRenderOptions;
}>();
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
const settledPages =
  useTemplateRef<InstanceType<typeof SettledScorePages>>('settledPages');
const pdfPrintPages =
  useTemplateRef<InstanceType<typeof ScorePrintPages>>('pdfPrintPages');
const pdfLinkTargets = props.pdf
  ? collectPdfElementLinkTargets(props.snapshot.score)
  : [];
// PDF settlement mounts only the text boxes it measures; pages render in batches.
const pdfMeasurementBoxes = props.pdf
  ? new Set(getResizableTextBoxes(workspace.score))
  : undefined;
let pdfPages: Page[] = [];
let pdfPageMetadata: ReturnType<typeof getPrintPageMetadata> = [];
const pdfBatch = shallowRef<{
  offset: number;
  pages: Page[];
  metadata: ReturnType<typeof getPrintPageMetadata>;
}>();

function showPdfBatch(offset: number) {
  const end = offset + props.pdf!.batchSize;
  pdfBatch.value = {
    offset,
    pages: pdfPages.slice(offset, end),
    metadata: pdfPageMetadata.slice(offset, end),
  };
}

async function printPdfBatch() {
  try {
    const batch = pdfBatch.value!;
    preparePdfElementLinks(
      pdfPrintPages.value!.getPages(),
      pdfLinkTargets,
      props.pdf!.elementLinkBaseUrl,
    );
    await window.ipcRenderer.invoke(IpcRendererChannels.ExportRendererPdfBatch);
    const nextOffset = batch.offset + batch.pages.length;
    if (nextOffset < pdfPages.length) {
      showPdfBatch(nextOffset);
    } else {
      ready(pdfPages.length);
    }
  } catch (error) {
    failed(error instanceof Error ? error : new Error(String(error)));
  }
}

async function complete(pages: Page[]) {
  if (props.pdf) {
    pdfPages = pages;
    pdfPageMetadata = getPrintPageMetadata(workspace, pages);
    showPdfBatch(0);
    return;
  }
  if (props.png) {
    try {
      const selected = settledPages
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
              pixelRatio:
                props.png.maxEdge === undefined
                  ? props.png.dpi / 96
                  : Math.min(
                      props.png.dpi / 96,
                      props.png.maxEdge /
                        Math.max(page.scrollWidth, page.scrollHeight),
                    ),
              skipAutoScale: props.png.maxEdge !== undefined,
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
  ready(pages.length);
}

function ready(pageCount: number) {
  if (!finished) {
    finished = true;
    window.ipcRenderer.send(IpcRendererChannels.ExportRendererResult, {
      success: true,
      pageCount,
    });
  }
}
</script>
