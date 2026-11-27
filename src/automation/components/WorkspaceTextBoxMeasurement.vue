<template>
  <div
    :id="styleScopeId"
    class="workspace-text-box-measurement"
    :style="{ '--zoom': 1, '--zoom-residue': 1 }"
    inert
    aria-hidden="true"
  >
    <ScorePrintPages
      v-if="templatePages"
      :workspace="workspace"
      :pages="templatePages"
      :fonts="fonts"
      :editor-language="editorLanguage"
      :overlays="overlays"
      :measurement-boxes="measurementBoxes"
      measure-text-only
      @measured="complete"
      @failed="failed"
    />
    <template v-else>
      <component :is="'style'">{{ paragraphStyleCss }}</component>
      <template
        v-for="(element, index) in displayedElements"
        :key="measurementEditors?.direction ?? index"
      >
        <TextBoxRich
          v-if="element.elementType === ElementType.RichTextBox"
          :ref="(instance) => setMeasurer(element, instance)"
          class="rich-text-box-measurement"
          :element="element as RichTextBoxElement"
          :footnote-body="footnoteBodyElements.has(element)"
          :footnote-markers="(element as RichTextBoxElement).footnoteMarkers"
          :page-setup="workspace.score.pageSetup"
          :paragraph-styles="workspace.score.paragraphStyles"
          :initial-martyria-styles="workspace.score.initialMartyriaStyles"
          :default-initial-martyria-style-id="
            workspace.score.defaultInitialMartyriaStyleId
          "
          :fonts="fonts"
          :editor-language="editorLanguage"
          :edit-mode="false"
          :recalc="true"
          :measurement-editors="measurementEditors"
        />
        <TextBox
          v-else
          :ref="(instance) => setMeasurer(element, instance)"
          :element="element as TextBoxElement"
          :page-setup="workspace.score.pageSetup"
          :edit-mode="false"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { getLanguageDirection, type LanguageDirection } from 'ckeditor5';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useId,
} from 'vue';

import ScorePrintPages from '@/components/ScorePrintPages.vue';
import TextBox from '@/components/TextBox.vue';
import TextBoxRich from '@/components/TextBoxRich.vue';
import { EditorPreferences } from '@/models/EditorPreferences';
import {
  ElementType,
  type RichTextBoxElement,
  type TextBoxElement,
} from '@/models/Element';
import type { Page } from '@/models/Page';
import type { Workspace } from '@/models/Workspace';
import {
  getResizableTextBoxes,
  type MeasuredTextBox,
  type TextBoxHeightMeasurement,
} from '@/services/rendering/textBoxMeasurement';
import {
  getInitialRichTextBoxLanguage,
  getRichTextLanguageCode,
} from '@/utils/richTextLanguage';
import { buildRichTextParagraphStyleCss } from '@/utils/richTextParagraphStyleCss';

const props = defineProps<{
  workspace: Workspace;
  templatePages?: Page[];
  measurementBoxes?: ReadonlySet<MeasuredTextBox>;
  reuseRichTextEditors?: boolean;
  fonts: string[];
  editorLanguage: string;
}>();
const emit = defineEmits<{
  complete: [heights: TextBoxHeightMeasurement[]];
  failed: [error: Error];
}>();
const overlays = new EditorPreferences();
const styleScopeId = `text-box-measurement-${useId()}`;
const elements =
  props.measurementBoxes === undefined
    ? getResizableTextBoxes(props.workspace.score)
    : [...props.measurementBoxes];
// CKEditor's indent and table converters capture direction during setup.
const groups = new Map<LanguageDirection, RichTextBoxElement[]>();
if (props.reuseRichTextEditors) {
  for (const element of elements) {
    if (element.elementType === ElementType.RichTextBox) {
      const box = element as RichTextBoxElement;
      const language = getInitialRichTextBoxLanguage(
        box,
        props.workspace.score.pageSetup,
      );
      const direction = getLanguageDirection(
        getRichTextLanguageCode(language ?? 'en'),
      );
      const group = groups.get(direction);
      if (group === undefined) {
        groups.set(direction, [box]);
      } else {
        group.push(box);
      }
    }
  }
}
const currentBox = shallowRef<RichTextBoxElement>();
const measurementEditors = shallowRef<{
  direction: LanguageDirection;
  multipanel: boolean;
}>();
const displayedElements = computed(() =>
  props.reuseRichTextEditors
    ? currentBox.value === undefined
      ? []
      : [currentBox.value]
    : elements,
);
const footnoteBodyElements = new Set(
  props.workspace.score.footnotes.flatMap((body) => body.staff.elements),
);
const paragraphStyleCss = computed(() =>
  buildRichTextParagraphStyleCss(
    props.workspace.score.paragraphStyles,
    `#${styleScopeId} .ck-content`,
  ),
);
interface TextBoxMeasurer {
  measureTextBox(): Promise<TextBoxHeightMeasurement>;
}
const measurers = new Map<MeasuredTextBox, TextBoxMeasurer>();
let reusableMeasurer: TextBoxMeasurer | null = null;
let disposed = false;
let timer = startTimeout();

function startTimeout() {
  return setTimeout(
    () => failed(new Error('TEXT_BOX_MEASUREMENT_FAILED')),
    30_000,
  );
}

function setMeasurer(element: MeasuredTextBox, instance: unknown) {
  const measurer = instance as TextBoxMeasurer | null;
  if (props.reuseRichTextEditors) {
    reusableMeasurer = measurer;
  } else if (measurer === null) {
    measurers.delete(element);
  } else {
    measurers.set(element, measurer);
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

async function measureWithReusableEditors() {
  const { score, contentRevision } = props.workspace;
  const heights: TextBoxHeightMeasurement[] = [];
  let sliceStarted = performance.now();
  for (const [direction, boxes] of groups) {
    measurementEditors.value = {
      direction,
      multipanel: boxes.some((box) => box.multipanel),
    };
    for (const box of boxes) {
      if (
        disposed ||
        props.workspace.score !== score ||
        props.workspace.contentRevision !== contentRevision
      ) {
        throw new Error('LAYOUT_CONFLICT');
      }

      currentBox.value = box;
      await nextTick();
      if (reusableMeasurer === null) {
        throw new Error('TEXT_BOX_MEASUREMENT_FAILED');
      }
      heights.push(await reusableMeasurer.measureTextBox());
      if (performance.now() - sliceStarted >= 8) {
        clearTimeout(timer);
        timer = startTimeout();
        // Give the browser time to paint and handle input between measurements.
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        sliceStarted = performance.now();
      }
    }
  }
  return heights;
}

onMounted(async () => {
  if (props.templatePages !== undefined) {
    return;
  }
  try {
    await nextTick();
    if (props.reuseRichTextEditors) {
      complete(await measureWithReusableEditors());
      return;
    }
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

.rich-text-box-measurement {
  position: relative;
}
</style>
