<template>
  <div
    :id="styleScopeId"
    class="workspace-text-box-measurement"
    :style="{ '--zoom': 1, '--zoom-residue': 1 }"
    inert
    aria-hidden="true"
  >
    <!-- Plain text boxes on repeated templates keep their page context. -->
    <ScorePrintPages
      v-if="templatePages && plainBoxes.size > 0"
      :workspace="workspace"
      :pages="templatePages"
      :fonts="fonts"
      :editor-language="editorLanguage"
      :overlays="overlays"
      :measurement-boxes="plainBoxes"
      measure-text-only
      @measured="plainHeights.resolve"
      @failed="plainHeights.reject"
    />
    <template v-else-if="!templatePages">
      <TextBox
        v-for="element in plainBoxes"
        :key="element.id!"
        :ref="(instance) => setPlainMeasurer(element, instance)"
        :element="element"
        :page-setup="workspace.score.pageSetup"
        :edit-mode="false"
      />
    </template>
    <component :is="'style'">{{ paragraphStyleCss }}</component>
    <TextBoxRich
      v-if="currentRichText && measurementEditors"
      :key="measurementEditors.direction"
      ref="richTextMeasurer"
      class="rich-text-box-measurement"
      :class="{ 'print-measurement': templatePages }"
      :element="currentRichText.box"
      :metadata="currentRichText.metadata"
      :footnote-body="footnoteBodyElements.has(currentRichText.box)"
      :footnote-markers="currentRichText.box.footnoteMarkers"
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
  useTemplateRef,
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
  getTextBoxVariants,
  type MeasuredTextBox,
  type TextBoxHeightMeasurement,
} from '@/services/rendering/textBoxMeasurement';
import type { TokenMetadata } from '@/utils/replaceTokens';
import {
  getInitialRichTextBoxLanguage,
  getRichTextLanguageCode,
} from '@/utils/richTextLanguage';
import { buildRichTextParagraphStyleCss } from '@/utils/richTextParagraphStyleCss';

const props = defineProps<{
  workspace: Workspace;
  templatePages?: Page[];
  measurementBoxes?: ReadonlySet<MeasuredTextBox>;
  fonts: string[];
  editorLanguage: string;
}>();
const emit = defineEmits<{
  complete: [heights: TextBoxHeightMeasurement[]];
  failed: [error: Error];
}>();
interface RichTextMeasurement {
  box: RichTextBoxElement;
  metadata?: TokenMetadata;
}
interface TextBoxMeasurer {
  measureTextBox(): Promise<TextBoxHeightMeasurement>;
}
const overlays = new EditorPreferences();
const styleScopeId = `text-box-measurement-${useId()}`;
const targets: ReadonlySet<MeasuredTextBox> =
  props.measurementBoxes ??
  new Set(getResizableTextBoxes(props.workspace.score));
// Repeated templates are measured once for each distinct tokenized content.
const variants: ReadonlyMap<
  MeasuredTextBox,
  ReadonlyMap<string | undefined, TokenMetadata | undefined>
> = props.templatePages === undefined
  ? new Map([...targets].map((box) => [box, new Map([[undefined, undefined]])]))
  : getTextBoxVariants(props.workspace, props.templatePages, targets);
const plainBoxes = new Set<TextBoxElement>();
const richTextMeasurements: RichTextMeasurement[] = [];
for (const [box, contexts] of variants) {
  if (box.elementType === ElementType.RichTextBox) {
    for (const metadata of contexts.values()) {
      richTextMeasurements.push({ box: box as RichTextBoxElement, metadata });
    }
  } else {
    plainBoxes.add(box as TextBoxElement);
  }
}
// CKEditor's indent and table converters capture direction during setup, so
// each direction gets its own reused editor set.
const groups = Map.groupBy(richTextMeasurements, ({ box }) =>
  getLanguageDirection(
    getRichTextLanguageCode(
      getInitialRichTextBoxLanguage(box, props.workspace.score.pageSetup) ??
        'en',
    ),
  ),
);
const currentRichText = shallowRef<RichTextMeasurement>();
const measurementEditors = shallowRef<{
  direction: LanguageDirection;
  multipanel: boolean;
}>();
const richTextMeasurer = useTemplateRef<TextBoxMeasurer>('richTextMeasurer');
const plainMeasurers = new Map<TextBoxElement, TextBoxMeasurer>();
const plainHeights = Promise.withResolvers<TextBoxHeightMeasurement[]>();
// Rejection is handled once measurement starts.
plainHeights.promise.catch(() => undefined);
const footnoteBodyElements = new Set(
  props.workspace.score.footnotes.flatMap((body) => body.staff.elements),
);
const paragraphStyleCss = computed(() =>
  buildRichTextParagraphStyleCss(
    props.workspace.score.paragraphStyles,
    `#${styleScopeId} .ck-content`,
  ),
);
let disposed = false;
let timer = startTimeout();

function startTimeout() {
  return setTimeout(
    () => failed(new Error('TEXT_BOX_MEASUREMENT_FAILED')),
    30_000,
  );
}

function setPlainMeasurer(element: TextBoxElement, instance: unknown) {
  if (instance === null) {
    plainMeasurers.delete(element);
  } else {
    plainMeasurers.set(element, instance as TextBoxMeasurer);
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

async function measurePlainTextBoxes() {
  if (plainBoxes.size === 0) {
    return [];
  }
  if (props.templatePages !== undefined) {
    return plainHeights.promise;
  }
  if (plainMeasurers.size !== plainBoxes.size) {
    throw new Error('TEXT_BOX_MEASUREMENT_FAILED');
  }
  return Promise.all(
    [...plainBoxes].map((element) =>
      plainMeasurers.get(element)!.measureTextBox(),
    ),
  );
}

async function measureRichTextBoxes() {
  const { score, contentRevision } = props.workspace;
  const heights: TextBoxHeightMeasurement[] = [];
  let sliceStarted = performance.now();
  for (const [direction, measurements] of groups) {
    measurementEditors.value = {
      direction,
      multipanel: measurements.some(({ box }) => box.multipanel),
    };
    for (const measurement of measurements) {
      if (
        disposed ||
        props.workspace.score !== score ||
        props.workspace.contentRevision !== contentRevision
      ) {
        throw new Error('LAYOUT_CONFLICT');
      }

      currentRichText.value = measurement;
      await nextTick();
      if (richTextMeasurer.value === null) {
        throw new Error('TEXT_BOX_MEASUREMENT_FAILED');
      }
      heights.push(await richTextMeasurer.value.measureTextBox());
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
  try {
    await nextTick();
    const [plain, richText] = await Promise.all([
      measurePlainTextBoxes(),
      measureRichTextBoxes(),
    ]);
    complete([...plain, ...richText]);
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

/* Template pages are measured as they print. Match the print renderer's
   overflow, so a scrollbar never adds height that print omits. */
.print-measurement :deep(.rich-text-editor) {
  overflow: visible !important;
}
</style>
