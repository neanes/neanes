<template>
  <template
    v-if="
      overlays?.showDeveloperPanels &&
      overlays?.overlaysEnabled &&
      overlays?.showGuides &&
      (!printMode || overlays?.printOverlays)
    "
  >
    <span class="guide-line-vl" :style="getGuideStyleLeft(page)" />
    <span class="guide-line-vr" :style="getGuideStyleRight(page)" />
    <span class="guide-line-ht" :style="guideStyleTop" />
    <span class="guide-line-hb" :style="guideStyleBottom" />
  </template>
  <template
    v-if="
      overlays?.showDeveloperPanels &&
      overlays?.overlaysEnabled &&
      overlays?.showLyricBaselines &&
      (!printMode || overlays?.printOverlays)
    "
  >
    <span
      v-for="baseline in getDeveloperLyricBaselines(page)"
      :key="`developer-lyric-baseline-${pageIndex}-${baseline.key}`"
      class="developer-lyric-baseline"
      :style="baseline.style"
    />
  </template>
  <template
    v-if="
      overlays?.showDeveloperPanels &&
      overlays?.overlaysEnabled &&
      overlays?.showGlueWidths &&
      (!printMode || overlays?.printOverlays)
    "
  >
    <div
      v-for="(line, lineIndex) in page.lines"
      :key="`developer-glue-line-${pageIndex}-${lineIndex}`"
    >
      <div
        v-for="overlay in getDeveloperGlueOverlays(
          page,
          line,
          lineIndex,
          pageIndex,
        )"
        :key="`developer-glue-${overlay.key}`"
        class="developer-glue-overlay"
        :class="{
          shrink: overlay.delta < 0,
          stretch: overlay.delta > 0,
        }"
        :style="overlay.wrapperStyle"
      >
        <div
          class="developer-glue-preferred"
          :class="{
            negative: overlay.preferredNegative,
          }"
          :style="overlay.preferredStyle"
        ></div>
        <div
          class="developer-glue-actual"
          :class="{
            negative: overlay.actualNegative,
          }"
          :style="overlay.actualStyle"
        ></div>
      </div>
    </div>
  </template>
  <template
    v-if="
      overlays?.showDeveloperPanels &&
      overlays?.overlaysEnabled &&
      (overlays?.showAnonymousBoxes || overlays?.showElementBoxes) &&
      (!printMode || overlays?.printOverlays)
    "
  >
    <div
      v-for="(line, lineIndex) in page.lines"
      :key="`developer-anonymous-line-${pageIndex}-${lineIndex}`"
    >
      <div
        v-for="overlay in getDeveloperBoxOverlays(page, line, lineIndex)"
        :key="`developer-anonymous-${pageIndex}-${overlay.key}`"
        class="developer-box-overlay"
        :class="overlay.kind"
        :style="overlay.style"
        :title="overlay.label"
      ></div>
    </div>
  </template>

  <template v-if="score.pageSetup.showHeader">
    <slot name="header-badge" />
    <template v-if="isRichTextBoxElement(header)">
      <TextBoxRich
        :key="`element-${workspaceId}-${header.id}-${header.keyHelper}`"
        :ref="setTemplateRef(`header-${pageIndex}`)"
        class="element-box"
        :element="header as RichTextBoxElement"
        :edit-mode="!printMode && header == selectedHeaderFooterElement"
        :metadata="metadata"
        token-scope="header"
        :page-setup="score.pageSetup"
        :fonts="fonts"
        :paragraph-styles="score.paragraphStyles"
        :editor-language="editorLanguage"
        :selected="header == selectedHeaderFooterElement"
        :style="getHeaderStyle(page)"
        @click="emit('selectHeaderRichTextBox', pageIndex)"
        @select-neume="
          emit('selectHeaderRichTextBox', pageIndex);
          emit('showPropertiesPaneForRichTextNeume');
        "
        @update="
          emit('updateRichTextBox', header as RichTextBoxElement, $event)
        "
        @update:height="
          emit('updateRichTextBoxHeight', header as RichTextBoxElement, $event)
        "
      />
    </template>
    <template v-else-if="isTextBoxElement(header)">
      <TextBox
        :key="`element-${workspaceId}-${header.id}-${header.keyHelper}`"
        :ref="setTemplateRef(`header-${pageIndex}`)"
        class="element-box"
        :element="header as TextBoxElement"
        :edit-mode="!printMode && header == selectedHeaderFooterElement"
        :metadata="metadata"
        token-scope="header"
        :page-setup="score.pageSetup"
        :selected="header == selectedHeaderFooterElement"
        :class="[
          {
            selectedTextbox: header == selectedHeaderFooterElement,
          },
        ]"
        :style="getHeaderStyle(page)"
        @click="emit('selectHeaderFooter', header)"
        @update="emit('updateTextBox', header! as TextBoxElement, $event)"
      />
    </template>
    <div
      v-if="showHeaderRule"
      class="header-footer-hr"
      :style="getHeaderHorizontalRuleStyle(page, header.height)"
    ></div>
  </template>
  <div
    v-for="(line, lineIndex) in page.lines"
    :key="`line-${pageIndex}-${lineIndex}`"
    class="line"
  >
    <div
      v-for="element in line.elements"
      :id="`element-${element.id}`"
      :key="`element-${workspaceId}-${element.id}-${element.keyHelper}`"
      class="element-box"
      :style="getElementStyle(element)"
      @contextmenu="emit('onScoreElementContextMenu', element)"
    >
      <template v-if="isSyllableElement(element)">
        <div
          :ref="setTemplateRef(`element-${getElementIndex(element)}`)"
          class="neume-box"
        >
          <span v-if="element.pageBreak" class="page-break"><PhFile /></span>
          <span
            v-if="hasActiveKeepWithNext(element)"
            class="keep-with-next"
            :title="
              i18next.t(($) => $.toolbar.common.keepWithNext, {
                ns: 'toolbar',
              })
            "
            ><PhLinkSimpleHorizontal weight="bold"
          /></span>
          <span v-if="element.lineBreak" class="line-break"
            ><svg
              v-if="element.lineBreakType === LineBreakType.Center"
              viewBox="0 0 24 24"
            >
              <PhParagraph
                size="24"
                weight="fill"
                transform="matrix(0.75 0 0 1 -2 0)"
              />
              <PhTextAlignCenter size="12" x="12" y="12" /></svg
            ><PhParagraph v-else weight="fill"
          /></span>
          <AlternateLine
            v-for="(alternateLine, index) in (element as NoteElement)
              .alternateLines"
            :key="index"
            :element="alternateLine"
            :page-setup="score.pageSetup"
            :class="{
              selectedAlternateLine:
                interaction?.selectedAlternateLineElement === alternateLine,
            }"
            @update="emit('updateAlternateLine', alternateLine, $event)"
            @mousedown="
              emit('setSelectedAlternateLine', element, alternateLine)
            "
          />
          <Annotation
            v-for="(annotation, index) in (element as NoteElement).annotations"
            :key="index"
            :ref="
              setTemplateRef(`annotation-${getElementIndex(element)}-${index}`)
            "
            :element="annotation"
            :page-setup="score.pageSetup"
            :fonts="fonts"
            :paragraph-styles="score.paragraphStyles"
            :editor-language="editorLanguage"
            :selected="interaction?.selectedAnnotationElement === annotation"
            @update="emit('updateAnnotation', annotation, $event)"
            @delete="
              emit('removeAnnotation', element as NoteElement, annotation, true)
            "
            @select-neume="
              emit('setSelectedAnnotation', element, annotation);
              emit('showPropertiesPaneForRichTextNeume');
            "
            @mousedown="emit('setSelectedAnnotation', element, annotation)"
          />
          <SyllableNeumeBox
            class="syllable-box"
            :note="element as NoteElement"
            :page-setup="score.pageSetup"
            :class="[
              {
                selected: isSelected(element),
                'audio-selected': isAudioSelected(element),
              },
            ]"
            @select-single="emit('selectElement', element)"
            @select-range="emit('setSelectionRange', element)"
            @dblclick="emit('openSyllablePositioningDialog')"
          />
          <span
            v-if="(element as NoteElement).showLeadingLyricHyphen"
            class="leading-lyric-hyphen"
            contenteditable="false"
            aria-hidden="true"
            :style="getLeadingLyricHyphenStyle(element as NoteElement)"
            >-</span
          >
          <div
            class="lyrics-container"
            dir="auto"
            :style="getLyricStyle(element as NoteElement)"
          >
            <ContentEditable
              :ref="setTemplateRef(`lyrics-${getElementIndex(element)}`)"
              class="lyrics"
              :class="{
                selectedLyrics: element === selectedLyrics,
              }"
              :style="{ minWidth: withZoom(element.width) }"
              :content="(element as NoteElement).lyrics"
              :editable="!printMode && !lyricsLocked"
              white-space="nowrap"
              @click="emit('focusLyrics', element.index)"
              @focus="emit('selectLyrics', element as NoteElement)"
              @blur="emit('updateLyrics', element as NoteElement, $event)"
            />
            <template
              v-if="
                isMelisma(element as NoteElement) &&
                (element as NoteElement).isHyphen &&
                (element as NoteElement).melismaText === ''
              "
            >
              <div
                class="melisma"
                :class="{
                  full: (element as NoteElement).isFullMelisma,
                }"
                :style="getMelismaStyle(element as NoteElement)"
              >
                <span
                  v-for="(offset, index) in (element as NoteElement)
                    .hyphenOffsets"
                  :key="index"
                  class="melisma-hyphen"
                  :style="getMelismaHyphenStyle(element as NoteElement, index)"
                  >-</span
                >
              </div>
            </template>
            <template
              v-else-if="
                isMelisma(element as NoteElement) &&
                !(element as NoteElement).isHyphen &&
                !rtl &&
                (element as NoteElement).melismaText === ''
              "
            >
              <span class="melisma-underscore" aria-hidden="true">
                <span
                  class="melisma-inner"
                  :style="
                    getMelismaUnderscoreStyleInner(element as NoteElement)
                  "
                ></span>
              </span>
            </template>
            <template
              v-else-if="
                isMelisma(element as NoteElement) &&
                !(element as NoteElement).isHyphen &&
                rtl
              "
            >
              <div
                class="melisma"
                :class="{
                  fullRtl: (element as NoteElement).isFullMelisma,
                }"
                :style="getMelismaStyle(element as NoteElement)"
                v-text="(element as NoteElement).melismaText"
              ></div>
            </template>
            <template
              v-else-if="
                (element as NoteElement).isMelisma &&
                (element as NoteElement).melismaText !== '' &&
                !rtl
              "
            >
              <span
                class="melisma-text"
                :class="{
                  selectedMelisma: element === selectedLyrics,
                }"
                @click="emit('focusLyrics', element.index)"
                @focus="emit('selectLyrics', element as NoteElement)"
                v-text="(element as NoteElement).melismaText"
              ></span>
            </template>
          </div>
        </div>
      </template>
      <template v-else-if="isMartyriaElement(element)">
        <div class="neume-box">
          <span v-if="element.pageBreak" class="page-break"> <PhFile /></span>
          <span v-if="element.lineBreak" class="line-break"
            ><PhParagraph weight="fill"
          /></span>
          <MartyriaNeumeBox
            :ref="setTemplateRef(`element-${getElementIndex(element)}`)"
            class="marytria-neume-box"
            :neume="element as MartyriaElement"
            :page-setup="score.pageSetup"
            :class="[
              {
                selected: isSelected(element),
              },
            ]"
            @select-single="emit('selectElement', element)"
            @select-range="emit('setSelectionRange', element)"
          />
          <div class="lyrics"></div>
        </div>
      </template>
      <template v-else-if="isTempoElement(element)">
        <div
          :ref="setTemplateRef(`element-${getElementIndex(element)}`)"
          class="neume-box"
        >
          <span v-if="element.pageBreak" class="page-break"> <PhFile /></span>
          <span v-if="element.lineBreak" class="line-break"
            ><PhParagraph weight="fill"
          /></span>
          <TempoNeumeBox
            class="tempo-neume-box"
            :neume="element as TempoElement"
            :page-setup="score.pageSetup"
            :class="[{ selected: isSelected(element) }]"
            @select-single="emit('selectElement', element)"
            @select-range="emit('setSelectionRange', element)"
          />
          <div class="lyrics"></div>
        </div>
      </template>
      <template v-else-if="isEmptyElement(element)">
        <div
          :ref="setTemplateRef(`element-${getElementIndex(element)}`)"
          class="neume-box"
        >
          <span v-if="element.pageBreak" class="page-break"> <PhFile /></span>
          <span v-if="element.lineBreak" class="line-break"
            ><PhParagraph weight="fill"
          /></span>
          <EmptyNeumeBox
            class="empty-neume-box"
            :class="[{ selected: isSelected(element) }]"
            :style="getEmptyBoxStyle(element as EmptyElement)"
            @select-single="emit('selectElement', element)"
          ></EmptyNeumeBox>
          <div class="lyrics"></div>
        </div>
      </template>
      <template v-else-if="isTextBoxElement(element)">
        <span v-if="element.pageBreak" class="page-break-2"><PhFile /></span>
        <span v-if="element.lineBreak" class="line-break-2"
          ><PhParagraph weight="fill"
        /></span>
        <TextBox
          :ref="setTemplateRef(`element-${getElementIndex(element)}`)"
          :element="element as TextBoxElement"
          :edit-mode="!printMode"
          :metadata="metadata"
          :page-setup="score.pageSetup"
          :selected="isSelected(element)"
          @select-single="emit('selectElement', element)"
          @update="emit('updateTextBox', element as TextBoxElement, $event)"
          @update:height="
            emit('updateTextBoxHeight', element as TextBoxElement, $event)
          "
        />
      </template>
      <template v-else-if="isRichTextBoxElement(element)">
        <span v-if="element.pageBreak" class="page-break-2"><PhFile /></span>
        <span v-if="element.lineBreak" class="line-break-2"
          ><PhParagraph weight="fill"
        /></span>
        <TextBoxRich
          :ref="setTemplateRef(`element-${getElementIndex(element)}`)"
          :edit-mode="!printMode"
          :element="element as RichTextBoxElement"
          :page-setup="score.pageSetup"
          :fonts="fonts"
          :paragraph-styles="score.paragraphStyles"
          :editor-language="editorLanguage"
          :selected="isSelected(element)"
          @select-single="emit('selectElement', element)"
          @select-neume="
            emit('selectElement', element);
            emit('showPropertiesPaneForRichTextNeume');
          "
          @update="
            emit('updateRichTextBox', element as RichTextBoxElement, $event)
          "
          @update:height="
            emit(
              'updateRichTextBoxHeight',
              element as RichTextBoxElement,
              $event,
            )
          "
        />
      </template>
      <template v-else-if="isModeKeyElement(element)">
        <span v-if="element.pageBreak" class="page-break-2"><PhFile /></span>
        <span v-if="element.lineBreak" class="line-break-2"
          ><PhParagraph weight="fill"
        /></span>
        <ModeKey
          :ref="setTemplateRef(`element-${getElementIndex(element)}`)"
          :element="element as ModeKeyElement"
          :page-setup="score.pageSetup"
          :class="[
            {
              selectedTextbox: isSelected(element),
            },
          ]"
          @select-single="emit('selectElement', element)"
          @dblclick="emit('openModeKeyDialog')"
        />
      </template>
      <template v-else-if="isDropCapElement(element)">
        <span v-if="element.pageBreak" class="page-break"><PhFile /></span>
        <span v-if="element.lineBreak" class="line-break"
          ><PhParagraph weight="fill"
        /></span>
        <DropCap
          :ref="setTemplateRef(`element-${getElementIndex(element)}`)"
          :element="element as DropCapElement"
          :page-setup="score.pageSetup"
          :editable="!printMode && !lyricsLocked"
          :class="[
            {
              selectedTextbox: isSelected(element),
            },
          ]"
          @select-single="emit('selectElement', element)"
          @update:content="
            emit('updateDropCapContent', element as DropCapElement, $event)
          "
        />
      </template>
      <template v-else-if="isImageBoxElement(element)">
        <span v-if="element.pageBreak" class="page-break-2"><PhFile /></span>
        <span v-if="element.lineBreak" class="line-break-2"
          ><PhParagraph weight="fill"
        /></span>
        <ImageBox
          :ref="setTemplateRef(`element-${getElementIndex(element)}`)"
          :element="element as ImageBoxElement"
          :zoom="zoom"
          :print-mode="printMode"
          :class="[{ selectedImagebox: isSelected(element) }]"
          @select-single="emit('selectElement', element)"
          @update:size="emit('resizeImage', $event)"
        />
      </template>

      <div
        v-for="(box, boxIndex) in getDeveloperOverlayBoxes(element)"
        v-show="!printMode || overlays?.printOverlays"
        :key="`developer-overlay-${element.id}-${boxIndex}`"
        class="developer-overlay-box"
        :class="{
          collision: box.kind === 'collision',
          ink: box.kind === 'ink',
          lyric: box.kind === 'lyric',
          neume: box.kind === 'neume',
        }"
        :style="getDeveloperOverlayStyle(box)"
      ></div>
    </div>

    <span
      v-if="
        overlays?.showDeveloperPanels &&
        overlays?.overlaysEnabled &&
        overlays?.showAdjustmentRatios &&
        (!printMode || overlays?.printOverlays) &&
        line.adjustmentRatio != null &&
        line.elements.length > 0
      "
      class="adjustment-ratio"
      :style="getAdjustmentRatioStyle(line, page)"
      >{{ line.adjustmentRatio.toFixed(2) }}</span
    >
  </div>
  <template v-if="score.pageSetup.showFooter">
    <slot name="footer-badge" />
    <div
      v-if="showFooterRule"
      class="header-footer-hr"
      :style="getFooterHorizontalRuleStyle(page, footer.height)"
    ></div>
    <template v-if="isRichTextBoxElement(footer)">
      <TextBoxRich
        :key="`element-${workspaceId}-${footer.id}-${footer.keyHelper}`"
        :ref="setTemplateRef(`footer-${pageIndex}`)"
        class="element-box"
        :element="footer as RichTextBoxElement"
        :edit-mode="!printMode && footer == selectedHeaderFooterElement"
        :metadata="metadata"
        token-scope="footer"
        :page-setup="score.pageSetup"
        :fonts="fonts"
        :paragraph-styles="score.paragraphStyles"
        :editor-language="editorLanguage"
        :selected="footer == selectedHeaderFooterElement"
        :style="getFooterStyle(page)"
        @click="emit('selectFooterRichTextBox', pageIndex)"
        @select-neume="
          emit('selectFooterRichTextBox', pageIndex);
          emit('showPropertiesPaneForRichTextNeume');
        "
        @update="
          emit('updateRichTextBox', footer as RichTextBoxElement, $event)
        "
        @update:height="
          emit('updateRichTextBoxHeight', footer as RichTextBoxElement, $event)
        "
      />
    </template>
    <template v-else-if="isTextBoxElement(footer)">
      <TextBox
        :ref="setTemplateRef(`footer-${pageIndex}`)"
        :key="`element-${workspaceId}-${footer.id}-${footer.keyHelper}`"
        class="element-box"
        :element="footer as TextBoxElement"
        :edit-mode="!printMode && footer == selectedHeaderFooterElement"
        :metadata="metadata"
        token-scope="footer"
        :page-setup="score.pageSetup"
        :selected="footer == selectedHeaderFooterElement"
        :class="[
          {
            selectedTextbox: footer == selectedHeaderFooterElement,
          },
        ]"
        :style="getFooterStyle(page)"
        @click="emit('selectHeaderFooter', footer)"
        @update="emit('updateTextBox', footer! as TextBoxElement, $event)"
    /></template>
  </template>
</template>
<script setup lang="ts">
import {
  PhFile,
  PhLinkSimpleHorizontal,
  PhParagraph,
  PhTextAlignCenter,
} from '@phosphor-icons/vue';
import i18next from 'i18next';
import { computed, nextTick, type StyleValue, toRef } from 'vue';

import AlternateLine from '@/components/AlternateLine.vue';
import ContentEditable from '@/components/ContentEditable.vue';
import DropCap from '@/components/DropCap.vue';
import ImageBox from '@/components/ImageBox.vue';
import ModeKey from '@/components/ModeKey.vue';
import EmptyNeumeBox from '@/components/NeumeBoxEmpty.vue';
import MartyriaNeumeBox from '@/components/NeumeBoxMartyria.vue';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import TempoNeumeBox from '@/components/NeumeBoxTempo.vue';
import Annotation from '@/components/TextAnnotation.vue';
import TextBox from '@/components/TextBox.vue';
import TextBoxRich from '@/components/TextBoxRich.vue';
import { useScoreRendering } from '@/composables/useScoreRendering';
import type { ScoreOverlaySettings } from '@/models/EditorPreferences';
import {
  type DropCapElement,
  ElementType,
  type EmptyElement,
  type ImageBoxElement,
  isKeepWithNextActive,
  LineBreakType,
  type MartyriaElement,
  type ModeKeyElement,
  type NoteElement,
  type RichTextBoxElement,
  type ScoreElement,
  type TempoElement,
  type TextBoxElement,
} from '@/models/Element';
import type { BoxOverlayDiagnostics } from '@/models/LayoutDiagnostics';
import type { Line, Page } from '@/models/Page';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import type { Score } from '@/models/Score';
import {
  getResizableTextBoxes,
  type TextBoxHeightMeasurement,
} from '@/services/documents/textBoxMeasurement';
import { LayoutService } from '@/services/LayoutService';
import { getLyricsBaseline } from '@/services/LyricsLayout';
import {
  isDropCapElement,
  isEmptyElement,
  isImageBoxElement,
  isMartyriaElement,
  isModeKeyElement,
  isRichTextBoxElement,
  isSyllableElement,
  isTempoElement,
  isTextBoxElement,
} from '@/utils/elementTypeGuards';
import type { resolvePageMargins } from '@/utils/PageMargins';
import type { TokenMetadata } from '@/utils/replaceTokens';
import { withZoom, withZoomOffset } from '@/utils/withZoom';

import type {
  ScorePageEvents,
  ScorePageInteraction,
} from './ScorePageContent.types';

const props = withDefaults(
  defineProps<{
    score: Score;
    page: Page;
    pageIndex: number;
    workspaceId: string;
    metadata: TokenMetadata;
    isChapterOpening: boolean;
    fonts: string[];
    editorLanguage: string;
    zoom?: number;
    printMode?: boolean;
    interaction?: ScorePageInteraction;
    overlays?: ScoreOverlaySettings;
  }>(),
  { zoom: 1, printMode: false, interaction: undefined, overlays: undefined },
);
const emit = defineEmits<ScorePageEvents>();
const score = toRef(props, 'score');
const rtl = computed(() => props.score.pageSetup.melkiteRtl);
const selectedLyrics = computed(
  () => props.interaction?.selectedLyrics ?? null,
);
const selectedHeaderFooterElement = computed(
  () => props.interaction?.selectedHeaderFooterElement ?? null,
);
const lyricsLocked = computed(() => props.interaction?.lyricsLocked ?? true);
const header = computed(
  () =>
    props.score.getHeaderForPage(
      props.page.physicalPageNumber,
      props.isChapterOpening,
    ).elements[0] as TextBoxElement | RichTextBoxElement,
);
const footer = computed(
  () =>
    props.score.getFooterForPage(
      props.page.physicalPageNumber,
      props.isChapterOpening,
    ).elements[0] as TextBoxElement | RichTextBoxElement,
);
const showHeaderRule = computed(() =>
  props.score.shouldShowHeaderRuleForPageIndex(
    props.page.physicalPageNumber,
    props.isChapterOpening,
  ),
);
const showFooterRule = computed(() =>
  props.score.shouldShowFooterRuleOnPage(
    props.page.physicalPageNumber,
    props.isChapterOpening,
  ),
);
const {
  displayedLyricMetricsContext,
  getResolvedMarginsForPage,
  getHeaderStyle,
  getFooterStyle,
  getHeaderHorizontalRuleStyle,
  getFooterHorizontalRuleStyle,
  getLyricStyle,
  getLeadingLyricHyphenStyle,
  getEmptyBoxStyle,
  getElementStyle,
  getMelismaStyle,
  getMelismaUnderscoreStyleInner,
  getMelismaHyphenStyle,
} = useScoreRendering(score, toRef(props, 'zoom'));

function getDeveloperGlueOverlays(
  page: Page,
  line: Line,
  lineIndex: number,
  pageIndex: number,
) {
  const diagnostics = line.diagnostics;

  if (
    !props.overlays?.showDeveloperPanels ||
    !props.overlays?.overlaysEnabled ||
    !props.overlays?.showGlueWidths ||
    diagnostics == null ||
    line.elements.length === 0
  ) {
    return [];
  }

  const barHeight = Math.max(3, score.value.pageSetup.lineHeight * 0.06);
  const barGap = Math.max(2, score.value.pageSetup.lineHeight * 0.03);
  const stackHeight = barHeight * 2 + barGap;
  const stackTop =
    line.elements[0].y +
    score.value.pageSetup.lineHeight * 0.45 -
    stackHeight / 2;
  const preferredTop = stackTop + barHeight + barGap;
  const resolvedMargins = getResolvedMarginsForPage(page);

  return diagnostics.glueOverlays.map((overlay, overlayIndex) => {
    const delta = overlay.actualWidth - overlay.preferredWidth;
    const actualFrame = getDeveloperGlueOverlayFrame(
      resolvedMargins,
      line,
      overlay.left,
      stackTop,
      overlay.actualWidth,
      barHeight,
    );
    const preferredFrame = getDeveloperGlueOverlayFrame(
      resolvedMargins,
      line,
      overlay.left,
      preferredTop,
      overlay.preferredWidth,
      barHeight,
    );
    const wrapperLeft = Math.min(actualFrame.left, preferredFrame.left);
    const wrapperTop = Math.min(actualFrame.top, preferredFrame.top);
    const wrapperRight = Math.max(
      actualFrame.left + actualFrame.width,
      preferredFrame.left + preferredFrame.width,
    );
    const wrapperBottom = Math.max(
      actualFrame.top + actualFrame.height,
      preferredFrame.top + preferredFrame.height,
    );

    return {
      actualNegative: overlay.actualWidth < 0,
      actualStyle: getDeveloperGlueOverlayStyle(
        actualFrame,
        wrapperLeft,
        wrapperTop,
      ),
      delta,
      key: `${pageIndex}-${lineIndex}-${overlay.ownerElementId ?? 'anon'}-${overlayIndex}`,
      preferredNegative: overlay.preferredWidth < 0,
      preferredStyle: getDeveloperGlueOverlayStyle(
        preferredFrame,
        wrapperLeft,
        wrapperTop,
      ),
      wrapperStyle: getDeveloperGlueOverlayWrapperStyle({
        height: wrapperBottom - wrapperTop,
        left: wrapperLeft,
        top: wrapperTop,
        width: wrapperRight - wrapperLeft,
      }),
    };
  });
}

function getDeveloperBoxOverlays(page: Page, line: Line, lineIndex: number) {
  const diagnostics = line.diagnostics;

  if (
    !props.overlays?.showDeveloperPanels ||
    !props.overlays?.overlaysEnabled ||
    (!props.overlays?.showAnonymousBoxes &&
      !props.overlays?.showElementBoxes) ||
    diagnostics == null ||
    line.elements.length === 0
  ) {
    return [];
  }

  const height = Math.max(4, score.value.pageSetup.lineHeight * 0.08);
  const top = line.elements[0].y + score.value.pageSetup.lineHeight * 0.2;
  const resolvedMargins = getResolvedMarginsForPage(page);

  const overlays: BoxOverlayDiagnostics[] = [];

  if (props.overlays?.showAnonymousBoxes) {
    overlays.push(...diagnostics.anonymousBoxOverlays);
  }

  if (props.overlays?.showElementBoxes) {
    overlays.push(...diagnostics.nonAnonymousBoxOverlays);
  }

  return overlays.map((overlay, overlayIndex) => ({
    key: `${lineIndex}-${overlay.anonymous ? 'anon' : 'owned'}-${overlay.ownerElementId ?? 'none'}-${overlay.label ?? 'box'}-${overlayIndex}`,
    kind: getDeveloperBoxOverlayKind(overlay),
    label: overlay.label,
    style: getDeveloperOverlayStyle(
      getDeveloperGlueOverlayFrame(
        resolvedMargins,
        line,
        overlay.left,
        top,
        overlay.width,
        height,
      ),
    ),
  }));
}

function getDeveloperLyricBaselines(page: Page) {
  const resolvedMargins = getResolvedMarginsForPage(page);
  const context = displayedLyricMetricsContext.value;
  // Every lyric on the page sits on the same baseline, measured from the top
  // of its line.
  const lyricsBaseline = getLyricsBaseline(
    overlayDiagnosticsContext.value.neumeFontHeight,
    score.value.pageSetup.lyricsVerticalOffset,
    context.defaultCanonicalAscent,
  );

  return page.lines.flatMap((line, lineIndex) => {
    const note = line.elements.find(
      (element): element is NoteElement =>
        element.elementType === ElementType.Note,
    );

    if (note == null) {
      return [];
    }

    return [
      {
        key: lineIndex,
        style: {
          left: withZoom(resolvedMargins.left),
          top: withZoomOffset(
            note.y + lyricsBaseline,
            context.defaultAscentShift,
          ),
          width: withZoom(resolvedMargins.contentWidth),
        } as StyleValue,
      },
    ];
  });
}

const guideStyleTop = computed(() => {
  return {
    top: withZoom(score.value.pageSetup.topMargin),
    width: withZoom(score.value.pageSetup.pageWidth),
  } as StyleValue;
});

const guideStyleBottom = computed(() => {
  return {
    bottom: withZoom(score.value.pageSetup.bottomMargin),
    width: withZoom(score.value.pageSetup.pageWidth),
  } as StyleValue;
});

function getGuideStyleLeft(page: Page) {
  const margins = getResolvedMarginsForPage(page);

  return {
    left: withZoom(margins.left),
    height: withZoom(score.value.pageSetup.pageHeight),
  } as StyleValue;
}

function getGuideStyleRight(page: Page) {
  const margins = getResolvedMarginsForPage(page);

  return {
    right: withZoom(margins.right),
    height: withZoom(score.value.pageSetup.pageHeight),
  } as StyleValue;
}

function getDeveloperBoxOverlayKind(overlay: BoxOverlayDiagnostics) {
  switch (overlay.label) {
    case 'line-start-reservation':
      return 'line-start-reservation';
    case 'martyria-shift':
      return 'martyria-shift';
    case 'lyric-collision':
      return 'lyric-collision';
    default:
      return overlay.anonymous ? 'anonymous' : 'owned';
  }
}

function getDeveloperOverlayBoxes(element: ScoreElement) {
  if (
    !props.overlays?.showDeveloperPanels ||
    !props.overlays?.overlaysEnabled
  ) {
    return [];
  }

  if (
    !props.overlays?.showInkBoundingBoxes &&
    !props.overlays?.showLyricBoundingBoxes &&
    !props.overlays?.showNeumeBoundingBoxes &&
    !props.overlays?.showCollisionRegions
  ) {
    return [];
  }

  const diagnostics = LayoutService.getElementOverlayDiagnostics(
    element,
    getNextElementOnSameLine(element),
    score.value.pageSetup,
    overlayDiagnosticsContext.value,
  );
  const boxes: Array<{
    height: number;
    kind: string;
    left: number;
    top: number;
    width: number;
  }> = [];

  if (
    props.overlays?.showNeumeBoundingBoxes &&
    diagnostics.advanceBox != null
  ) {
    boxes.push({ ...diagnostics.advanceBox, kind: 'neume' });
  }

  if (props.overlays?.showInkBoundingBoxes && diagnostics.inkBox != null) {
    boxes.push({ ...diagnostics.inkBox, kind: 'ink' });
  }

  if (props.overlays?.showLyricBoundingBoxes && diagnostics.lyricBox != null) {
    boxes.push({ ...diagnostics.lyricBox, kind: 'lyric' });
  }

  if (props.overlays?.showCollisionRegions) {
    boxes.push(
      ...diagnostics.collisionBoxes.map((box) => ({
        ...box,
        kind: 'collision',
      })),
    );
  }

  return boxes;
}

function getDeveloperOverlayStyle(box: {
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  return {
    left: withZoom(box.left),
    top: withZoom(box.top),
    width: withZoom(box.width),
    height: withZoom(box.height),
  } as StyleValue;
}

function getDeveloperGlueOverlayFrame(
  resolvedMargins: ReturnType<typeof resolvePageMargins>,
  line: Line,
  logicalLeft: number,
  top: number,
  width: number,
  height: number,
) {
  const logicalRight = logicalLeft + width;
  const normalizedLogicalLeft = Math.min(logicalLeft, logicalRight);
  const normalizedLogicalRight = Math.max(logicalLeft, logicalRight);
  const normalizedWidth = normalizedLogicalRight - normalizedLogicalLeft;
  const physicalLeft = rtl.value
    ? resolvedMargins.contentRight - line.indentation - normalizedLogicalRight
    : resolvedMargins.contentLeft + line.indentation + normalizedLogicalLeft;

  return {
    height,
    left: physicalLeft,
    top,
    width: normalizedWidth,
  };
}

function getDeveloperGlueOverlayWrapperStyle(frame: {
  height: number;
  left: number;
  top: number;
  width: number;
}) {
  return {
    left: withZoom(frame.left),
    top: withZoom(frame.top),
    width: withZoom(frame.width),
    height: withZoom(frame.height),
  } as StyleValue;
}

function getDeveloperGlueOverlayStyle(
  frame: { height: number; left: number; top: number; width: number },
  wrapperLeft: number,
  wrapperTop: number,
) {
  return {
    left: withZoom(frame.left - wrapperLeft),
    top: withZoom(frame.top - wrapperTop),
    width: withZoom(frame.width),
    height: withZoom(frame.height),
  } as StyleValue;
}

function getNextElementOnSameLine(element: ScoreElement) {
  const index = score.value.staff.elements.indexOf(element);

  if (index < 0 || index + 1 >= score.value.staff.elements.length) {
    return null;
  }

  return score.value.staff.elements[index + 1].line === element.line
    ? score.value.staff.elements[index + 1]
    : null;
}

function getAdjustmentRatioStyle(line: Line, page: Page) {
  const resolvedLyricsStyle = resolvedDefaultLyricsStyle.value;
  const fontSize = resolvedLyricsStyle.fontSize * 0.8;
  const gap = fontSize * 0.5;
  const margins = getResolvedMarginsForPage(page);

  return {
    position: 'absolute',
    left: withZoom(
      rtl.value
        ? margins.left - gap - fontSize * 3
        : score.value.pageSetup.pageWidth - margins.right + gap,
    ),
    width: withZoom(fontSize * 3),
    textAlign: 'right',
    top: withZoom(
      line.elements[0].y + score.value.pageSetup.lineHeight / 3 - fontSize / 2,
    ),
    fontSize: withZoom(fontSize),
    fontFamily: resolvedLyricsStyle.fontFamily,
    color: score.value.pageSetup.gorgonDefaultColor,
  } as StyleValue;
}

const overlayDiagnosticsContext = computed(() =>
  LayoutService.createOverlayDiagnosticsContext(score.value.pageSetup),
);
const resolvedDefaultLyricsStyle = computed(() =>
  resolveParagraphStyle(
    score.value.paragraphStyles,
    BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
  ),
);

function isSelected(element: ScoreElement) {
  return props.interaction?.isSelected(element) ?? false;
}
function isAudioSelected(element: ScoreElement) {
  return props.interaction?.isAudioSelected(element) ?? false;
}
function getElementIndex(element: ScoreElement) {
  return element.index;
}
function isMelisma(element: NoteElement) {
  return element.melismaWidth > 0;
}
function hasActiveKeepWithNext(element: ScoreElement) {
  return isKeepWithNextActive(
    element,
    props.score.staff.elements[element.index + 1] ?? null,
  );
}

const localRefs = new Map<string, unknown>();
const localSetters = new Map<string, (instance: unknown) => void>();
function setTemplateRef(name: string) {
  let setter = localSetters.get(name);
  if (setter == null) {
    setter = (instance) => {
      if (instance == null) {
        localRefs.delete(name);
      } else {
        localRefs.set(name, instance);
      }
    };
    localSetters.set(name, setter);
  }
  return setter;
}
// Ref keys stay private to the page. Callers identify a child by its model
// position, or by its header/footer region on this page.
function getElementRef<T = unknown>(index: number): T | undefined {
  return localRefs.get(`element-${index}`) as T | undefined;
}
function getLyricsRef(index: number) {
  return localRefs.get(`lyrics-${index}`) as
    InstanceType<typeof ContentEditable> | undefined;
}
function getAnnotationRef(parentIndex: number, annotationIndex: number) {
  return localRefs.get(`annotation-${parentIndex}-${annotationIndex}`) as
    InstanceType<typeof Annotation> | undefined;
}
function getHeaderFooterRef<T = unknown>(
  region: 'header' | 'footer',
): T | undefined {
  return localRefs.get(`${region}-${props.pageIndex}`) as T | undefined;
}
function getPageIndex() {
  return props.pageIndex;
}

async function whenReady() {
  await nextTick();
  await Promise.all(
    [...localRefs.values()].map((instance) => {
      if (
        instance != null &&
        typeof instance === 'object' &&
        'whenReady' in instance &&
        typeof instance.whenReady === 'function'
      ) {
        return instance.whenReady();
      }
    }),
  );
  await nextTick();
}
async function measureTextBoxes(): Promise<TextBoxHeightMeasurement[]> {
  const resizable = new Set(getResizableTextBoxes(props.score));
  const boxes = [
    ...(props.score.pageSetup.showHeader
      ? [{ element: header.value, name: `header-${props.pageIndex}` }]
      : []),
    ...props.page.lines.flatMap((line) =>
      line.elements.map((element) => ({
        element,
        name: `element-${getElementIndex(element)}`,
      })),
    ),
    ...(props.score.pageSetup.showFooter
      ? [{ element: footer.value, name: `footer-${props.pageIndex}` }]
      : []),
  ];
  return Promise.all(
    boxes
      .filter(({ element }) =>
        resizable.has(element as TextBoxElement | RichTextBoxElement),
      )
      .map(async ({ element, name }) => {
        const component = localRefs.get(name) as
          InstanceType<typeof TextBox | typeof TextBoxRich> | undefined;
        if (component == null) {
          throw new Error('TEXT_BOX_MEASUREMENT_FAILED');
        }
        return {
          element: element as TextBoxElement | RichTextBoxElement,
          height: await component.measureHeight(),
        };
      }),
  );
}
defineExpose({
  getElementRef,
  getLyricsRef,
  getAnnotationRef,
  getHeaderFooterRef,
  getPageIndex,
  whenReady,
  measureTextBoxes,
});
</script>
<style scoped>
.guide-line-vl {
  border-left: 1px solid black;
  position: absolute;
}

.guide-line-vr {
  border-right: 1px solid black;
  position: absolute;
}

.guide-line-ht {
  border-top: 1px solid black;
  position: absolute;
}

.guide-line-hb {
  border-bottom: 1px solid black;
  position: absolute;
}

.developer-overlay-box {
  position: absolute;
  pointer-events: none;
  border: 1px dashed #2563eb;
}

.developer-lyric-baseline {
  position: absolute;
  z-index: 30;
  pointer-events: none;
  border-top: 1px solid #d946ef;
  transform: translateY(-100%);
}

.developer-glue-overlay {
  position: absolute;
  pointer-events: none;
  opacity: 0.75;
}

.developer-glue-preferred {
  --developer-glue-preferred-border: rgb(14 116 144 / 80%);
  position: absolute;
  box-sizing: border-box;
  border: 1px solid var(--developer-glue-preferred-border);
  background-size: 100% 100%;
}

.developer-glue-actual {
  --developer-glue-actual-fill: rgb(14 116 144 / 35%);
  position: absolute;
  border: 1px solid rgb(14 116 144 / 55%);
  background: var(--developer-glue-actual-fill);
}

.developer-glue-overlay.stretch .developer-glue-preferred {
  --developer-glue-preferred-border: rgb(3 105 161 / 85%);
}

.developer-glue-overlay.stretch .developer-glue-actual {
  --developer-glue-actual-fill: rgb(3 105 161 / 28%);
}

.developer-glue-overlay.shrink .developer-glue-preferred {
  --developer-glue-preferred-border: rgb(180 83 9 / 85%);
}

.developer-glue-overlay.shrink .developer-glue-actual {
  --developer-glue-actual-fill: rgb(217 119 6 / 24%);
}

.developer-glue-preferred.negative {
  background-image: repeating-linear-gradient(
    135deg,
    transparent 0 4px,
    var(--developer-glue-preferred-border) 4px 7px
  );
}

.developer-glue-actual.negative {
  background-image:
    repeating-linear-gradient(
      135deg,
      transparent 0 4px,
      rgb(255 255 255 / 45%) 4px 7px
    ),
    linear-gradient(
      var(--developer-glue-actual-fill),
      var(--developer-glue-actual-fill)
    );
}

.developer-box-overlay {
  position: absolute;
  pointer-events: none;
  border: 1px solid rgb(190 24 93 / 75%);
  background: rgb(244 114 182 / 16%);
}

.developer-box-overlay.owned {
  border-color: rgb(37 99 235 / 75%);
  background: rgb(96 165 250 / 16%);
}

.developer-box-overlay.line-start-reservation {
  border-color: rgb(147 51 234 / 75%);
  background: rgb(192 132 252 / 16%);
}

.developer-box-overlay.martyria-shift {
  border-color: rgb(217 119 6 / 80%);
  background: rgb(251 191 36 / 16%);
}

.developer-box-overlay.lyric-collision {
  border-color: rgb(22 163 74 / 80%);
  background: rgb(74 222 128 / 16%);
}

.developer-overlay-box.ink {
  border-color: #ef4444;
}

.developer-overlay-box.lyric {
  border-color: #16a34a;
}

.developer-overlay-box.collision {
  border-color: #f59e0b;
}

.adjustment-ratio {
  pointer-events: none;
  white-space: nowrap;
  font-variant-numeric: lining-nums tabular-nums;
}

.lyrics {
  min-height: 1.6rem;
  text-align: center;
  position: relative;
}

.header-footer-hr {
  position: absolute;
  border-top-style: solid;
}

.line {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
}

.element-box {
  position: absolute;
}

.neume-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  position: relative;
}

.lyrics-container {
  min-height: 1.6rem;
  min-width: 100%;
  text-align: center;
  position: absolute;
  white-space: nowrap;
}

.leading-lyric-hyphen {
  position: absolute;
  pointer-events: none;
}

.melisma {
  position: absolute;
  display: inline;
  overflow: hidden !important;
  white-space: pre;
}

.melisma-underscore {
  /* Anchor to the rendered baseline without changing lyric alignment. */
  display: inline-block;
  width: 0;
  height: 0;
}

.melisma.full {
  left: 0;
}

.melisma.fullRtl {
  right: 0;
}

.melisma-hyphen {
  position: absolute;
}

.melisma-inner {
  /* The static position follows the baseline anchor. Keep the containing
     block at lyrics-container so full melismas can start at its left edge. */
  position: absolute;
  height: 0;
  transform: translateY(-100%);
}

.melisma-text {
  opacity: 0.5;
}

.page.print .empty-neume-box {
  visibility: hidden;
}

.page.print .text-box-container,
.page.print .rich-text-box-container,
.page.print .drop-cap-container,
.page.print .mode-key-container,
.page.print .image-box-container,
.page.print .selectedAnnotation,
.page.print .selectedAlternateLine,
.page.print .element-box :deep(.text-box),
.page.print .element-box :deep(.rich-text-editor),
.page.print .element-box :deep(.inline-container),
.page.print .element-box :deep(.text-box.multipanel) {
  border: none;
  outline: none;
}

.page.print .page-break,
.page.print .line-break,
.page.print .page-break-2,
.page.print .line-break-2,
.page.print .keep-with-next,
.page.print .element-box :deep(.handle),
.page.print .element-box :deep(.ck-widget__type-around) {
  display: none !important;
}

.page.print .element-box :deep(.ck-widget) {
  outline: none !important;
}

.page.print .neume-box .selected {
  background-color: initial;
}

.page.print .melisma-text {
  opacity: 1;
}

.page.print .element-box :deep(.rich-text-editor) {
  overflow: visible !important;
}

.lyrics:focus {
  outline: none;
}

.neume-box .selected {
  background-color: rgb(238, 232, 170, 0.7);
}

.neume-box .audio-selected {
  background-color: rgba(152, 251, 152, 0.5);
}

.selectedTextbox {
  outline: 1px solid goldenrod;
}

.selectedTextbox:deep(.handle) {
  display: inline;
}

.selectedImagebox {
  border: 1px solid goldenrod;
}

.selectedAlternateLine {
  outline: 1px solid goldenrod;
}

.selectedLyrics {
  border: 1px solid goldenrod;
}

.selectedMelisma {
  display: none;
}

.keep-with-next {
  position: absolute;
  top: calc(-10px * var(--zoom, 1));
}

.keep-with-next > svg {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

.page-break {
  position: absolute;
  top: calc(-10px * var(--zoom, 1));
}

.page-break > svg {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

.line-break {
  position: absolute;
  top: calc(-10px * var(--zoom, 1));
}

.line-break > svg {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

.page-break-2 {
  position: absolute;
  top: calc(-16px * var(--zoom, 1));
}

.page-break-2 > svg {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

.line-break-2 {
  position: absolute;
  top: calc(-18px * var(--zoom, 1));
}

.line-break-2 > svg {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

@media print {
  .empty-neume-box {
    visibility: hidden;
  }

  .text-box-container {
    border: none;
    outline: none;
  }

  .drop-cap-container {
    border: none;
    outline: none;
  }

  .mode-key-container {
    border: none;
    outline: none;
  }

  .image-box-container {
    border: none;
    outline: none;
  }

  .selectedLyrics {
    border: none;
    outline: none;
  }

  .melisma-text {
    opacity: 1;
  }
}

@media print {
  .page-break,
  .line-break,
  .page-break-2,
  .line-break-2,
  .keep-with-next {
    display: none !important;
  }
}
</style>
