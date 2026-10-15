<template>
  <div
    class="workspace-text-box-measurement"
    :style="{ '--zoom': 1, '--zoom-residue': 1 }"
    inert
    aria-hidden="true"
  >
    <component :is="'style'">{{ paragraphStyleCss }}</component>
    <template v-for="(element, index) in elements" :key="index">
      <TextBoxRich
        v-if="element.elementType === ElementType.RichTextBox"
        :ref="(instance) => setMeasurer(element, instance)"
        :element="element as RichTextBoxElement"
        :page-setup="workspace.score.pageSetup"
        :paragraph-styles="workspace.score.paragraphStyles"
        :fonts="fonts"
        :editor-language="editorLanguage"
        :edit-mode="false"
        :recalc="true"
      />
      <TextBox
        v-else
        :ref="(instance) => setMeasurer(element, instance)"
        :element="element as TextBoxElement"
        :page-setup="workspace.score.pageSetup"
        :edit-mode="false"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted } from 'vue';

import {
  ElementType,
  type RichTextBoxElement,
  type TextBoxElement,
} from '@/models/Element';
import type { Workspace } from '@/models/Workspace';
import {
  getResizableTextBoxes,
  type MeasuredTextBox,
  type TextBoxHeightMeasurement,
} from '@/services/documents/textBoxMeasurement';
import { buildRichTextParagraphStyleCss } from '@/utils/richTextParagraphStyleCss';

import TextBox from './TextBox.vue';
import TextBoxRich from './TextBoxRich.vue';

const props = defineProps<{
  workspace: Workspace;
  fonts: string[];
  editorLanguage: string;
}>();
const emit = defineEmits<{
  complete: [heights: TextBoxHeightMeasurement[]];
  failed: [error: Error];
}>();
const elements = getResizableTextBoxes(props.workspace.score);
const paragraphStyleCss = computed(() =>
  buildRichTextParagraphStyleCss(
    props.workspace.score.paragraphStyles,
    '.workspace-text-box-measurement .ck-content',
  ),
);
const measurers = new Map<
  MeasuredTextBox,
  { measureHeight(): Promise<number> }
>();
let disposed = false;
const timer = setTimeout(() => {
  if (!disposed) {
    emit('failed', new Error('TEXT_BOX_MEASUREMENT_FAILED'));
  }
}, 30_000);

function setMeasurer(element: MeasuredTextBox, instance: unknown) {
  if (instance == null) {
    measurers.delete(element);
  } else {
    measurers.set(element, instance as { measureHeight(): Promise<number> });
  }
}

onMounted(async () => {
  try {
    await nextTick();
    if (measurers.size !== elements.length) {
      throw new Error('TEXT_BOX_MEASUREMENT_FAILED');
    }
    const heights = await Promise.all(
      elements.map(async (element) => ({
        element,
        height: await measurers.get(element)!.measureHeight(),
      })),
    );
    if (!disposed) {
      clearTimeout(timer);
      emit('complete', heights);
    }
  } catch (error) {
    if (!disposed) {
      clearTimeout(timer);
      emit(
        'failed',
        error instanceof Error
          ? error
          : new Error('TEXT_BOX_MEASUREMENT_FAILED'),
      );
    }
  }
});
onBeforeUnmount(() => {
  disposed = true;
  clearTimeout(timer);
});
</script>

<style scoped>
.workspace-text-box-measurement {
  position: absolute;
  left: -99999999px;
  top: 0;
  visibility: hidden;
}
</style>
