<template>
  <SettledScorePages
    ref="settledPages"
    :workspace="workspace"
    :fonts="fonts"
    :editor-language="snapshot.editorLanguage"
    :overlays="snapshot.overlays"
    @ready="complete"
    @failed="failed"
  />
</template>
<script setup lang="ts">
import { getFontEmbedCSS, toPng } from 'html-to-image';
import { useTemplateRef } from 'vue';

import SettledScorePages from '@/components/SettledScorePages.vue';
import { IpcRendererChannels } from '@/ipc/ipcChannels';
import { Workspace } from '@/models/Workspace';
import { fontCatalog } from '@/services/FontCatalog';
import type {
  PngRenderOptions,
  ScoreRenderSnapshot,
} from '@/services/rendering/scoreRenderSnapshot';
import { SaveService } from '@/services/SaveService';

const props = defineProps<{
  snapshot: ScoreRenderSnapshot;
  png?: PngRenderOptions;
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
async function complete() {
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
</script>
