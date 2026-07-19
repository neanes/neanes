<template>
  <div
    class="mode-key-container"
    :style="style"
    @click="$emit('select-single')"
  >
    <span class="mode-key-main" :style="mainStyle">
      <span class="mode-key-signature" :dir="signatureResolution.flowDirection">
        <template v-for="(run, index) in resolvedRuns" :key="run.componentId">
          <span
            v-if="run.kind === 'glyph'"
            class="mode-key-run"
            :style="getRunStyle(run)"
          >
            <Neume v-for="neume in run.glyphs" :key="neume" :neume="neume" />
          </span>
          <span
            v-else-if="run.kind === 'text' && run.content.layout === 'inline'"
            class="mode-key-run"
            :lang="run.languageTag"
            :dir="run.direction"
            :style="getRunStyle(run)"
            >{{ getTextRunContent(run, index) }}</span
          >
          <span
            v-else-if="run.kind === 'startingPitch'"
            class="mode-key-run starting-pitch"
            :style="getRunStyle(run)"
            ><span
              v-if="getStartingPitchPrefix(index) !== ''"
              :style="getStartingNoteTextStyle(run)"
              >{{ getStartingPitchPrefix(index) }}</span
            >
            <span
              v-for="[role, pitchNote] in [
                ['primary', run.cluster.primary],
                ['secondary', run.cluster.secondary],
              ] as const"
              v-show="pitchNote != null"
              :key="`${run.componentId}-${role}`"
              class="starting-pitch-note"
              :style="getPitchCellStyle(run, pitchNote)"
            >
              <span
                v-if="pitchNote != null"
                :lang="run.noteText.languageTag"
                :dir="run.noteText.direction"
                :style="getPitchTextStyle(run, pitchNote)"
                >{{ run.noteText.names[pitchNote.note] }}</span
              >
              <span
                v-if="pitchNote?.fthoraAbove != null"
                class="pitch-mark"
                :style="getPitchMarkStyle(run, pitchNote, 'fthora')"
              >
                <Neume
                  :neume="pitchNote.fthoraAbove"
                  :style="getPitchGlyphStyle(run)"
                />
              </span>
              <span
                v-if="pitchNote?.quantitativeNeumeAbove != null"
                class="pitch-mark"
                :style="getPitchMarkStyle(run, pitchNote, 'quantitative')"
              >
                <Neume
                  :neume="pitchNote.quantitativeNeumeAbove"
                  :style="getPitchGlyphStyle(run)"
                />
              </span>
            </span>
            <Neume
              v-for="neume in run.cluster.trailingGlyphs"
              :key="neume"
              :neume="neume"
              :style="getPitchGlyphStyle(run)"
            />
          </span>
          <template
            v-else-if="run.kind === 'text' && run.content.layout === 'stacked'"
          >
            <span v-if="hasTextBoundaryBefore(index)">{{ ' ' }}</span>
            <span
              class="mode-key-run mode-key-stacked-text"
              :style="getStackedTextStyle(run)"
            >
              <span
                v-for="(line, lineIndex) in run.content.lines"
                :key="`${run.componentId}-${lineIndex}`"
                :style="getStackedTextRowStyle(run, lineIndex)"
                >{{ line }}</span
              >
            </span>
          </template>
        </template>
      </span>
      <Neume
        v-if="element.tempo != null && !element.tempoAlignRight"
        :neume="element.tempo"
        :style="tempoStyle"
      />
    </span>
    <span ref="rightContainer" class="right-container">
      <span v-if="element.showAmbitus" class="ambitus">
        <span class="ambitus-text">(</span>
        <span class="ambitus-low" :style="ambitusStyleLow">
          <Neume :neume="element.ambitusLowNote" />
          <Neume :neume="element.ambitusLowRootSign" />
        </span>
        <span class="ambitus-text">-</span>
        <span class="ambitus-high" :style="ambitusStyleHigh">
          <Neume :neume="element.ambitusHighNote" />
          <Neume :neume="element.ambitusHighRootSign" />
        </span>
        <span class="ambitus-text">)</span>
      </span>

      <Neume
        v-if="element.tempo != null && element.tempoAlignRight"
        :neume="element.tempo"
        :style="tempoStyle"
      />
    </span>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties, PropType, StyleValue } from 'vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
import { type ModeKeyElement, TextBoxAlignment } from '@/models/Element';
import {
  getInitialMartyriaContext,
  type InitialMartyriaStyle,
  type ResolvedInitialMartyriaRun,
  resolveInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { fontService } from '@/services/FontService';
import {
  measureInitialMartyriaPitchGeometry,
  resolveInitialMartyriaPitchFontSizes,
} from '@/services/InitialMartyriaPitchMeasurementService';
import { measureInitialMartyriaStackedText } from '@/services/InitialMartyriaStackedTextMeasurementService';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { resolveFontCss, resolveFontStyle } from '@/utils/fontStyle';
import { withZoom } from '@/utils/withZoom';

defineEmits(['select-single']);
const props = defineProps({
  element: {
    type: Object as PropType<ModeKeyElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  initialMartyriaStyles: {
    type: Array as PropType<InitialMartyriaStyle[]>,
    default: () => [],
  },
  paragraphStyles: {
    type: Array as PropType<ParagraphStyle[]>,
    default: () => [],
  },
});

const signatureResolution = computed(() =>
  resolveInitialMartyriaStyle({
    context: getInitialMartyriaContext(props.element),
    activeStyleId: props.pageSetup.initialMartyriaStyleId,
    styles: props.initialMartyriaStyles,
    paragraphStyles: props.paragraphStyles,
    pageSetup: props.pageSetup,
  }),
);
const resolvedRuns = computed(() => signatureResolution.value.runs);
const neumeFontFamily = computed(
  () =>
    props.element.computedFontFamily || props.pageSetup.neumeDefaultFontFamily,
);
const neumeFontSize = computed(
  () =>
    props.element.computedFontSize || props.pageSetup.modeKeyDefaultFontSize,
);
const matchedNeumeFontSize = computed(() => {
  const textRun = resolvedRuns.value.find((run) => run.kind === 'text');

  if (textRun == null || textRun.kind !== 'text') {
    return null;
  }

  const textFontSize = textRun.appearance.fontSize ?? neumeFontSize.value;
  const textFont = resolveFontCss({
    fontFamily: textRun.appearance.fontFamily ?? neumeFontFamily.value,
    fontStyle: textRun.appearance.fontStyle ?? '',
    fontSize: textFontSize,
  });
  const textCapitalHeight = TextMeasurementService.getTextHeight('H', textFont);
  const capitalHeight = fontService.getMetrics(
    neumeFontFamily.value,
  ).capitalHeight;

  if (
    !Number.isFinite(textCapitalHeight) ||
    !Number.isFinite(capitalHeight) ||
    capitalHeight <= 0
  ) {
    return null;
  }

  return textCapitalHeight / capitalHeight;
});
const rightContainer = ref<HTMLElement | null>(null);
const rightAccessoryWidth = ref(0);
let rightAccessoryResizeObserver: ResizeObserver | null = null;

const mainStyle = computed(
  () =>
    ({
      clipPath:
        props.element.alignment === TextBoxAlignment.Right
          ? undefined
          : `inset(0 ${rightAccessoryWidth.value}px 0 0)`,
    }) as CSSProperties,
);

onMounted(() => {
  if (rightContainer.value == null) {
    return;
  }

  const updateRightAccessoryWidth = () => {
    rightAccessoryWidth.value = rightContainer.value?.offsetWidth ?? 0;
  };

  rightAccessoryResizeObserver = new ResizeObserver(updateRightAccessoryWidth);
  rightAccessoryResizeObserver.observe(rightContainer.value);
  updateRightAccessoryWidth();
});

onBeforeUnmount(() => {
  rightAccessoryResizeObserver?.disconnect();
});

const style = computed(() => {
  return {
    color: props.element.computedColor,
    fontFamily:
      props.element.computedFontFamily ||
      props.pageSetup.neumeDefaultFontFamily,
    fontSize: withZoom(
      props.element.computedFontSize || props.pageSetup.modeKeyDefaultFontSize,
    ),
    textAlign: props.element.alignment,
    width: withZoom(props.element.width),
    height: withZoom(props.element.height),
    webkitTextStrokeWidth: withZoom(props.element.computedStrokeWidth),
  } as StyleValue;
});

const tempoStyle = computed(() => {
  // TODO figure out a way to remove the hard-coded -.45em
  // maybe put it in the font metadata json?
  const style = {
    color: props.pageSetup.tempoDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.tempoDefaultStrokeWidth),
    top: '-0.45em',
    marginLeft: withZoom(8),
  } as StyleValue;

  return style;
});

const ambitusStyle = computed(() => {
  // TODO figure out a way to remove the hard-coded -.45em
  // maybe put it in the font metadata json?
  const style = {
    color: props.pageSetup.martyriaDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.martyriaDefaultStrokeWidth),
    position: 'relative',
    top: '-0.45em',
  } as CSSProperties;

  return style;
});

const ambitusStyleLow = computed(() => {
  const text = [props.element.ambitusLowNote, props.element.ambitusLowRootSign]
    .map((neume) => NeumeMappingService.getMapping(neume).text)
    .join('');
  const font = `${props.element.computedFontSize}px ${props.element.computedFontFamily}`;

  const bounds = TextMeasurementService.getInkBounds(text, font);

  const style = {
    ...ambitusStyle.value,
    marginLeft: withZoom(4 - bounds.inkLeft),
    marginRight: withZoom(10),
  } as CSSProperties;

  return style;
});

const ambitusStyleHigh = computed(() => {
  const text = [
    props.element.ambitusHighNote,
    props.element.ambitusHighRootSign,
  ]
    .map((neume) => NeumeMappingService.getMapping(neume).text)
    .join('');
  const font = `${props.element.computedFontSize}px ${props.element.computedFontFamily}`;

  const bounds = TextMeasurementService.getInkBounds(text, font);

  const style = {
    ...ambitusStyle.value,
    marginLeft: withZoom(10),
    marginRight: withZoom(4 - (bounds.advanceWidth - bounds.inkRight)),
  } as CSSProperties;

  return style;
});

function getRunStyle(run: ResolvedInitialMartyriaRun) {
  const appearance = run.appearance;
  const font = resolveFontStyle(
    appearance.fontFamily || neumeFontFamily.value,
    appearance.fontStyle,
  );
  const renderedNeumeFontSize =
    (run.kind === 'glyph' || run.kind === 'startingPitch') &&
    appearance.fontSize != null
      ? appearance.fontSize
      : (matchedNeumeFontSize.value ?? neumeFontSize.value);
  const baselineShift =
    (appearance.baselineShift ?? 0) +
    (run.kind === 'text'
      ? (fontService.getMetrics(neumeFontFamily.value)
          .initialMartyriaBaseline ?? 0) * renderedNeumeFontSize
      : 0);

  return {
    color: appearance.color,
    fontFamily: font.cssFontFamily,
    fontSize:
      run.kind === 'glyph' || run.kind === 'startingPitch'
        ? withZoom(renderedNeumeFontSize)
        : appearance.fontSize == null
          ? undefined
          : withZoom(appearance.fontSize),
    fontStyle: font.cssFontStyle,
    fontWeight: font.cssFontWeight,
    webkitTextStrokeColor: appearance.strokeColor,
    webkitTextStrokeWidth:
      appearance.strokeWidth == null
        ? undefined
        : withZoom(appearance.strokeWidth),
    top:
      baselineShift === 0 ||
      (run.kind === 'text' && run.content.layout === 'stacked')
        ? undefined
        : withZoom(-baselineShift),
    insetInlineStart:
      appearance.offsetInline == null
        ? undefined
        : withZoom(appearance.offsetInline),
    marginInlineStart:
      appearance.spacingBefore == null
        ? undefined
        : withZoom(appearance.spacingBefore),
    marginInlineEnd:
      appearance.spacingAfter == null
        ? undefined
        : withZoom(appearance.spacingAfter),
    direction: run.direction,
    unicodeBidi: 'isolate',
  } as CSSProperties;
}

function getStackedTextGeometry(run: TextRun) {
  if (run.content.layout !== 'stacked') {
    throw new Error('Expected stacked text run');
  }
  const appearance = run.appearance;
  const fontSize = appearance.fontSize ?? neumeFontSize.value;
  const baselineShift =
    (appearance.baselineShift ?? 0) +
    (fontService.getMetrics(neumeFontFamily.value).initialMartyriaBaseline ??
      0) *
      (matchedNeumeFontSize.value ?? neumeFontSize.value);

  return measureInitialMartyriaStackedText(run.content.lines, {
    fontFamily: appearance.fontFamily || neumeFontFamily.value,
    fontStyle: appearance.fontStyle,
    fontSize,
    strokeWidth: appearance.strokeWidth,
    gap: run.content.gap,
    baselineShift,
  });
}

function getStackedTextStyle(run: TextRun) {
  const geometry = getStackedTextGeometry(run);
  const style = getRunStyle(run);
  const height = geometry.bottom - geometry.top;

  return {
    ...style,
    display: 'inline-block',
    height: withZoom(height),
    position: 'relative',
    verticalAlign: withZoom(-geometry.bottom),
    width: withZoom(geometry.width),
  } as CSSProperties;
}

function getStackedTextRowStyle(run: TextRun, index: number) {
  const geometry = getStackedTextGeometry(run);
  const row = geometry.rows[index];

  return {
    display: 'block',
    left: withZoom(row.left),
    lineHeight: withZoom(
      TextMeasurementService.getFontHeight(
        resolveFontCss({
          fontFamily: run.appearance.fontFamily || neumeFontFamily.value,
          fontStyle: resolveFontStyle(
            run.appearance.fontFamily || neumeFontFamily.value,
            run.appearance.fontStyle,
          ).cssFontStyle,
          fontSize: run.appearance.fontSize ?? neumeFontSize.value,
        }),
      ),
    ),
    position: 'absolute',
    top: withZoom(row.top),
    whiteSpace: 'nowrap',
  } as CSSProperties;
}

function getStartingNoteTextStyle(
  run: Extract<ResolvedInitialMartyriaRun, { kind: 'startingPitch' }>,
) {
  const appearance = run.noteText.appearance;
  const font = resolveFontStyle(
    appearance.fontFamily || neumeFontFamily.value,
    appearance.fontStyle,
  );
  const renderedNeumeFontSize =
    run.glyphAppearance.fontSize ??
    matchedNeumeFontSize.value ??
    neumeFontSize.value;
  const baselineShift =
    (appearance.baselineShift ?? 0) +
    (fontService.getMetrics(neumeFontFamily.value).initialMartyriaBaseline ??
      0) *
      renderedNeumeFontSize;

  return {
    color: appearance.color,
    position: 'relative',
    fontFamily: font.cssFontFamily,
    fontSize:
      appearance.fontSize == null ? undefined : withZoom(appearance.fontSize),
    fontStyle: font.cssFontStyle,
    fontWeight: font.cssFontWeight,
    webkitTextStrokeColor: appearance.strokeColor,
    webkitTextStrokeWidth:
      appearance.strokeWidth == null
        ? undefined
        : withZoom(appearance.strokeWidth),
    top: baselineShift === 0 ? undefined : withZoom(-baselineShift),
  } as CSSProperties;
}

type StartingPitchRun = Extract<
  ResolvedInitialMartyriaRun,
  { kind: 'startingPitch' }
>;
type TextRun = Extract<ResolvedInitialMartyriaRun, { kind: 'text' }>;
type StartingPitchNote = NonNullable<StartingPitchRun['cluster']['primary']>;

function getPitchGeometry(run: StartingPitchRun, pitchNote: StartingPitchNote) {
  const textAppearance = run.noteText.appearance;
  const glyphAppearance = run.glyphAppearance;
  const fontSizes = resolveInitialMartyriaPitchFontSizes({
    textFontFamily: textAppearance.fontFamily || neumeFontFamily.value,
    textFontStyle: textAppearance.fontStyle,
    textFontSize: textAppearance.fontSize,
    glyphFontSize: glyphAppearance.fontSize,
    matchedNeumeFontSize: matchedNeumeFontSize.value,
    neumeFontFamily: neumeFontFamily.value,
    neumeFontSize: neumeFontSize.value,
  });
  return measureInitialMartyriaPitchGeometry(
    pitchNote,
    run.noteText.names[pitchNote.note],
    {
      textFontFamily: textAppearance.fontFamily || neumeFontFamily.value,
      textFontStyle: textAppearance.fontStyle,
      textFontSize: fontSizes.textFontSize,
      glyphFontFamily: glyphAppearance.fontFamily || neumeFontFamily.value,
      glyphFontStyle: glyphAppearance.fontStyle,
      glyphFontSize: fontSizes.glyphFontSize,
      textStrokeWidth: textAppearance.strokeWidth,
      glyphStrokeWidth: glyphAppearance.strokeWidth,
      baselineShift: getStartingNoteBaselineShift(run),
    },
  );
}

function getPitchCellStyle(
  run: StartingPitchRun,
  pitchNote: StartingPitchNote | null,
) {
  if (pitchNote == null) {
    return undefined;
  }
  const geometry = getPitchGeometry(run, pitchNote);
  return {
    display: 'inline-block',
    height: withZoom(geometry.bottom - geometry.top),
    position: 'relative',
    verticalAlign: withZoom(-geometry.bottom),
    width: withZoom(geometry.width),
  } as CSSProperties;
}

function getPitchTextStyle(
  run: StartingPitchRun,
  pitchNote: StartingPitchNote,
) {
  const geometry = getPitchGeometry(run, pitchNote);
  return {
    ...getStartingNoteTextStyle(run),
    left: withZoom(geometry.text.left),
    position: 'absolute',
    top: withZoom(geometry.text.top),
  } as CSSProperties;
}

function getPitchMarkStyle(
  run: StartingPitchRun,
  pitchNote: StartingPitchNote,
  kind: 'fthora' | 'quantitative',
) {
  const geometry = getPitchGeometry(run, pitchNote);
  const placement = geometry[kind];
  if (placement == null) {
    return undefined;
  }
  return {
    left: withZoom(placement.left),
    position: 'absolute',
    top: withZoom(placement.top),
  } as CSSProperties;
}

function getStartingNoteBaselineShift(run: StartingPitchRun) {
  const appearance = run.noteText.appearance;
  const renderedNeumeFontSize = resolveInitialMartyriaPitchFontSizes({
    textFontFamily: appearance.fontFamily || neumeFontFamily.value,
    textFontStyle: appearance.fontStyle,
    textFontSize: appearance.fontSize,
    glyphFontSize: run.glyphAppearance.fontSize,
    matchedNeumeFontSize: matchedNeumeFontSize.value,
    neumeFontFamily: neumeFontFamily.value,
    neumeFontSize: neumeFontSize.value,
  }).glyphFontSize;
  return (
    (appearance.baselineShift ?? 0) +
    (fontService.getMetrics(neumeFontFamily.value).initialMartyriaBaseline ??
      0) *
      renderedNeumeFontSize
  );
}

function getPitchGlyphStyle(
  run: Extract<ResolvedInitialMartyriaRun, { kind: 'startingPitch' }>,
) {
  const appearance = run.glyphAppearance;
  const font = resolveFontStyle(
    appearance.fontFamily || neumeFontFamily.value,
    appearance.fontStyle,
  );

  return {
    color: appearance.color,
    fontFamily: font.cssFontFamily,
    fontSize: withZoom(
      appearance.fontSize ?? matchedNeumeFontSize.value ?? neumeFontSize.value,
    ),
    fontStyle: font.cssFontStyle,
    fontWeight: font.cssFontWeight,
    webkitTextStrokeColor: appearance.strokeColor,
    webkitTextStrokeWidth:
      appearance.strokeWidth == null
        ? undefined
        : withZoom(appearance.strokeWidth),
  } as CSSProperties;
}

function getTextRunContent(run: ResolvedInitialMartyriaRun, index: number) {
  if (run.kind !== 'text' || run.content.layout !== 'inline') {
    return '';
  }

  return `${hasTextBoundaryBefore(index) ? ' ' : ''}${run.content.text}`;
}

function getStartingPitchPrefix(index: number) {
  return hasTextBoundaryBefore(index) ? ' ' : '';
}

function hasTextBoundaryBefore(index: number) {
  const previousKind = resolvedRuns.value[index - 1]?.kind;
  return previousKind === 'text' || previousKind === 'startingPitch';
}
</script>

<style scoped>
.mode-key-container {
  border: 1px dotted black;
  box-sizing: border-box;
  line-height: normal;
  user-select: none;

  position: relative;
}

.right-container {
  position: absolute;
  top: 0;
  right: 0;
  white-space: nowrap;
}

.mode-key-main {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mode-key-run {
  position: relative;
}

.mode-key-signature {
  unicode-bidi: isolate;
}

.mode-key-stacked-text {
  position: relative;
}

.starting-pitch-note {
  display: inline-block;
  position: relative;
}

.pitch-mark {
  position: absolute;
}

.ambitus {
  position: relative;
  top: calc(-4px * var(--zoom));
}

.ambitus-text {
  font-family: Arial, Helvetica, sans-serif;
}
</style>
