<template>
  <div
    :id="styleScopeId"
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
        :footnote-body="footnoteBodyElements.has(element)"
        :footnote-markers="(element as RichTextBoxElement).footnoteMarkers"
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
import { computed, nextTick, onBeforeUnmount, onMounted, useId } from 'vue';

import TextBox from '@/components/TextBox.vue';
import TextBoxRich from '@/components/TextBoxRich.vue';
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
} from '@/services/rendering/textBoxMeasurement';
import { buildRichTextParagraphStyleCss } from '@/utils/richTextParagraphStyleCss';

const props = defineProps<{
  workspace: Workspace;
  fonts: string[];
  editorLanguage: string;
}>();
const emit = defineEmits<{
  complete: [heights: TextBoxHeightMeasurement[]];
  failed: [error: Error];
}>();
const styleScopeId = `text-box-measurement-${useId()}`;
const elements = getResizableTextBoxes(props.workspace.score);
const footnoteBodyElements = new Set(
  props.workspace.score.footnotes.flatMap((body) => body.staff.elements),
);
const paragraphStyleCss = computed(() =>
  buildRichTextParagraphStyleCss(
    props.workspace.score.paragraphStyles,
    `#${styleScopeId} .ck-content`,
  ),
);
const measurers = new Map<
  MeasuredTextBox,
  { measureTextBox(): Promise<TextBoxHeightMeasurement> }
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
    measurers.set(
      element,
      instance as { measureTextBox(): Promise<TextBoxHeightMeasurement> },
    );
  }
}

function complete(heights: TextBoxHeightMeasurement[]) {
  if (!disposed) {
    clearTimeout(timer);
    emit('complete', heights);
  }
}

function failed(error: Error) {
  if (!disposed) {
    clearTimeout(timer);
    emit('failed', error);
  }
}

onMounted(async () => {
  try {
    await nextTick();
    if (measurers.size !== elements.length) {
      throw new Error('TEXT_BOX_MEASUREMENT_FAILED');
    }
    const heights = await Promise.all(
      elements.map((element) => measurers.get(element)!.measureTextBox()),
    );
    complete(heights);
  } catch (error) {
    failed(
      error instanceof Error ? error : new Error('TEXT_BOX_MEASUREMENT_FAILED'),
    );
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
