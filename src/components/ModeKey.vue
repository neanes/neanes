<template>
  <div
    class="mode-key-container"
    :style="style"
    @click="$emit('select-single')"
  >
    <span class="mode-key-main" :style="mainStyle">
      <span class="mode-key-signature" :dir="resolution.flowDirection">
        <span
          class="sr-only"
          :lang="resolution.structure.languageId"
          :dir="resolution.flowDirection"
          >{{ resolution.pronunciation }}</span
        >
        <template v-for="(run, index) in resolution.runs" :key="index">
          <span
            v-if="runLayouts[index].separatorBefore.kind !== 'none'"
            class="mode-key-separator"
            :style="getSeparatorStyle(run, runLayouts[index].separatorBefore)"
            aria-hidden="true"
            >{{
              runLayouts[index].separatorBefore.kind === 'wordSpace' ? ' ' : ''
            }}</span
          >
          <span
            v-if="run.kind === 'glyph'"
            class="mode-key-run"
            :style="getRunStyle(run, runLayouts[index])"
            aria-hidden="true"
          >
            <template v-for="neume in run.glyphs" :key="neume">
              <Neume :neume="neume" aria-hidden="true" />
            </template>
          </span>
          <span
            v-else-if="run.kind === 'text' && run.content.layout === 'inline'"
            class="mode-key-run"
            :lang="run.languageTag"
            :dir="run.direction"
            :style="getRunStyle(run, runLayouts[index])"
            aria-hidden="true"
            >{{ run.content.text }}</span
          >
          <span
            v-else-if="run.kind === 'startingPitch'"
            class="mode-key-run starting-pitch"
            :style="getRunStyle(run, runLayouts[index])"
            ><template
              v-for="[role, pitchNote] in [
                ['primary', run.cluster.primary],
                ['secondary', run.cluster.secondary],
              ] as const"
              :key="role"
            >
              <span
                v-if="pitchNote != null"
                class="starting-pitch-note"
                :style="getPitchCellStyle(runLayouts[index], role)"
              >
                <span
                  :dir="run.noteText.direction"
                  :style="getPitchTextStyle(run, runLayouts[index], role)"
                  >{{ run.noteText.names[pitchNote.note] }}</span
                >
                <span
                  v-if="pitchNote.fthoraAbove != null"
                  class="pitch-mark"
                  :style="getPitchMarkStyle(runLayouts[index], role, 'fthora')"
                >
                  <Neume
                    :neume="pitchNote.fthoraAbove"
                    :style="getPitchGlyphStyle(run, runLayouts[index])"
                  />
                </span>
                <span
                  v-if="pitchNote.quantitativeNeumeAbove != null"
                  class="pitch-mark"
                  :style="
                    getPitchMarkStyle(runLayouts[index], role, 'quantitative')
                  "
                >
                  <Neume
                    :neume="pitchNote.quantitativeNeumeAbove"
                    :style="getPitchGlyphStyle(run, runLayouts[index])"
                  />
                </span>
              </span>
              <span
                v-if="
                  role === 'primary' &&
                  run.cluster.primary != null &&
                  run.cluster.secondary != null
                "
                class="pitch-cluster-separator"
                :style="
                  getFixedSeparatorStyle(
                    run,
                    runLayouts[index].pitch!.clusterSeparatorWidth,
                  )
                "
                aria-hidden="true"
              />
            </template>
            <span
              v-if="
                hasPitchNote(run.cluster) &&
                run.cluster.trailingGlyphs.length > 0
              "
              class="pitch-trailing-glue"
              :style="getPitchTrailingGlueStyle(runLayouts[index])"
              aria-hidden="true"
            />
            <Neume
              v-for="neume in run.cluster.trailingGlyphs"
              :key="neume"
              :neume="neume"
              :style="getTrailingPitchGlyphStyle(run, runLayouts[index])"
            />
          </span>
          <template
            v-else-if="run.kind === 'text' && run.content.layout === 'stacked'"
          >
            <span
              class="mode-key-run mode-key-stacked-text"
              :style="getStackedTextStyle(run, runLayouts[index])"
              aria-hidden="true"
            >
              <span
                v-for="(line, lineIndex) in run.content.lines"
                :key="lineIndex"
                :style="getStackedTextRowStyle(runLayouts[index], lineIndex)"
                aria-hidden="true"
                >{{ line }}</span
              >
            </span>
          </template>
        </template>
        <span
          v-if="layout.trailingSeparator.kind !== 'none'"
          class="mode-key-separator"
          :style="
            getFixedSeparatorStyle(
              resolution.runs[resolution.runs.length - 1],
              layout.trailingSeparator.width,
            )
          "
          aria-hidden="true"
        />
      </span>
      <Neume
        v-if="
          element.tempo != null && (!element.tempoAlignRight || element.inline)
        "
        :neume="element.tempo"
        :style="tempoStyle"
      />
    </span>
    <span
      ref="rightContainer"
      class="right-container"
      :style="rightContainerStyle"
    >
      <span
        class="mode-key-baseline-strut"
        :style="baselineStrutStyle"
        aria-hidden="true"
      />
      <span
        v-if="element.showAmbitus && !element.inline"
        class="ambitus"
        :style="ambitusContainerStyle"
      >
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
        v-if="
          element.tempo != null && element.tempoAlignRight && !element.inline
        "
        :neume="element.tempo"
        :style="tempoStyle"
      />
    </span>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties, PropType, StyleValue } from 'vue';
import { computed, onMounted, ref } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
import { useResizeObserver } from '@/composables/useResizeObserver';
import { type ModeKeyElement, TextBoxAlignment } from '@/models/Element';
import type {
  InitialMartyriaRunLayout,
  InitialMartyriaSeparatorLayout,
} from '@/models/InitialMartyriaLayout';
import type {
  InitialMartyriaStartingNoteRun,
  ResolvedInitialMartyriaRun,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import { resolveFontStyle } from '@/utils/fontStyle';
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
});

type TextRun = Extract<ResolvedInitialMartyriaRun, { kind: 'text' }>;
type PitchRole = 'primary' | 'secondary';

// The layout service measures every element before it is rendered; this
// component only applies zoom to what it stored.
const layout = computed(() => props.element.computedInitialMartyriaLayout!);
const resolution = computed(() => layout.value.resolution);
const runLayouts = computed(() => layout.value.runs);
const neumeFontFamily = computed(() => props.element.computedFontFamily);
const baseTextAppearance = computed(() => layout.value.mainAppearance);
const rightContainer = ref<HTMLElement | null>(null);
const rightAccessoryWidth = ref(0);
const { observe: observeRightAccessory } = useResizeObserver();
// Keep the CSS line box anchored by the explicit baseline strut rather than
// by zoom-dependent font metrics from any visible signature run.
const baselineFlowGuard = computed(() => props.element.height);

const mainStyle = computed(() => {
  const verticalClipMargin = withZoom(-props.element.height);
  return {
    position: 'relative',
    top: withZoom(props.element.computedFlowTop - props.element.computedTop),
    clipPath:
      props.element.alignment === TextBoxAlignment.Right
        ? undefined
        : `inset(${verticalClipMargin} ${rightAccessoryWidth.value}px ${verticalClipMargin} 0)`,
  } as CSSProperties;
});

const rightContainerStyle = computed(() => ({
  top: withZoom(
    props.element.computedFlowTop -
      props.element.computedTop -
      baselineFlowGuard.value,
  ),
}));

const baselineStrutStyle = computed(() => ({
  height: withZoom(
    Math.max(0, -props.element.computedFlowTop) + baselineFlowGuard.value,
  ),
}));

onMounted(() => {
  if (rightContainer.value == null) {
    return;
  }

  const updateRightAccessoryWidth = () => {
    rightAccessoryWidth.value = rightContainer.value?.offsetWidth ?? 0;
  };

  observeRightAccessory(rightContainer.value, updateRightAccessoryWidth);
  updateRightAccessoryWidth();
});

const style = computed(() => {
  return {
    color: props.element.computedColor,
    fontFamily: props.element.computedFontFamily,
    fontSize: withZoom(props.element.computedFontSize),
    textAlign: props.element.alignment,
    width: withZoom(props.element.width),
    height: withZoom(props.element.height),
    webkitTextStrokeWidth: withZoom(props.element.computedStrokeWidth),
  } as StyleValue;
});

const tempoStyle = computed(() => {
  const style = {
    color: props.pageSetup.tempoDefaultColor,
    fontSize: withZoom(layout.value.accessory.fontSize),
    lineHeight: 'normal',
    webkitTextStrokeWidth: withZoom(props.pageSetup.tempoDefaultStrokeWidth),
    top: withZoom(layout.value.accessory.baselineOffset),
    marginLeft: withZoom(8),
  } as StyleValue;

  return style;
});

const ambitusStyle = computed(() => {
  const neumeFont = resolveFontStyle(neumeFontFamily.value, DEFAULT_FONT_STYLE);
  const style = {
    color: props.pageSetup.martyriaDefaultColor,
    fontFamily: neumeFont.cssFontFamily,
    fontSize: withZoom(layout.value.accessory.fontSize),
    fontStyle: neumeFont.cssFontStyle,
    fontWeight: neumeFont.cssFontWeight,
    webkitTextStrokeWidth: withZoom(props.pageSetup.martyriaDefaultStrokeWidth),
    position: 'relative',
    top: withZoom(layout.value.accessory.baselineOffset),
  } as CSSProperties;

  return style;
});

const ambitusContainerStyle = computed(() => {
  const appearance = baseTextAppearance.value;
  const font = resolveFontStyle(appearance.fontFamily, appearance.fontStyle);

  return {
    color: appearance.color,
    fontFamily: font.cssFontFamily,
    fontSize: withZoom(appearance.fontSize),
    fontStyle: font.cssFontStyle,
    fontWeight: font.cssFontWeight,
    fontVariantCaps: appearance.fontVariantCaps,
    fontVariantNumeric: appearance.fontVariantNumeric,
    fontVariantLigatures: appearance.fontVariantLigatures,
    fontVariantAlternates: appearance.fontVariantAlternates,
    lineHeight: 'normal',
    webkitTextStrokeColor: appearance.strokeColor,
    webkitTextStrokeWidth: withZoom(appearance.strokeWidth),
  } as CSSProperties;
});

// The ambitus layout is only stored when the ambitus is drawn.
const ambitusStyleLow = computed(
  () =>
    ({
      ...ambitusStyle.value,
      marginLeft: withZoom(layout.value.ambitus!.lowMarginLeft),
      marginRight: withZoom(10),
    }) as CSSProperties,
);

const ambitusStyleHigh = computed(
  () =>
    ({
      ...ambitusStyle.value,
      marginLeft: withZoom(10),
      marginRight: withZoom(layout.value.ambitus!.highMarginRight),
    }) as CSSProperties,
);

function getRunStyle(
  run: ResolvedInitialMartyriaRun,
  runLayout: InitialMartyriaRunLayout,
) {
  const appearance = run.appearance;
  const isGlyph = run.kind === 'glyph';
  const isText = run.kind === 'text';
  const font = resolveFontStyle(appearance.fontFamily, appearance.fontStyle);
  return {
    color: isGlyph ? undefined : appearance.color,
    fontFamily: font.cssFontFamily,
    fontSize: withZoom(runLayout.fontSize),
    fontStyle: font.cssFontStyle,
    fontWeight: font.cssFontWeight,
    fontVariantCaps: isText ? appearance.fontVariantCaps : undefined,
    fontVariantNumeric: isText ? appearance.fontVariantNumeric : undefined,
    fontVariantLigatures: isText ? appearance.fontVariantLigatures : undefined,
    fontVariantAlternates: isText
      ? appearance.fontVariantAlternates
      : undefined,
    webkitTextStrokeColor: isGlyph ? undefined : appearance.strokeColor,
    webkitTextStrokeWidth: isGlyph
      ? undefined
      : withZoom(appearance.strokeWidth),
    top:
      runLayout.baselineShift === 0 ||
      (run.kind === 'text' && run.content.layout === 'stacked')
        ? undefined
        : withZoom(-runLayout.baselineShift),
    direction: run.direction,
    unicodeBidi: 'isolate',
  } as CSSProperties;
}

function getSeparatorStyle(
  run: ResolvedInitialMartyriaRun,
  separator: InitialMartyriaSeparatorLayout,
) {
  if (separator.kind === 'wordSpace') {
    const wordSpaceFont = separator.wordSpaceFont!;
    const font = resolveFontStyle(
      wordSpaceFont.fontFamily,
      wordSpaceFont.fontStyle,
    );
    return {
      fontFamily: font.cssFontFamily,
      fontStyle: font.cssFontStyle,
      fontWeight: font.cssFontWeight,
      fontSize: withZoom(wordSpaceFont.fontSize),
      direction: run.direction,
    } as CSSProperties;
  }
  return getFixedSeparatorStyle(run, separator.width);
}

function getFixedSeparatorStyle(
  run: ResolvedInitialMartyriaRun,
  width: number,
) {
  return {
    display: 'inline-block',
    width: withZoom(width),
    direction: run.direction,
  } as CSSProperties;
}

function getStackedTextStyle(
  run: TextRun,
  runLayout: InitialMartyriaRunLayout,
) {
  const { geometry } = runLayout.stackedText!;
  const style = getRunStyle(run, runLayout);
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

function getStackedTextRowStyle(
  runLayout: InitialMartyriaRunLayout,
  index: number,
) {
  const { geometry, lineHeight } = runLayout.stackedText!;
  const row = geometry.rows[index];

  return {
    display: 'block',
    left: withZoom(row.left),
    lineHeight: withZoom(lineHeight),
    position: 'absolute',
    top: withZoom(row.top),
    whiteSpace: 'nowrap',
  } as CSSProperties;
}

function getPitchCellStyle(
  runLayout: InitialMartyriaRunLayout,
  role: PitchRole,
) {
  const geometry = runLayout.pitch![role]!;
  return {
    display: 'inline-block',
    height: withZoom(geometry.bottom - geometry.top),
    position: 'relative',
    verticalAlign: withZoom(-geometry.bottom),
    width: withZoom(geometry.width),
  } as CSSProperties;
}

function getPitchTextStyle(
  run: InitialMartyriaStartingNoteRun,
  runLayout: InitialMartyriaRunLayout,
  role: PitchRole,
) {
  const pitch = runLayout.pitch!;
  const geometry = pitch[role]!;
  const appearance = run.noteText.appearance;
  const font = resolveFontStyle(appearance.fontFamily, appearance.fontStyle);

  return {
    color: appearance.color,
    display: 'block',
    left: withZoom(geometry.text.left),
    position: 'absolute',
    top: withZoom(geometry.text.top),
    fontFamily: font.cssFontFamily,
    fontSize: withZoom(pitch.textFontSize),
    fontStyle: font.cssFontStyle,
    fontWeight: font.cssFontWeight,
    fontVariantCaps: appearance.fontVariantCaps,
    fontVariantNumeric: appearance.fontVariantNumeric,
    fontVariantLigatures: appearance.fontVariantLigatures,
    fontVariantAlternates: appearance.fontVariantAlternates,
    lineHeight: withZoom(pitch.textLineHeight),
    webkitTextStrokeColor: appearance.strokeColor,
    webkitTextStrokeWidth: withZoom(appearance.strokeWidth),
    whiteSpace: 'nowrap',
  } as CSSProperties;
}

function getPitchMarkStyle(
  runLayout: InitialMartyriaRunLayout,
  role: PitchRole,
  kind: 'fthora' | 'quantitative',
) {
  const placement = runLayout.pitch![role]![kind]!;
  return {
    left: withZoom(placement.left),
    position: 'absolute',
    top: withZoom(placement.top),
  } as CSSProperties;
}

function getPitchGlyphStyle(
  run: InitialMartyriaStartingNoteRun,
  runLayout: InitialMartyriaRunLayout,
) {
  const appearance = run.appearance;
  const font = resolveFontStyle(appearance.fontFamily, appearance.fontStyle);

  return {
    color: appearance.color,
    fontFamily: font.cssFontFamily,
    fontSize: withZoom(runLayout.fontSize),
    fontStyle: font.cssFontStyle,
    fontWeight: font.cssFontWeight,
    webkitTextStrokeColor: appearance.strokeColor,
    webkitTextStrokeWidth: withZoom(appearance.strokeWidth),
  } as CSSProperties;
}

function getTrailingPitchGlyphStyle(
  run: InitialMartyriaStartingNoteRun,
  runLayout: InitialMartyriaRunLayout,
) {
  return {
    ...getPitchGlyphStyle(run, runLayout),
    position: 'relative',
    top: withZoom(layout.value.neumeBaselineCorrection),
  } as CSSProperties;
}

function hasPitchNote(cluster: InitialMartyriaStartingNoteRun['cluster']) {
  return cluster.primary != null || cluster.secondary != null;
}

function getPitchTrailingGlueStyle(runLayout: InitialMartyriaRunLayout) {
  return {
    display: 'inline-block',
    width: withZoom(runLayout.pitch!.trailingGlueWidth),
  } as CSSProperties;
}
</script>

<style scoped>
.mode-key-container {
  outline: 1px dotted black;
  box-sizing: border-box;
  line-height: normal;
  user-select: none;

  position: relative;
}

.right-container {
  line-height: 0;
  position: absolute;
  top: 0;
  right: 0;
  white-space: nowrap;
}

.mode-key-main {
  display: block;
  overflow-x: clip;
  overflow-y: visible;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mode-key-baseline-strut {
  display: inline-block;
  width: 0;
  vertical-align: baseline;
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
}
</style>
