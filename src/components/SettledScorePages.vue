<template>
  <ScorePrintPages
    v-if="pages"
    :key="renderPass"
    ref="printPages"
    :workspace="workspace"
    :pages="pages"
    :fonts="fonts"
    :editor-language="editorLanguage"
    :overlays="overlays"
    @measured="measured"
    @failed="failed"
  />
</template>
<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
} from 'vue';

import ScorePrintPages from '@/components/ScorePrintPages.vue';
import type { ScoreOverlaySettings } from '@/models/EditorPreferences';
import type { Page } from '@/models/Page';
import type { Workspace } from '@/models/Workspace';
import { LayoutService } from '@/services/LayoutService';
import {
  getBundledFontLoadDescriptors,
  getScoreFontLoadDescriptors,
} from '@/services/rendering/fontReadiness';
import { LayoutReconciliation } from '@/services/rendering/layoutReconciliation';
import type { TextBoxHeightMeasurement } from '@/services/rendering/textBoxMeasurement';
import { SaveService } from '@/services/SaveService';

const props = defineProps<{
  workspace: Workspace;
  fonts: string[];
  editorLanguage: string;
  overlays: ScoreOverlaySettings;
}>();
const emit = defineEmits<{ ready: [pages: Page[]]; failed: [error: Error] }>();
const pages = shallowRef<Page[] | null>(null);
const renderPass = ref(0);
const reconciliation = new LayoutReconciliation();
const printPages =
  useTemplateRef<InstanceType<typeof ScorePrintPages>>('printPages');
let stopped = false;
onBeforeUnmount(() => {
  stopped = true;
});
function failed(error: Error) {
  if (!stopped) {
    stopped = true;
    emit('failed', error);
  }
}
function processPages() {
  return LayoutService.processPages(props.workspace, {
    collectDiagnostics: props.overlays.showDeveloperPanels,
  }).filter((page) => !page.isEmpty);
}
function measured(heights: TextBoxHeightMeasurement[]) {
  if (stopped) {
    return;
  }
  try {
    if (reconciliation.apply(props.workspace.score, heights)) {
      renderPass.value++;
      pages.value = processPages();
    } else {
      stopped = true;
      emit('ready', pages.value!);
    }
  } catch (error) {
    failed(error instanceof Error ? error : new Error(String(error)));
  }
}
onMounted(async () => {
  try {
    await Promise.all(
      [
        ...getBundledFontLoadDescriptors(),
        ...getScoreFontLoadDescriptors(
          SaveService.SaveScoreToJson(props.workspace.score),
        ),
      ].map((descriptor) => document.fonts.load(descriptor)),
    );
    await document.fonts.ready;
    if (!stopped) {
      pages.value = processPages();
    }
  } catch (error) {
    failed(error instanceof Error ? error : new Error(String(error)));
  }
});
defineExpose({ getPages: () => printPages.value!.getPages() });
</script>
