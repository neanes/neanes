<template>
  <div
    ref="container"
    class="rich-text-box-container"
    :class="{ selected: selected }"
    :style="containerStyle"
    @click="$emit('select-single')"
    @focusin="hasDomFocus = true"
    @focusout="hasDomFocus = false"
  >
    <span class="handle"></span>
    <!--
      Hidden, full-content, unzoomed data-view copy of the box. Flow line
      offsets and printed slice bands are measured from this same DOM shape, so
      cuts are not inferred from CKEditor's separate editing DOM. For an already
      flowed box, exactly one mounted fragment owns the copy for band rendering.
    -->
    <div
      v-if="shouldMountFlowMeasure"
      ref="sliceMeasure"
      class="rich-text-slice-measure ck ck-content"
      :style="sliceMeasureStyle"
    ></div>
    <div
      v-if="element.multipanel"
      class="rich-text-box-multipanel-container"
      :style="multipanelContainerStyle"
    >
      <RichTextEditor
        :key="`left-${editorLanguage}-${contentLanguage}-${paragraphStyleDefinitionKey}`"
        ref="editorLeft"
        class="rich-text-editor multipanel left"
        :owner="element"
        :model-value="contentLeft"
        :config="editorConfig"
        @blur="onBlur"
        @ready="onEditorReadyMultipanelSide"
        @select-neume="emit('select-neume')"
      />
      <RichTextEditor
        :key="`center-${editorLanguage}-${contentLanguage}-${paragraphStyleDefinitionKey}`"
        ref="editorCenter"
        class="rich-text-editor multipanel center"
        :owner="element"
        :model-value="contentCenter"
        :config="editorConfig"
        @blur="onBlur"
        @ready="onEditorReady"
        @select-neume="emit('select-neume')"
      />
      <RichTextEditor
        :key="`right-${editorLanguage}-${contentLanguage}-${paragraphStyleDefinitionKey}`"
        ref="editorRight"
        class="rich-text-editor multipanel right"
        :owner="element"
        :model-value="contentRight"
        :config="editorConfig"
        @blur="onBlur"
        @ready="onEditorReadyMultipanelSide"
        @select-neume="emit('select-neume')"
      />
    </div>
    <div v-else-if="element.inline" class="inline-container">
      <div class="inline-top-container" :style="textBoxTopContainerStyle">
        <div
          class="inline-top-inner-container"
          :style="textBoxTopInnerContainerStyle"
        >
          <RichTextEditor
            :key="`inline-top-${editorLanguage}-${contentLanguage}-${paragraphStyleDefinitionKey}`"
            ref="editor"
            class="rich-text-editor inline-top"
            :style="textBoxStyleTop"
            :owner="element"
            :model-value="content"
            :config="editorConfig"
            @blur="onBlur"
            @ready="onEditorReadyInline"
            @select-neume="emit('select-neume')"
          />
        </div>
      </div>
      <div class="inline-bottom-container" :style="textBoxBottomContainerStyle">
        <RichTextEditor
          :key="`inline-bottom-${editorLanguage}-${contentLanguage}-${paragraphStyleDefinitionKey}`"
          ref="editorBottom"
          class="rich-text-editor inline-bottom"
          :style="textBoxStyleBottom"
          :owner="element"
          :model-value="contentBottom"
          :config="editorConfig"
          @blur="onBlur"
          @ready="onEditorReadyInlineBottom"
          @select-neume="emit('select-neume')"
        />
      </div>
    </div>
    <RichTextEditor
      v-else-if="element.scrollable"
      :key="`scrollable-${editorLanguage}-${contentLanguage}-${paragraphStyleDefinitionKey}`"
      ref="editor"
      class="rich-text-editor single scrollable"
      :owner="element"
      :model-value="content"
      :config="editorConfig"
      :style="textBoxStyle"
      @blur="onBlur"
      @ready="onEditorReady"
      @select-neume="emit('select-neume')"
    />
    <!--
      A flowed-box slice: just this slice's band of lines, never the whole box
      clipped to a window. See the theory-of-operation note above
      boundariesAtLineYs() for why print forbids anything taller.
    -->
    <!-- eslint-disable vue/no-v-html -->
    <div
      v-else-if="fragment != null && (fragment.index > 0 || !editMode)"
      class="rich-text-slice-content ck ck-content"
      :style="sliceContentStyle"
      v-html="bandContent"
    ></div>
    <!-- eslint-enable vue/no-v-html -->
    <RichTextEditor
      v-else
      :key="`single-${editorLanguage}-${contentLanguage}-${paragraphStyleDefinitionKey}`"
      ref="editor"
      class="rich-text-editor single"
      :owner="element"
      :model-value="content"
      :config="editorConfig"
      :style="textBoxStyle"
      @blur="onBlur"
      @data-change="onEditorDataChange"
      @ready="onEditorReady"
      @select-neume="emit('select-neume')"
    />
  </div>
</template>

<script setup lang="ts">
import type { Editor, EditorConfig, FontSizeOption } from 'ckeditor5';
import { debounce, throttle } from 'throttle-debounce';
import type { PropType, StyleValue } from 'vue';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import type { ComponentExposed } from 'vue-component-type-helpers';

import RichTextEditor from '@/components/RichTextEditor.vue';
import {
  type FlowBandRenderCache,
  getFlowBandRenderCache,
} from '@/composables/richTextFlowBandCache';
import { useResizeObserver } from '@/composables/useResizeObserver';
import { useActiveEditorForOwner } from '@/composables/useRichTextEditorRegistry';
import { useRichTextParagraphStyleDefinitions } from '@/composables/useRichTextParagraphStyleDefinitions';
import type InlineEditor from '@/customEditor';
import type {
  RichTextBoxContentKey,
  RichTextBoxElement,
  RichTextBoxFragment,
} from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import {
  getTextBoxParagraphStyleFallbackId,
  type ParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import {
  getFontFamilyWithNeumeFallback,
  getLegacyNeumeFontFamily,
} from '@/utils/getFontFamilyWithFallback';
import type { TokenMetadata, TokenScope } from '@/utils/replaceTokens';
import { replaceTokens } from '@/utils/replaceTokens';
import {
  applyRichTextLanguageToEditor,
  getRichTextLanguage,
  getRichTextLanguageCode,
  getRichTextLanguageDirection,
  hasMeaningfulRichTextEditorContent,
  inferRichTextEditorLanguage,
  inferSharedRichTextEditorLanguage,
  RICH_TEXT_LANGUAGE_OPTIONS,
} from '@/utils/richTextLanguage';
import { Unit } from '@/utils/Unit';
import { getComputedZoom, withZoom } from '@/utils/withZoom';

// Width (px) the platform's classic scrollbar consumes, measured once. Zero on
// platforms with overlay scrollbars (which don't take layout space). Used to
// widen a focused, internally-scrolling flowed box so its scrollbar sits in a
// gutter beside the text instead of overlapping the last column.
let cachedScrollbarWidth: number | null = null;
function getScrollbarWidth(): number {
  if (cachedScrollbarWidth == null) {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll;';
    document.body.appendChild(probe);
    cachedScrollbarWidth = probe.offsetWidth - probe.clientWidth;
    document.body.removeChild(probe);
  }

  return cachedScrollbarWidth;
}

const richTextHeightEpsilon = 0.001;
const richTextLineMeasurementEpsilon = 0.5;
const richTextFlowMeasureSlackLines = 2;
const richTextFlowMeasureMinimumSlackPx = 48;

const emit = defineEmits([
  'update',
  'update:height',
  'update:lineOffsets',
  'measured',
  'select-single',
  'select-neume',
]);
const props = defineProps({
  element: {
    type: Object as PropType<RichTextBoxElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
  paragraphStyles: {
    type: Array as PropType<ParagraphStyle[]>,
    required: true,
  },
  editMode: {
    type: Boolean,
    default: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  metadata: {
    type: Object as PropType<TokenMetadata>,
    default: undefined,
  },
  tokenScope: {
    type: String as PropType<TokenScope>,
    default: 'body',
  },
  recalc: {
    type: Boolean,
    default: false,
  },
  // Additional page-bottom space reserved by layout for footer/rule overflow
  // beyond the configured bottom margin.
  pageBottomOverflowReservation: {
    type: Number,
    default: 0,
  },
  // Bumped by the editor after every layout pass. Layout mutates element
  // geometry (x, y, flowFragments) on the raw score objects, which Vue cannot
  // observe; computeds here that read that geometry reference this prop so
  // they re-evaluate after each pass.
  layoutVersion: {
    type: Number,
    default: 0,
  },
  editorLanguage: {
    type: String,
    default: 'en',
  },
  // When the box is flowed across pages, the slice this instance renders.
  // null means the box is rendered as a single, unsliced piece. The origin
  // slice (index 0) is shown as a clipped editor; continuation slices
  // (index > 0) are shown as read-only clipped content.
  fragment: {
    type: Object as PropType<RichTextBoxFragment | null>,
    default: null,
  },
});

const container = useTemplateRef<HTMLElement>('container');
const sliceMeasure = useTemplateRef<HTMLElement>('sliceMeasure');
let syncedSliceMeasureContent: string | null = null;
// The measure's height when the bands were last cut (null while unlaid-out or
// never cut). The resize observer forces a recut only when the height has
// moved since -- a font load or style reflow -- and falls through to the
// key-guarded cheap path for resizes our own innerHTML sync caused.
let lastFlowBandsMeasureHeight: number | null = null;
const flowMeasureContentVersion = ref(0);
// The HTML for just this slice's band of lines. One mounted fragment computes
// every band and stores them in the shared reactive cache.
const bandContent = computed(() => {
  const currentFragment = props.fragment;

  return currentFragment == null
    ? ''
    : (getFlowBandRenderCache(props.element).contents[currentFragment.index] ??
        '');
});
const editorRef =
  useTemplateRef<ComponentExposed<typeof RichTextEditor>>('editor');
const editorBottom =
  useTemplateRef<ComponentExposed<typeof RichTextEditor>>('editorBottom');
const editorLeft =
  useTemplateRef<ComponentExposed<typeof RichTextEditor>>('editorLeft');
const editorCenter =
  useTemplateRef<ComponentExposed<typeof RichTextEditor>>('editorCenter');
const editorRight =
  useTemplateRef<ComponentExposed<typeof RichTextEditor>>('editorRight');

const focusOnReady = ref(false);
const unmounting = ref(false);
const hasDomFocus = ref(false);
const activeEditor = useActiveEditorForOwner(() => props.element);
const isEditingFocused = computed(
  () => hasDomFocus.value || activeEditor.value != null,
);
const flowBandMeasureOwner = Symbol('rich-text-flow-band-measure-owner');
// Whether this instance won the measure-ownership election (see
// syncFlowBandMeasureOwnership); derived from the shared cache so it can
// never disagree with it.
const ownsFlowBandMeasure = computed(
  () => getFlowBandRenderCache(props.element).owner === flowBandMeasureOwner,
);
const heightBottom = ref(0);
const heightTop = ref(0);
const debouncedReportMeasuredGeometry = debounce(100, reportMeasuredGeometry);
const debouncedSyncFlowMeasureAfterEditorDataChange = debounce(
  50,
  syncFlowMeasureAfterEditorDataChange,
);
const { observe: observeResize } = useResizeObserver();
const { observe: observeInlineTop } = useResizeObserver();
const { observe: observeInlineBottom } = useResizeObserver();
const { observe: observeSliceMeasure } = useResizeObserver();

const htmlElement = computed(() => container.value!);

const activeContentValues = computed(() => {
  if (props.element.multipanel) {
    return [
      props.element.contentLeft,
      props.element.contentCenter,
      props.element.contentRight,
    ];
  }

  if (props.element.inline) {
    return [props.element.content, props.element.contentBottom];
  }

  return [props.element.content];
});

const hasStoredContent = computed(() =>
  activeContentValues.value.some((html) => html.trim() !== ''),
);

const defaultInitialLanguage = computed(() => {
  const storedLanguage = getRichTextLanguage(props.element);

  if (storedLanguage != null) {
    return storedLanguage;
  }

  return !hasStoredContent.value &&
    (props.pageSetup.melkiteRtl || props.pageSetup.numerals === 'easternArabic')
    ? 'ar:rtl'
    : null;
});

const contentLanguage = computed(() => {
  const language =
    getRichTextLanguage(props.element) ?? defaultInitialLanguage.value;

  return language == null ? 'en' : getRichTextLanguageCode(language);
});

const contentTextDirection = computed(() => {
  const language =
    getRichTextLanguage(props.element) ?? defaultInitialLanguage.value;

  return language == null ? 'ltr' : getRichTextLanguageDirection(language);
});

const canMeasureFlowGeometry = computed(
  () => props.tokenScope === 'body' && props.element.canFlowAcrossPages,
);

const canOwnLineOffsets = computed(
  () => props.fragment == null || props.fragment.index === 0,
);

const flowMeasureAvailableHeight = computed(() => {
  // element.y is written by layout on the raw object; layoutVersion is the
  // reactive stand-in that invalidates this computed after each pass. Without
  // it, a box pushed toward the page bottom by edits made above it would keep
  // a stale available height and never start measuring line offsets, so it
  // could never flow.
  void props.layoutVersion;

  return Math.max(
    0,
    props.pageSetup.pageHeight -
      props.element.y -
      props.pageSetup.bottomMargin -
      props.pageBottomOverflowReservation,
  );
});

const flowMeasureHeightSlack = computed(() =>
  Math.max(
    resolvedParagraphStyle.value.fontSize * richTextFlowMeasureSlackLines,
    richTextFlowMeasureMinimumSlackPx,
  ),
);

const shouldMountLineOffsetMeasureForHeight = computed(() => {
  if (props.element.flowFragments.length > 0) {
    return true;
  }

  const availableHeight = flowMeasureAvailableHeight.value;

  if (availableHeight <= richTextHeightEpsilon) {
    return true;
  }

  return props.element.height + flowMeasureHeightSlack.value >= availableHeight;
});

const shouldMeasureLineOffsets = computed(
  () =>
    canMeasureFlowGeometry.value &&
    canOwnLineOffsets.value &&
    shouldMountLineOffsetMeasureForHeight.value,
);

const fallbackParagraphStyleId = computed(() =>
  getTextBoxParagraphStyleFallbackId(props.element.inline),
);

const resolvedParagraphStyle = computed(() =>
  resolveParagraphStyle(props.paragraphStyles, fallbackParagraphStyleId.value),
);

const { paragraphStyleDefinitions, paragraphStyleDefinitionKey } =
  useRichTextParagraphStyleDefinitions(() => props.paragraphStyles);

const editorConfig = computed((): EditorConfig => {
  const fontSizeOptions: FontSizeOption[] = [];

  for (let i = 8; i <= 72; i++) {
    fontSizeOptions.push({
      title: `${i}`,
      model: `${i}pt`,
    });
  }

  // Add a fall back font to each font so that neumes "just work"
  const fonts = props.fonts.map(
    (x) => x + ',' + props.pageSetup.neumeDefaultFontFamily,
  );

  return {
    fontFamily: {
      options: [
        'default',
        'Source Serif' + ',' + props.pageSetup.neumeDefaultFontFamily,
        'GFS Didot' + ',' + props.pageSetup.neumeDefaultFontFamily,
        'Noto Naskh Arabic' + ',' + props.pageSetup.neumeDefaultFontFamily,
        'Old Standard' + ',' + props.pageSetup.neumeDefaultFontFamily,
        'Neanes',
        'NeanesStathisSeries',
        ...fonts,
      ],
    },
    fontSize: {
      supportAllValues: true,
      options: ['default', ...fontSizeOptions],
    },
    language: {
      ui: props.editorLanguage,
      content: contentLanguage.value,
      textPartLanguage: RICH_TEXT_LANGUAGE_OPTIONS,
    },
    style: {
      definitions: paragraphStyleDefinitions.value,
    },
    licenseKey: 'GPL',
    insertNeume: {
      neumeDefaultFontFamily: props.pageSetup.neumeDefaultFontFamily,
      defaultFontSize: resolvedParagraphStyle.value.fontSize,
      defaultFontFamily: resolvedParagraphStyle.value.fontFamily,
    },
  };
});

const content = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.content
    : replaceTokens(
        props.element.content,
        props.metadata,
        TextBoxAlignment.Center,
      );
});

const flowMeasureContent = computed(() => {
  // The version counter is the reactive stand-in for CKEditor's live data.
  void flowMeasureContentVersion.value;

  return getFlowMeasureContent();
});

const contentBottom = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.contentBottom
    : replaceTokens(
        props.element.contentBottom,
        props.metadata,
        TextBoxAlignment.Center,
      );
});

const contentLeft = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.contentLeft
    : replaceTokens(
        props.element.contentLeft,
        props.metadata,
        TextBoxAlignment.Left,
      );
});

const contentCenter = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.contentCenter
    : replaceTokens(
        props.element.contentCenter,
        props.metadata,
        TextBoxAlignment.Center,
      );
});

const contentRight = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.contentRight
    : replaceTokens(
        props.element.contentRight,
        props.metadata,
        TextBoxAlignment.Right,
      );
});

function getSelectedFontSize(editor: Editor): string | undefined {
  const fontSize = editor.model.document.selection.getAttribute('fontSize');
  return typeof fontSize === 'string' ? fontSize : undefined;
}

function getFontSizeInPt(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.trim().match(/^([\d.]+)(pt|px)$/);

  if (match == null) {
    return null;
  }

  const size = Number(match[1]);

  if (!Number.isFinite(size)) {
    return null;
  }

  return match[2] === 'pt' ? size : Unit.toPt(size);
}

function getMinimumFontSizeInEditor(editor: Editor) {
  const sizes: number[] = [];

  sizes.push(Unit.toPt(resolvedParagraphStyle.value.fontSize));

  const selectedFontSize = getSelectedFontSize(editor);

  const selectedFontSizeInPt = getFontSizeInPt(selectedFontSize);

  if (selectedFontSizeInPt != null) {
    sizes.push(selectedFontSizeInPt);
  }

  for (const root of editor.model.document.roots) {
    for (const item of editor.model.createRangeIn(root).getItems()) {
      const fontSize = item.getAttribute('fontSize');

      const fontSizeInPt = getFontSizeInPt(fontSize);

      if (fontSizeInPt != null) {
        sizes.push(fontSizeInPt);
      }
    }
  }

  return `${Math.min(...sizes)}pt`;
}

const containerStyle = computed(() => {
  const style: StyleValue = {
    width: withZoom(props.element.width),
    // When sliced, the container is the slice's clip window: exactly the
    // slice's height. Continuation slices and the unfocused origin slice hide
    // the overflow; the focused origin slice keeps this height and scrolls
    // internally (see the overflow handling below) so the whole box stays
    // editable.
    height: withZoom(
      props.fragment != null ? props.fragment.height : props.element.height,
    ),
    '--ck-content-font-family': getFontFamilyWithNeumeFallback(
      resolvedParagraphStyle.value.fontFamily,
      props.pageSetup.neumeDefaultFontFamily,
    ),
    '--ck-content-neume-font-family': getLegacyNeumeFontFamily(
      props.pageSetup.neumeDefaultFontFamily,
    ),
    '--ck-content-font-size': props.element.inline
      ? `${resolvedParagraphStyle.value.fontSize}px`
      : ckContentFontSize.value, // no zoom because we will apply zooming on the whole editor
    '--ck-content-font-color': resolvedParagraphStyle.value.color,
    '--ck-content-line-height': `${resolvedParagraphStyle.value.lineHeight ?? 'normal'}`,
  };

  if (props.fragment != null) {
    // The child is absolutely positioned (the trimmed band, or -- for the
    // focused origin -- the full-height editor); position:relative makes this
    // container its containing block and the context for the overflow rules
    // below.
    style.position = 'relative';

    if (props.fragment.isLast) {
      // The last slice ends at the content end, so there is no following line
      // to clip away. Leave its bottom unclipped: if the editing-view height the
      // slice was sized from slightly under-measures the data-view band actually
      // rendered (e.g. widgets or an empty trailing paragraph lay out a hair
      // taller), the final line(s) spill past the slice box rather than being
      // hidden. Interior slices below stay clipped so a slice never reveals a
      // sliver of the next slice's first line.
    } else if (props.fragment.index > 0 || !isEditingFocused.value) {
      // Continuation slices, and the origin while not being edited, show only
      // their band. This overflow:hidden is a SCREEN-only trim hiding sub-pixel
      // jitter at the seam; in print the global `body * { overflow: visible }`
      // rule intentionally lifts it -- see the @media print note at the bottom
      // of this file.
      style.overflow = 'hidden';
    } else {
      // The origin slice while focused. The box flows across pages, so its
      // full content is taller than the page and can never be shown un-clipped
      // here -- the .page ancestor clips at the page boundary. Instead keep the
      // box clamped to its page-available height (the slice height set above)
      // and let the content scroll within it, so the whole box stays editable.
      style.overflowY = 'auto';
      style.overflowX = 'hidden';

      // The vertical scrollbar would otherwise overlap the right edge of the
      // (fixed-width) editor and hide the last column of text. Widen the
      // container by the scrollbar's width so it sits in a gutter beside the
      // text rather than on top of it. The scrollbar is real UI chrome, not
      // scaled by our zoom transform, so add it as raw px after the zoom.
      const scrollbarWidth = getScrollbarWidth();

      if (scrollbarWidth > 0) {
        style.width = `calc(${withZoom(props.element.width)} + ${scrollbarWidth}px)`;
      }
    }
  }

  return style;
});

const hasFlowFragments = computed(
  () => props.fragment != null && props.element.flowFragments.length > 0,
);

function buildFlowBandContentKey(measureContent: string) {
  const fragmentsKey = props.element.flowFragments
    .map(
      (flowFragment) =>
        `${flowFragment.index}:${flowFragment.offsetTop}:${flowFragment.height}:${flowFragment.isLast ? 1 : 0}`,
    )
    .join('|');

  const paragraphStyle = resolvedParagraphStyle.value;

  return [
    measureContent,
    props.element.width,
    contentTextDirection.value,
    getFontFamilyWithNeumeFallback(
      paragraphStyle.fontFamily,
      props.pageSetup.neumeDefaultFontFamily,
    ),
    props.pageSetup.neumeDefaultFontFamily,
    paragraphStyle.fontSize,
    paragraphStyle.color,
    paragraphStyle.lineHeight ?? 'normal',
    paragraphStyleDefinitionKey.value,
    fragmentsKey,
  ].join('\u001f');
}

const shouldMeasureFlowBands = computed(
  () => hasFlowFragments.value && ownsFlowBandMeasure.value,
);

const flowBandContentKey = computed(() => {
  // Read the fragment prop directly, not only through boolean computeds whose
  // values do not change across layout passes. Layout replaces the fragment
  // objects every pass while mutating flowFragments on the raw element, so
  // this identity read is what invalidates the key after a relayout moves the
  // cut geometry (e.g. music edited above the box); the rebuilt fragmentsKey
  // then reads the fresh values and the recompute watcher fires.
  void props.fragment;

  if (!shouldMeasureFlowBands.value) {
    return '';
  }

  // Only the fragment that owns the hidden measuring DOM needs the expensive
  // cache key. Continuation fragments read the shared cache but should not all
  // stringify the full content and fragment list.
  return buildFlowBandContentKey(flowMeasureContent.value);
});

const shouldMountFlowMeasure = computed(
  () => shouldMeasureLineOffsets.value || shouldMeasureFlowBands.value,
);

// The band content is already trimmed to just this slice's lines, so it sits
// at the slice's top with only the zoom applied -- and deliberately carries no
// clip-path or overflow. Clipping a taller-than-page box is exactly what leaks
// in print; see the theory-of-operation note above boundariesAtLineYs().
const sliceContentStyle = computed(() => {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: `${props.element.width}px`,
    // Match the editor's text direction so the slice's line breaks and
    // alignment line up with what was measured.
    direction: contentTextDirection.value,
    // transform-origin is set by the .rich-text-slice-content class.
    transform: 'scale(var(--zoom, 1))',
  } as StyleValue;
});

// The hidden, full-content measuring copy renders unzoomed at the element's
// width. Flow lineOffsets and print band ranges are both read from this DOM.
// Its contents are intentionally installed only by syncSliceMeasureContent():
// while editing, the authoritative text can be CKEditor's live data before
// element.content has been flushed, so a template v-html binding would be a
// second writer that can clobber the measured copy back to stale content.
const sliceMeasureStyle = computed(() => {
  return {
    position: 'absolute',
    left: '-99999px',
    top: '0',
    width: `${props.element.width}px`,
    direction: contentTextDirection.value,
    pointerEvents: 'none',
  } as StyleValue;
});

function getFlowMeasureContent() {
  if (props.editMode) {
    const editor = getFlowMeasureEditor();

    if (editor != null) {
      return editor.getData();
    }
  }

  return content.value;
}

function getFlowMeasureEditor() {
  return getEditorInstance() ?? activeEditor.value ?? null;
}

function syncSliceMeasureContent(measureContent = getFlowMeasureContent()) {
  const measure = sliceMeasure.value;

  if (measure == null) {
    syncedSliceMeasureContent = null;
    return null;
  }

  if (syncedSliceMeasureContent !== measureContent) {
    measure.innerHTML = measureContent;
    syncedSliceMeasureContent = measureContent;
  }

  return measure;
}

function refreshFlowMeasureFromContentChange() {
  if (!canMeasureFlowGeometry.value) {
    return;
  }

  syncLineOffsetsForCurrentGeometry();
  computeFlowBandContents(true);
}

// =============================================================================
// Flowed text box pagination -- theory of operation
//
// A "flowed" box is one whose content is taller than the room left on its page.
// The layout service (createRichTextBoxFlowPlan in LayoutService.ts) splits it
// into per-page fragments and mounts one TextBoxRich per fragment; each fragment
// owns a vertical band of the full content, [offsetTop, offsetTop + height].
//
// THE BUG THIS AVOIDS:
// The first implementation rendered the *whole* box in every fragment and
// clipped it to a page-sized window (overflow:hidden / clip-path / contain). On
// screen that works. In the exported PDF, page 1 leaked ~2 lines past the cut,
// their descenders (the tail of a rho, say) sliced off and reappearing at the
// top of page 2.
//
// Root cause: when Blink paginates for print (webContents.printToPDF / print), a
// block taller than the printed page is FRAGMENTED across the physical page
// break, and the overflowing line-boxes are relocated onto the next page as part
// of pagination -- independently of any ancestor overflow:hidden / overflow:clip
// / clip-path / contain:paint, none of which get the chance to clip them. This
// was reproduced in a standalone Electron printToPDF harness: every clipping
// strategy leaks once the clipped box is taller than the page. A fixed-height or
// single-line block clips fine; only a multi-line paragraph that straddles the
// cut leaks, because a wrapping paragraph is the only thing the paginator
// actually splits. Approaches that were tried and ALSO leak (do not retry them):
// clip-path inset, overflow:clip, contain:paint / contain:layout, absolutely
// positioning the clipped child, and offsetting the child by a negative
// margin-top instead of a transform. The common factor is height -- any box
// taller than the page leaks, full stop. Clipping is not the lever.
//
// THE FIX (line-range render): never give the print engine a box taller than its
// page. Each fragment renders ONLY the line-boxes in its band -- nothing
// over-tall to fragment, so nothing to clip. The hidden full-content data-view
// copy emits the line offsets used by the layout service, and one mounted
// fragment later uses that same DOM shape to build all bands by mapping each
// band's pixel top/bottom (via boundariesAtLineYs) to DOM boundaries and cloning
// just the HTML between them. Text rows use real carets; atomic rows such as
// images, tables, and CKEditor widgets use node boundaries. The bands are
// exactly fragment.height tall, contiguous and lossless: fragment N ends on the
// line fragment N+1 begins with. Cutting at a line boundary (never mid-line)
// keeps whole glyphs and lets the continuation re-wrap identically.
//
// The cut is measured against a hidden, unzoomed, full-content data-view copy of
// the box (the sliceMeasure element) -- the same DOM shape that produced the
// line offsets -- see sliceMeasureStyle and the template. The resulting band
// HTML is cached in a WeakMap keyed by the shared RichTextBoxElement so each
// continuation slice only renders its own pre-cut content.
//
// Note the on-screen editor path (textBoxStyle / containerStyle, used only while
// the origin slice is being edited) DOES still clip a full-height editor to a
// window. That is fine and intentional: the leak is specific to print
// pagination, not a clipping bug, so on-screen clipping behaves correctly.
// =============================================================================

interface FlowBandCaret {
  node: Text;
  offset: number;
}

interface FlowBandBoundary {
  node: Node;
  offset: number;
  textCaret: FlowBandCaret | null;
}

interface FlowBandBoundaryCandidate {
  boundary: FlowBandBoundary;
  lineTop: number;
}

interface FlowBandIndexedBoundaryCandidate extends FlowBandBoundaryCandidate {
  index: number;
}

interface FlowBandBlock {
  bottom: number;
  top: number;
}

interface TextProbeOffsetCache {
  data: string;
  offsets: number[];
}

interface TextBoundarySearchContext {
  measuredProbes: Map<number, FlowBandIndexedBoundaryCandidate | null>;
  offsets: number[];
  range: Range;
  textRect: DOMRect;
}

interface FlowBandBoundaryRequest {
  index: number;
  threshold: number;
}

interface FlowBandBoundaryResolveState {
  boundaries: FlowBandBoundary[];
  cursor: number;
  requests: FlowBandBoundaryRequest[];
  rootTop: number;
}

let cachedGraphemeSegmenter: Intl.Segmenter | null | undefined;
const textProbeOffsetCache = new WeakMap<Text, TextProbeOffsetCache>();

const atomicFlowSelector = [
  '.ck-widget',
  '.neanes-ck-neume',
  'figure.image',
  'figure.table',
  'img',
  'table',
  'iframe',
  'object',
  'video',
  'audio',
  'canvas',
  'svg',
  'hr',
].join(',');

function isHTMLElement(node: Element): node is HTMLElement {
  return node instanceof HTMLElement;
}

function isAtomicFlowElement(element: HTMLElement) {
  return element.matches(atomicFlowSelector);
}

function closestAtomicFlowElement(element: Element | null, root: HTMLElement) {
  let current: Element | null = element;

  while (current != null && current !== root) {
    if (current instanceof HTMLElement && isAtomicFlowElement(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function boundaryBeforeNode(
  node: Node,
  childNodeOffset: number,
): FlowBandBoundary {
  return {
    node: node.parentNode!,
    offset: childNodeOffset,
    textCaret: null,
  };
}

function rootEndBoundary(root: HTMLElement): FlowBandBoundary {
  return {
    node: root,
    offset: root.childNodes.length,
    textCaret: null,
  };
}

function boundaryFromTextCaret(textCaret: FlowBandCaret): FlowBandBoundary {
  return {
    node: textCaret.node,
    offset: textCaret.offset,
    textCaret,
  };
}

function getElementFlowBlock(
  element: HTMLElement,
  rootTop: number,
): FlowBandBlock | null {
  const rects = Array.from(element.getClientRects())
    .filter((rect) => rect.bottom - rect.top > richTextLineMeasurementEpsilon)
    .map((rect) => ({
      top: rect.top - rootTop,
      bottom: rect.bottom - rootTop,
    }));

  if (rects.length === 0) {
    return null;
  }

  return {
    top: Math.min(...rects.map((rect) => rect.top)),
    bottom: Math.max(...rects.map((rect) => rect.bottom)),
  };
}

function getAtomicFlowBlocks(root: HTMLElement, rootTop: number) {
  return Array.from(root.querySelectorAll(atomicFlowSelector))
    .filter(isHTMLElement)
    .filter(
      (element) =>
        closestAtomicFlowElement(element.parentElement, root) == null,
    )
    .map((element) => getElementFlowBlock(element, rootTop))
    .filter((block): block is FlowBandBlock => block != null)
    .sort((a, b) => a.top - b.top || a.bottom - b.bottom);
}

function normalizeLineOffsets(offsets: number[]) {
  return offsets
    .filter((offset) => Number.isFinite(offset))
    .sort((a, b) => a - b)
    .reduce<number[]>((result, offset) => {
      if (result.length === 0) {
        result.push(offset);
        return result;
      }

      const previous = result[result.length - 1];

      if (Math.abs(previous - offset) > richTextLineMeasurementEpsilon) {
        result.push(offset);
      } else if (offset > previous) {
        result[result.length - 1] = offset;
      }

      return result;
    }, []);
}

function removeContainerFlowBands(sortedBands: FlowBandBlock[]) {
  // getClientRects() can include a multi-line wrapper rect plus its individual
  // line rects. A wrapper rect is exactly a band with a later, strictly-inner
  // band. Keep the line/atomic bands and discard those wrappers.
  const suffixMinBottom = new Array<number>(sortedBands.length);
  for (let i = sortedBands.length - 1; i >= 0; i--) {
    suffixMinBottom[i] =
      i + 1 < sortedBands.length
        ? Math.min(sortedBands[i].bottom, suffixMinBottom[i + 1])
        : sortedBands[i].bottom;
  }

  const bands: FlowBandBlock[] = [];
  let firstInnerCandidate = 0;

  for (const band of sortedBands) {
    const minInnerTop = band.top + richTextLineMeasurementEpsilon;

    while (
      firstInnerCandidate < sortedBands.length &&
      sortedBands[firstInnerCandidate].top <= minInnerTop
    ) {
      firstInnerCandidate++;
    }

    const containsInnerBand =
      firstInnerCandidate < sortedBands.length &&
      suffixMinBottom[firstInnerCandidate] <
        band.bottom - richTextLineMeasurementEpsilon;

    if (!containsInnerBand) {
      bands.push(band);
    }
  }

  return bands;
}

function getRowBottomOffsets(bands: FlowBandBlock[], fullHeight: number) {
  if (bands.length === 0) {
    return [fullHeight];
  }

  // Cluster vertically overlapping bands into rows so a cut is never made
  // through content that spans more than one line (e.g. a tall inline image).
  const rows: FlowBandBlock[] = [];

  for (const band of bands) {
    if (rows.length === 0) {
      rows.push({ top: band.top, bottom: band.bottom });
      continue;
    }

    const last = rows[rows.length - 1];

    if (band.top < last.bottom - richTextLineMeasurementEpsilon) {
      last.top = Math.min(last.top, band.top);
      last.bottom = Math.max(last.bottom, band.bottom);
    } else {
      rows.push({ top: band.top, bottom: band.bottom });
    }
  }

  const offsets = rows.map((row) => row.bottom);

  if (
    offsets[offsets.length - 1] <
    fullHeight - richTextLineMeasurementEpsilon
  ) {
    offsets.push(fullHeight);
  }

  return offsets;
}

function removeOffsetsInsideAtomicBands(
  offsets: number[],
  atomicBands: FlowBandBlock[],
) {
  if (atomicBands.length === 0) {
    return normalizeLineOffsets(offsets);
  }

  let atomicIndex = 0;

  // Both lists are sorted top-to-bottom, so one moving atomic pointer is enough
  // to reject cuts inside atomic regions in linear time.
  return normalizeLineOffsets([
    ...offsets,
    ...atomicBands.map((band) => band.bottom),
  ]).filter((offset) => {
    while (
      atomicIndex < atomicBands.length &&
      atomicBands[atomicIndex].bottom <= offset + richTextLineMeasurementEpsilon
    ) {
      atomicIndex++;
    }

    if (atomicIndex >= atomicBands.length) {
      return true;
    }

    const atomic = atomicBands[atomicIndex];

    return !(
      offset > atomic.top + richTextLineMeasurementEpsilon &&
      offset < atomic.bottom - richTextLineMeasurementEpsilon
    );
  });
}

function getGraphemeSegmenter() {
  if (cachedGraphemeSegmenter === undefined) {
    cachedGraphemeSegmenter =
      typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : null;
  }

  return cachedGraphemeSegmenter;
}

function getTextProbeOffsets(text: Text) {
  const cached = textProbeOffsetCache.get(text);

  if (cached?.data === text.data) {
    return cached.offsets;
  }

  const offsets: number[] = [];
  const segmenter = getGraphemeSegmenter();

  if (segmenter != null) {
    for (const segment of segmenter.segment(text.data)) {
      offsets.push(segment.index);
    }
  } else {
    for (let i = 0; i < text.length;) {
      offsets.push(i);
      const codePoint = text.data.codePointAt(i)!;
      i += codePoint > 0xffff ? 2 : 1;
    }
  }

  if (offsets[0] !== 0) {
    offsets.unshift(0);
  }
  if (offsets[offsets.length - 1] !== text.length) {
    offsets.push(text.length);
  }

  textProbeOffsetCache.set(text, { data: text.data, offsets });

  return offsets;
}

function measureTextProbe(
  text: Text,
  offsets: number[],
  index: number,
  rootTop: number,
  range: Range,
): FlowBandIndexedBoundaryCandidate | null {
  if (index < 0 || index >= offsets.length - 1) {
    return null;
  }

  const start = offsets[index];
  const end = offsets[index + 1];

  if (end <= start) {
    return null;
  }

  range.setStart(text, start);
  range.setEnd(text, end);

  const rect = range.getBoundingClientRect();

  if (rect.height <= 0) {
    return null;
  }

  return {
    boundary: boundaryFromTextCaret({ node: text, offset: start }),
    index,
    lineTop: rect.top - rootTop,
  };
}

function findTextProbeAtOrAfterIndex(
  text: Text,
  offsets: number[],
  startIndex: number,
  rootTop: number,
  range: Range,
  measuredProbes: Map<number, FlowBandIndexedBoundaryCandidate | null>,
) {
  for (let i = startIndex; i < offsets.length - 1; i++) {
    if (!measuredProbes.has(i)) {
      measuredProbes.set(i, measureTextProbe(text, offsets, i, rootTop, range));
    }

    const probe = measuredProbes.get(i);

    if (probe != null) {
      return probe;
    }
  }

  return null;
}

function createTextBoundarySearchContext(
  text: Text,
): TextBoundarySearchContext | null {
  if (text.length === 0) {
    return null;
  }

  const offsets = getTextProbeOffsets(text);

  if (offsets.length <= 1) {
    return null;
  }

  const range = document.createRange();
  range.selectNodeContents(text);

  const textRect = range.getBoundingClientRect();

  if (textRect.height <= 0) {
    return null;
  }

  return {
    measuredProbes: new Map<number, FlowBandIndexedBoundaryCandidate | null>(),
    offsets,
    range,
    textRect,
  };
}

function findTextBoundaryAtLineY(
  text: Text,
  rootTop: number,
  threshold: number,
  context: TextBoundarySearchContext,
): FlowBandBoundaryCandidate | null {
  const { measuredProbes, offsets, range, textRect } = context;
  if (textRect.bottom - rootTop < threshold) {
    return null;
  }

  const findProbeAtOrAfterIndex = (startIndex: number) =>
    findTextProbeAtOrAfterIndex(
      text,
      offsets,
      startIndex,
      rootTop,
      range,
      measuredProbes,
    );

  if (textRect.top - rootTop >= threshold) {
    return findProbeAtOrAfterIndex(0);
  }

  let best: FlowBandIndexedBoundaryCandidate | null = null;
  let lo = 0;
  let hi = offsets.length - 1;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const probe = findProbeAtOrAfterIndex(mid);

    if (probe == null) {
      hi = mid;
    } else if (probe.lineTop >= threshold) {
      best = probe;
      hi = mid;
    } else {
      lo = probe.index + 1;
    }
  }

  const probe = findProbeAtOrAfterIndex(lo);

  if (probe != null && probe.lineTop >= threshold) {
    return probe;
  }

  return best;
}

function resolveBoundaryCandidate(
  state: FlowBandBoundaryResolveState,
  candidate: FlowBandBoundaryCandidate | null,
) {
  if (candidate == null) {
    return;
  }

  while (
    state.cursor < state.requests.length &&
    state.requests[state.cursor].threshold <= candidate.lineTop
  ) {
    state.boundaries[state.requests[state.cursor].index] = candidate.boundary;
    state.cursor++;
  }
}

function resolveTextBoundaryRequests(
  text: Text,
  state: FlowBandBoundaryResolveState,
) {
  const context = createTextBoundarySearchContext(text);

  if (context == null) {
    return;
  }

  while (state.cursor < state.requests.length) {
    const threshold = state.requests[state.cursor].threshold;

    if (context.textRect.bottom - state.rootTop < threshold) {
      return;
    }

    const previousCursor = state.cursor;
    resolveBoundaryCandidate(
      state,
      findTextBoundaryAtLineY(text, state.rootTop, threshold, context),
    );

    // No visible caret in this text node can satisfy the current threshold.
    // Later DOM siblings may still satisfy it.
    if (state.cursor === previousCursor) {
      return;
    }
  }
}

function resolveBoundaryRequestsInNode(
  node: Node,
  state: FlowBandBoundaryResolveState,
) {
  for (let i = 0; i < node.childNodes.length; i++) {
    if (state.cursor >= state.requests.length) {
      return;
    }

    const child = node.childNodes[i];

    if (child instanceof HTMLElement && isAtomicFlowElement(child)) {
      const block = getElementFlowBlock(child, state.rootTop);

      if (block != null) {
        resolveBoundaryCandidate(state, {
          boundary: boundaryBeforeNode(child, i),
          lineTop: block.top,
        });
      }

      continue;
    }

    if (child instanceof Text) {
      resolveTextBoundaryRequests(child, state);
      continue;
    }

    resolveBoundaryRequestsInNode(child, state);
  }
}

// Find a valid DOM Range boundary for each requested line-box top. Text rows use
// a text caret inside the split block; atomic rows (images, tables, CKEditor
// widgets, inserted neumes) use the node boundary before the row instead. The
// fallback is the root end boundary, never null, so a slice cannot accidentally
// clone from the wrong end of the full content. Requested y values are sorted and
// resolved during one DOM-order pass; text nodes that contain a requested line
// are searched at grapheme starts instead of measuring every UTF-16 code unit in
// the full content.
function boundariesAtLineYs(
  root: HTMLElement,
  rootTop: number,
  ys: number[],
): FlowBandBoundary[] {
  const indexedYs = ys
    .map((y, index) => ({
      index,
      threshold: y - richTextLineMeasurementEpsilon,
    }))
    .sort((a, b) => a.threshold - b.threshold || a.index - b.index);
  const boundaries = new Array<FlowBandBoundary>(ys.length);

  if (indexedYs.length === 0) {
    return boundaries;
  }

  const endBoundary = rootEndBoundary(root);
  const state: FlowBandBoundaryResolveState = {
    boundaries,
    cursor: 0,
    requests: indexedYs,
    rootTop,
  };

  resolveBoundaryRequestsInNode(root, state);

  while (state.cursor < state.requests.length) {
    boundaries[state.requests[state.cursor].index] = endBoundary;
    state.cursor++;
  }

  return boundaries;
}

// The nearest block-level ancestor of a text node (skipping inline wrappers
// like CKEditor's <span>s), bounded by `root`.
function closestBlockAncestor(
  node: Text,
  root: HTMLElement,
): HTMLElement | null {
  let element = node.parentElement;

  while (element != null && element !== root) {
    const display = getComputedStyle(element).display;

    if (
      display !== 'inline' &&
      display !== 'inline-block' &&
      display !== 'inline-flex'
    ) {
      return element;
    }

    element = element.parentElement;
  }

  return null;
}

// Whether `caret` sits at the very start of `block` (i.e. the band boundary
// fell between blocks, not inside one).
function caretAtBlockStart(block: HTMLElement, caret: FlowBandCaret): boolean {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const text = node as Text;

    if (text === caret.node) {
      return text.data.slice(0, caret.offset).trim().length === 0;
    }

    if (text.data.trim().length > 0) {
      return false;
    }
  }

  return true;
}

function getElementAncestorChainWithinBlock(node: Text, block: HTMLElement) {
  const chain: HTMLElement[] = [];
  let element = node.parentElement;

  while (element != null && element !== block) {
    chain.unshift(element);
    element = element.parentElement;
  }

  if (element !== block) {
    return [];
  }

  chain.unshift(block);
  return chain;
}

function getSharedElementAncestorChainWithinBlock(
  start: FlowBandCaret,
  end: FlowBandCaret,
  block: HTMLElement,
) {
  const startChain = getElementAncestorChainWithinBlock(start.node, block);
  const endChain = getElementAncestorChainWithinBlock(end.node, block);
  const sharedChain: HTMLElement[] = [];
  const length = Math.min(startChain.length, endChain.length);

  for (let i = 0; i < length; i++) {
    if (startChain[i] !== endChain[i]) {
      break;
    }

    sharedChain.push(startChain[i]);
  }

  return sharedChain;
}

function wrapHolderContents(holder: HTMLElement, elementChain: HTMLElement[]) {
  if (elementChain.length === 0 || holder.childNodes.length === 0) {
    return;
  }

  const contents = document.createDocumentFragment();

  while (holder.firstChild != null) {
    contents.appendChild(holder.firstChild);
  }

  const outer = elementChain[0].cloneNode(false);
  let leaf = outer;

  for (const element of elementChain.slice(1)) {
    const clone = element.cloneNode(false);
    leaf.appendChild(clone);
    leaf = clone;
  }

  leaf.appendChild(contents);
  holder.appendChild(outer);
}

function getBoundaryContextNode(boundary: FlowBandBoundary) {
  if (boundary.textCaret != null) {
    return boundary.textCaret.node;
  }

  return boundary.node.childNodes[boundary.offset] ?? boundary.node;
}

function getBoundaryContextElement(boundary: FlowBandBoundary) {
  const node = getBoundaryContextNode(boundary);

  return node instanceof Element ? node : node.parentElement;
}

function closestListItemAncestor(
  boundary: FlowBandBoundary,
  root: HTMLElement,
) {
  let element = getBoundaryContextElement(boundary);

  while (element != null && element !== root) {
    if (element instanceof HTMLLIElement) {
      return element;
    }

    element = element.parentElement;
  }

  return null;
}

function isListElement(
  element: Element | null,
): element is HTMLOListElement | HTMLUListElement {
  return (
    element instanceof HTMLOListElement || element instanceof HTMLUListElement
  );
}

function getFirstMeaningfulElement(holder: HTMLElement) {
  for (const node of holder.childNodes) {
    if (node instanceof Text && node.data.trim().length === 0) {
      continue;
    }

    return node instanceof HTMLElement ? node : null;
  }

  return null;
}

function parseIntegerAttribute(element: Element, attribute: string) {
  const value = element.getAttribute(attribute);

  if (value == null) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function getDirectListItems(list: HTMLOListElement | HTMLUListElement) {
  return Array.from(list.children).filter(
    (element): element is HTMLLIElement => element instanceof HTMLLIElement,
  );
}

function getFirstDirectListItem(
  list: HTMLOListElement | HTMLUListElement,
): HTMLLIElement | null {
  return getDirectListItems(list)[0] ?? null;
}

function getOrderedListItemNumber(list: HTMLOListElement, item: HTMLLIElement) {
  const items = getDirectListItems(list);
  const reversed = list.hasAttribute('reversed');
  let value =
    parseIntegerAttribute(list, 'start') ?? (reversed ? items.length : 1);

  for (const listItem of items) {
    value = parseIntegerAttribute(listItem, 'value') ?? value;

    if (listItem === item) {
      return value;
    }

    value += reversed ? -1 : 1;
  }

  return null;
}

function applyOrderedListStart(
  targetList: HTMLOListElement | HTMLUListElement,
  sourceList: HTMLOListElement | HTMLUListElement,
  sourceItem: HTMLLIElement,
) {
  if (
    !(targetList instanceof HTMLOListElement) ||
    !(sourceList instanceof HTMLOListElement)
  ) {
    return;
  }

  const start = getOrderedListItemNumber(sourceList, sourceItem);

  if (start != null) {
    targetList.setAttribute('start', String(start));
  }
}

function boundaryIsImmediatelyBeforeElement(
  boundary: FlowBandBoundary,
  element: HTMLElement,
) {
  return (
    boundary.textCaret == null &&
    boundary.node === element.parentNode &&
    boundary.node.childNodes[boundary.offset] === element
  );
}

function fragmentHasMeaningfulFlowContent(fragment: DocumentFragment) {
  const walker = document.createTreeWalker(
    fragment,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
  );

  let node: Node | null;

  while ((node = walker.nextNode())) {
    if (node instanceof Text) {
      if (node.data.trim().length > 0) {
        return true;
      }

      continue;
    }

    if (
      node instanceof HTMLElement &&
      (isAtomicFlowElement(node) || node instanceof HTMLBRElement)
    ) {
      return true;
    }
  }

  return false;
}

function boundaryAtElementStart(
  boundary: FlowBandBoundary,
  element: HTMLElement,
) {
  if (boundaryIsImmediatelyBeforeElement(boundary, element)) {
    return true;
  }

  const range = document.createRange();
  range.setStart(element, 0);

  try {
    range.setEnd(boundary.node, boundary.offset);
  } catch {
    return false;
  }

  return !fragmentHasMeaningfulFlowContent(range.cloneContents());
}

function markContinuedListItemIfNeeded(
  item: HTMLLIElement | null,
  continued: boolean,
) {
  if (continued) {
    item?.classList.add('rich-text-slice-continued-list-item');
  }
}

function preserveListRangeContext(
  holder: HTMLElement,
  measure: HTMLElement,
  start: FlowBandBoundary | null,
) {
  if (start == null) {
    return;
  }

  const sourceItem = closestListItemAncestor(start, measure);
  const sourceList = sourceItem == null ? null : sourceItem.parentElement;

  if (sourceItem == null || !isListElement(sourceList)) {
    return;
  }

  const continuedListItem = !boundaryAtElementStart(start, sourceItem);
  const firstElement = getFirstMeaningfulElement(holder);

  if (
    firstElement != null &&
    isListElement(firstElement) &&
    firstElement.tagName === sourceList.tagName
  ) {
    applyOrderedListStart(firstElement, sourceList, sourceItem);
    markContinuedListItemIfNeeded(
      getFirstDirectListItem(firstElement),
      continuedListItem,
    );
    return;
  }

  const listClone = sourceList.cloneNode(false) as
    HTMLOListElement | HTMLUListElement;
  applyOrderedListStart(listClone, sourceList, sourceItem);

  if (firstElement instanceof HTMLLIElement) {
    markContinuedListItemIfNeeded(firstElement, continuedListItem);
    wrapHolderContents(holder, [listClone]);
    return;
  }

  const itemClone = sourceItem.cloneNode(false) as HTMLLIElement;
  markContinuedListItemIfNeeded(itemClone, continuedListItem);

  wrapHolderContents(holder, [listClone, itemClone]);
}

function preserveSameBlockRangeContext(
  holder: HTMLElement,
  measure: HTMLElement,
  start: FlowBandBoundary | null,
  end: FlowBandBoundary | null,
) {
  if (start?.textCaret == null || end?.textCaret == null) {
    return;
  }

  const startBlock = closestBlockAncestor(start.textCaret.node, measure);
  const endBlock = closestBlockAncestor(end.textCaret.node, measure);

  if (startBlock == null || startBlock !== endBlock) {
    return;
  }

  wrapHolderContents(
    holder,
    getSharedElementAncestorChainWithinBlock(
      start.textCaret,
      end.textCaret,
      startBlock,
    ),
  );
}

function cloneBandContent(
  measure: HTMLElement,
  start: FlowBandBoundary | null,
  end: FlowBandBoundary | null,
) {
  const range = document.createRange();
  range.selectNodeContents(measure);

  if (start != null) {
    range.setStart(start.node, start.offset);
  }
  if (end != null) {
    range.setEnd(end.node, end.offset);
  }

  const holder = document.createElement('div');
  holder.appendChild(range.cloneContents());
  preserveSameBlockRangeContext(holder, measure, start, end);

  // If the band ends inside a justified block, that block's now-last line was
  // an interior line in the full content. CSS text-align:justify never
  // justifies a paragraph's last line, so the cut line would print ragged.
  // Tag the cut block to restore text-align-last:justify on it specifically
  // (not the whole slice, and only when it really is justified, so a centred
  // or right-aligned continued line is not stretched).
  // Atomic-node boundaries end on a complete block/widget, never mid-paragraph,
  // so the justify-last fix-up applies only to text carets.
  if (end?.textCaret != null) {
    const cutBlock = closestBlockAncestor(end.textCaret.node, measure);

    if (
      cutBlock != null &&
      !caretAtBlockStart(cutBlock, end.textCaret) &&
      getComputedStyle(cutBlock).textAlign === 'justify' &&
      holder.lastElementChild != null
    ) {
      holder.lastElementChild.classList.add('rich-text-slice-continued-block');
    }
  }

  // If the band begins inside a block, its first block is a paragraph
  // continuation, so its first line must not carry the paragraph's first-line
  // indent.
  // Likewise, a band that begins with an atomic node starts on a fresh block, so
  // the first-line-indent fix-up applies only to text carets.
  if (start?.textCaret != null) {
    const startBlock = closestBlockAncestor(start.textCaret.node, measure);

    if (
      startBlock != null &&
      !caretAtBlockStart(startBlock, start.textCaret) &&
      holder.firstElementChild != null
    ) {
      holder.firstElementChild.classList.add(
        'rich-text-slice-continued-start-block',
      );
    }
  }

  // A middle slice that starts and ends inside the same list normally clones
  // bare <li> nodes (or only the paragraph inside one <li>). Restore the list
  // container so markers render, and set ordered-list continuation numbering.
  preserveListRangeContext(holder, measure, start);

  return holder.innerHTML;
}

// Trim the full content down into all fragment bands in one pass. A paragraph
// that straddles a boundary is split at the line break (between line-boxes), so
// marks never split mid-run and continuations re-wrap identically at the same
// width.
function computeFlowBandContents(force = false) {
  const fragments = props.element.flowFragments;
  const cache = getFlowBandRenderCache(props.element);

  if (!shouldMeasureFlowBands.value) {
    return;
  }

  const measureContent = getFlowMeasureContent();
  const measure = syncSliceMeasureContent(measureContent);
  const cacheKey = buildFlowBandContentKey(measureContent);

  if (measure == null) {
    return;
  }

  if (
    !force &&
    cache.key === cacheKey &&
    cache.contents.length === fragments.length
  ) {
    return;
  }

  const measureRect = measure.getBoundingClientRect();

  // The measuring copy is hidden (display:none) while printing, and may be
  // momentarily unlaid-out during transitions. Don't recompute from a
  // zero-height element -- it would find no line boundaries and fall back to
  // the whole content. Keep the last good band instead, and forget the
  // recorded height so the next resize-observer tick forces a recut.
  if (measureRect.height <= 0) {
    lastFlowBandsMeasureHeight = null;
    return;
  }

  lastFlowBandsMeasureHeight = measureRect.height;

  const rootTop = measureRect.top;
  const boundaryYs: number[] = [];
  const startCaretIndexes = new Array<number | null>(fragments.length).fill(
    null,
  );
  const endCaretIndexes = new Array<number | null>(fragments.length).fill(null);

  fragments.forEach((flowFragment, fragmentListIndex) => {
    if (flowFragment.index !== 0) {
      startCaretIndexes[fragmentListIndex] = boundaryYs.length;
      boundaryYs.push(flowFragment.offsetTop);
    }

    if (!flowFragment.isLast) {
      endCaretIndexes[fragmentListIndex] = boundaryYs.length;
      boundaryYs.push(flowFragment.offsetTop + flowFragment.height);
    }
  });

  const boundaries = boundariesAtLineYs(measure, rootTop, boundaryYs);
  const contents: string[] = [];

  fragments.forEach((flowFragment, fragmentListIndex) => {
    const startIndex = startCaretIndexes[fragmentListIndex];
    const endIndex = endCaretIndexes[fragmentListIndex];
    const start = startIndex == null ? null : boundaries[startIndex];
    const end = endIndex == null ? null : boundaries[endIndex];

    contents[flowFragment.index] = cloneBandContent(measure, start, end);
  });

  cache.contents = contents;
  cache.key = cacheKey;
}

function recomputeFlowBands() {
  void nextTick(() => computeFlowBandContents());
}

function releaseFlowBandMeasure() {
  releaseFlowBandMeasureForCache(getFlowBandRenderCache(props.element));
}

function releaseFlowBandMeasureForCache(cache: FlowBandRenderCache) {
  if (cache.owner === flowBandMeasureOwner) {
    cache.owner = null;
    cache.ownerPriority = Number.POSITIVE_INFINITY;
  }
}

// Elect the measurer for the element's shared band cache. Several fragments of
// one flowed box can be mounted at once (and, under page virtualization, an
// arbitrary subset of them); the lowest-index mounted fragment claims the
// hidden measuring DOM and computes every fragment's band.
function syncFlowBandMeasureOwnership() {
  const fragment = props.fragment;

  if (fragment == null || props.element.flowFragments.length === 0) {
    releaseFlowBandMeasure();
    return;
  }

  const cache = getFlowBandRenderCache(props.element);
  const ownerPriority = fragment.index;

  if (
    cache.owner == null ||
    cache.owner === flowBandMeasureOwner ||
    ownerPriority < cache.ownerPriority
  ) {
    cache.owner = flowBandMeasureOwner;
    cache.ownerPriority = ownerPriority;
  }
}

// Read flow geometry as soon as the hidden data-view copy exists, and again
// whenever it reflows -- most importantly when web fonts finish loading and the
// line breaks shift. flush: 'post' so the element is in the DOM and laid out
// when we read it.
watch(
  sliceMeasure,
  (element) => {
    syncedSliceMeasureContent = null;

    if (element == null) {
      return;
    }

    syncSliceMeasureContent();
    syncLineOffsetsForCurrentGeometry();
    computeFlowBandContents();
    observeSliceMeasure(
      element,
      debounce(50, () => {
        syncLineOffsetsForCurrentGeometry();
        // Force a recut only when the measure's height moved since the bands
        // were last cut (a font load or style reflow, which shifts the cut
        // positions without changing the content key). Resizes caused by the
        // recompute's own innerHTML sync arrive here after the new height was
        // recorded and fall through to the key-guarded cheap path.
        const resized =
          lastFlowBandsMeasureHeight == null ||
          Math.abs(
            element.getBoundingClientRect().height - lastFlowBandsMeasureHeight,
          ) > richTextLineMeasurementEpsilon;
        computeFlowBandContents(resized);
      }),
    );
  },
  { immediate: true, flush: 'post' },
);

watch(
  () => [shouldMeasureLineOffsets.value, props.element.lineOffsets.length],
  ([shouldMeasure]) => {
    if (!shouldMeasure) {
      clearLineOffsetsIfNoLongerMeasured();
    }
  },
  { immediate: true },
);

watch(
  content,
  () => {
    void nextTick(refreshFlowMeasureFromContentChange);
  },
  { flush: 'post' },
);

// Re-run the ownership election whenever this instance's eligibility (its
// fragment, the element's flow fragments) or the shared cache's owner changes
// -- most importantly when the owning fragment unmounts and the remaining
// mounted fragments must elect a new measurer. Writes from the election
// itself re-fire the watcher once and settle: re-claiming writes identical
// values, and a deposed instance makes no writes.
watch(
  () => {
    const cache = getFlowBandRenderCache(props.element);

    return [
      props.fragment?.index ?? null,
      props.element.flowFragments.length,
      cache.owner,
      cache.ownerPriority,
    ] as const;
  },
  syncFlowBandMeasureOwnership,
  { immediate: true },
);

// If the instance is handed a different element, drop any ownership still
// held on the previous element's cache; the election watcher above then
// claims on the new element's cache.
watch(
  () => props.element,
  (_, previousElement) => {
    if (previousElement != null) {
      releaseFlowBandMeasureForCache(getFlowBandRenderCache(previousElement));
    }
  },
);

watch(flowBandContentKey, () => recomputeFlowBands());

const textBoxStyle = computed(() => {
  const style: StyleValue = {
    width: `${props.element.width}px`, // no zoom because we scale with the transform
  };

  if (props.fragment != null) {
    // This path is only the origin slice while it is being edited on screen
    // (print and continuation slices render the read-only band instead). Keep
    // the editor at full content height so the whole box stays editable; the
    // outer container (overflow:hidden, sized to the slice) clips it to this
    // slice's band, and scrolls it while focused.
    style.position = 'absolute';
    style.top = 0;
    style.left = 0;
    style.height = `${props.element.flowContentHeight}px`;
  } else {
    style.maxHeight = withZoom(flowMeasureAvailableHeight.value);
  }

  return style;
});

const textBoxTopInnerContainerStyle = computed(() => {
  // The top text box is aligned such that the middle of the oligon sits in middle of the font.
  const style: any = {
    top: withZoom(
      props.element.defaultNeumeFontAscent -
        props.pageSetup.neumeDefaultFontSize * props.element.oligonMidpoint -
        props.element.defaultLyricsFontHeight / 2 -
        (heightTop.value - props.element.defaultLyricsFontHeight) +
        props.element.offsetYTop,
    ),
    lineHeight: props.element.defaultLyricsFontHeight + 'px',
  };

  return style;
});

const textBoxStyleTop = computed(() => {
  const style: any = {
    width: `${props.element.width}px`, // no zoom because we scale with the transform
  };

  return style;
});

const textBoxStyleBottom = computed(() => {
  const style: any = {
    width: `${props.element.width}px`, // no zoom because we scale with the transform
  };

  return style;
});

const textBoxTopContainerStyle = computed(() => {
  const style: any = {
    height: withZoom(props.element.height),
  };

  return style;
});

const textBoxBottomContainerStyle = computed(() => {
  // The bottom text box is aligned so that the baseline of the font is aligned with the lyrics baseline.
  const style: any = {
    top: withZoom(
      props.pageSetup.lyricsVerticalOffset -
        (heightBottom.value - props.element.defaultLyricsFontHeight) +
        props.element.offsetYBottom,
    ),
    lineHeight: props.element.defaultLyricsFontHeight + 'px',
  };

  return style;
});

const multipanelContainerStyle = computed(() => {
  const style: StyleValue = {
    width: `${props.element.width}px`, // no zoom because we scale with the transform
  };

  return style;
});

watch(
  () => props.element.centerOnPage,
  () => {
    setPadding(getEditorInstance());
    setPadding(getEditorInstanceBottom());
  },
);

// While the origin slice of a flowed box is logically focused it scrolls
// internally so the whole (taller-than-page) box stays editable. "Logically"
// includes focus in editor-owned toolbar/portal chrome via CKEditor's focus
// tracker; raw DOM focusout from the editable to that chrome must not collapse
// the slice mid-edit. Once focus truly leaves the editor it reverts to a clip
// window that must reveal its own band starting at offset 0, but the browser
// keeps the old scrollTop when overflow flips from auto to hidden -- which would
// leave a lower band showing on the first page. Reset it so the unfocused origin
// slice always shows the top of the box.
watch(isEditingFocused, (focused) => {
  if (!focused && container.value != null) {
    container.value.scrollTop = 0;
  }
});

watch(
  () => resolvedParagraphStyle.value.fontSize,
  () => {
    refreshCkContentFontSize();
  },
);

onBeforeUnmount(() => {
  unmounting.value = true;
  debouncedReportMeasuredGeometry.cancel();
  debouncedSyncFlowMeasureAfterEditorDataChange.cancel();
  releaseFlowBandMeasure();
  update();
  // Observers are disconnected automatically by useResizeObserver's own
  // onBeforeUnmount hook.
});

function getEditorInstance() {
  return editorRef.value?.instance;
}

function getEditorInstanceBottom() {
  return editorBottom.value?.instance;
}

function getEditorInstanceLeft() {
  return editorLeft.value?.instance;
}

function getEditorInstanceCenter() {
  return editorCenter.value?.instance;
}

function getEditorInstanceRight() {
  return editorRight.value?.instance;
}

function getActiveEditorInstances() {
  if (props.element.multipanel) {
    return [
      getEditorInstanceLeft(),
      getEditorInstanceCenter(),
      getEditorInstanceRight(),
    ];
  }

  if (props.element.inline) {
    return [getEditorInstance(), getEditorInstanceBottom()];
  }

  return [getEditorInstance()];
}

// During a recalc pass the box is rendered hidden purely to be measured. Emit
// any changed geometry (height, line offsets) and then a `measured` completion
// event so the editor's recalc poll can tell this box has finished -- even when
// nothing changed, or when only the line offsets changed. The completion event
// is emitted last, after the height/offset emits have been applied
// synchronously, so a listener counting completions knows the measured geometry
// has already been committed.
function reportMeasuredGeometry() {
  const height = getHeight();

  if (
    height != null &&
    Math.abs(props.element.height - height) > richTextHeightEpsilon
  ) {
    emit('update:height', height);
  }

  syncLineOffsetsForCurrentGeometry();

  emit('measured');
}

function syncMeasuredGeometry() {
  if (props.recalc) {
    // Coalesce the burst of resize-observer callbacks fired while the hidden
    // measurement editor settles, then report height, line offsets, and
    // completion together (see reportMeasuredGeometry).
    debouncedReportMeasuredGeometry();
    return;
  }

  const height = getHeight();

  if (
    height != null &&
    props.fragment == null &&
    Math.abs(props.element.height - height) > richTextHeightEpsilon
  ) {
    // A fragment's measured .ck-content height is its own slice, not the shared
    // source box's intended height, so only unsliced boxes write height back.
    // A resize is pure geometry -- there is no pending edit to persist. Route
    // through `update:height` (-> updateRichTextBoxHeight, which only sets
    // the height), not `update` (-> updateRichTextBox), which merges
    // getPendingRichTextBoxUpdates() and would inject the editor's getData()
    // into this height-only change. element.content is stale while editing
    // (the focus-zone suppresses the blur that would flush it), so that merge
    // makes the update two-keyed, breaking the single-key `noHistory` guard
    // -> a spurious undo entry + full save on every height-changing font/size
    // change. (The injected content also echoes back through `:model-value`
    // to editor.data.set(); the selection collapse that once caused is now
    // prevented by RichTextEditor's own echo guard, but the churn is not.)
    emit('update:height', height);
  }

  syncLineOffsetsForCurrentGeometry();
}

const ckContentFontSize = ref(`${resolvedParagraphStyle.value.fontSize}px`);

function getMinimumFontSizeInActiveEditors() {
  const activeEditors = getActiveEditorInstances().filter(
    (editor): editor is InlineEditor => editor != null,
  );

  if (activeEditors.length === 0) {
    return `${resolvedParagraphStyle.value.fontSize}px`;
  }

  const minimumSizes = activeEditors.map((editor) =>
    parseFloat(getMinimumFontSizeInEditor(editor)),
  );

  return `${Math.min(...minimumSizes)}pt`;
}

function refreshCkContentFontSize() {
  ckContentFontSize.value = getMinimumFontSizeInActiveEditors();
}

async function initializeCkContentFontSize() {
  refreshCkContentFontSize();
  await nextTick();
}

function syncMeasuredGeometryIfRecalc() {
  if (!props.recalc) {
    return;
  }

  syncMeasuredGeometry();
}

function observeCkContentFontSize(editor: InlineEditor) {
  editor.model.document.on('change:data', () => refreshCkContentFontSize());

  editor.model.document.selection.on(
    'change:attribute',
    (_evt, attributeName) => {
      if (attributeName === 'fontSize') {
        refreshCkContentFontSize();
      }
    },
  );
}

async function onEditorReady(editor: InlineEditor) {
  applyInitialLanguage(editor);
  await initializeCkContentFontSize();

  syncMeasuredGeometryIfRecalc();

  if (focusOnReady.value) {
    editor.editing.view.focus();
    focusOnReady.value = false;
  }

  const element = editor.sourceElement;

  observeCkContentFontSize(editor);

  observeResize(
    element!,
    debounce(100, () => {
      syncMeasuredGeometry();
    }),
  );
}

function onEditorDataChange(editor: InlineEditor) {
  if (editor !== getEditorInstance() || !canMeasureFlowGeometry.value) {
    return;
  }

  debouncedSyncFlowMeasureAfterEditorDataChange();
}

// Coalesce a typing burst: bump the content version (which invalidates
// flowMeasureContent -> flowBandContentKey and recuts the bands) and re-sync
// the line offsets once per settled burst instead of on every keystroke --
// both serialize the whole document via getData(). Blur and the pre-capture
// flush recut immediately through the content watcher, so nothing depends on
// this timer.
function syncFlowMeasureAfterEditorDataChange() {
  if (!canMeasureFlowGeometry.value) {
    return;
  }

  flowMeasureContentVersion.value++;
  syncLineOffsetsForCurrentGeometry();
}

async function onEditorReadyMultipanelSide(editor: InlineEditor) {
  applyInitialLanguage(editor);
  await initializeCkContentFontSize();
  syncMeasuredGeometryIfRecalc();
  observeCkContentFontSize(editor);
}

function onEditorReadyInline(editor: InlineEditor) {
  applyInitialLanguage(editor);

  heightTop.value = getHeightTop() ?? 0;

  const element = editor.sourceElement;

  observeInlineTop(
    element!,
    throttle(100, () => {
      heightTop.value = getHeightTop() ?? 0;
    }),
  );

  setPadding(editor);
}

function onEditorReadyInlineBottom(editor: InlineEditor) {
  applyInitialLanguage(editor);

  if (focusOnReady.value) {
    editor.editing.view.focus();
    focusOnReady.value = false;
  }

  heightBottom.value = getHeightBottom() ?? 0;

  const element = editor.sourceElement;

  observeInlineBottom(
    element!,
    throttle(100, () => {
      heightBottom.value = getHeightBottom() ?? 0;
    }),
  );

  setPadding(editor);
}

function applyInitialLanguage(editor: InlineEditor) {
  const language = defaultInitialLanguage.value;

  if (language == null) {
    return;
  }

  const languageCode = getRichTextLanguageCode(language);
  const textDirection = getRichTextLanguageDirection(language);

  if (hasMeaningfulRichTextEditorContent(editor)) {
    if (inferRichTextEditorLanguage(editor) == null) {
      applyRichTextLanguageToEditor(editor, languageCode, textDirection);
    }

    return;
  }

  const command = editor.commands.get('textPartLanguage')!;

  if (!command.isEnabled) {
    return;
  }

  editor.execute('textPartLanguage', {
    languageCode,
    textDirection,
  });
}

function onBlur() {
  if (!unmounting.value) {
    // Refresh the cut points first so the re-layout triggered by the content
    // update re-slices using the final line breaks.
    syncLineOffsetsForCurrentGeometry();
    update();
  }
}

function update() {
  const updates = getPendingUpdates();

  if (updates != null) {
    emit('update', updates);
  }
}

function getPendingUpdates() {
  const updates: Partial<RichTextBoxElement> = {};

  let updated = false;

  const height = getHeight();

  updated =
    addPendingEditorData(updates, 'content', getEditorInstance()) || updated;
  updated =
    addPendingEditorData(updates, 'contentBottom', getEditorInstanceBottom()) ||
    updated;
  updated =
    addPendingEditorData(updates, 'contentLeft', getEditorInstanceLeft()) ||
    updated;
  updated =
    addPendingEditorData(updates, 'contentCenter', getEditorInstanceCenter()) ||
    updated;
  updated =
    addPendingEditorData(updates, 'contentRight', getEditorInstanceRight()) ||
    updated;

  const activeEditors = getActiveEditorInstances();

  if (props.editMode && activeEditors.some(Boolean)) {
    const hasMeaningfulContent = activeEditors.some(
      (editor) => editor != null && hasMeaningfulRichTextEditorContent(editor),
    );

    if (hasMeaningfulContent) {
      const language = inferSharedRichTextEditorLanguage(activeEditors);
      const currentLanguage = getRichTextLanguage(props.element);

      if (
        (currentLanguage?.toLowerCase() ?? null) !==
        (language?.toLowerCase() ?? null)
      ) {
        if (language == null) {
          updates.languageCode = null;
          updates.textDirection = null;
        } else {
          updates.languageCode = getRichTextLanguageCode(language);
          updates.textDirection = getRichTextLanguageDirection(language);
        }
        updated = true;
      }
    }
  }

  if (
    height != null &&
    !props.element.inline &&
    props.fragment == null &&
    Math.abs(props.element.height - height) > richTextHeightEpsilon
  ) {
    // A fragment's measured .ck-content height is its own slice, not the shared
    // source box's intended height, so only unsliced boxes write height back.
    updates.height = height;
    updated = true;
  }

  if (props.element.inline) {
    heightBottom.value = getHeightBottom() ?? 0;
    heightTop.value = getHeightTop() ?? 0;
  }

  if (updated) {
    return updates;
  }

  return null;
}

function addPendingEditorData(
  updates: Partial<RichTextBoxElement>,
  propertyName: RichTextBoxContentKey,
  editor: Editor | undefined,
) {
  if (!props.editMode || editor == null) {
    return false;
  }

  const currentContent = editor.getData();

  if (props.element[propertyName] === currentContent) {
    return false;
  }

  updates[propertyName] = currentContent;
  return true;
}

function getHeight() {
  // Target the editor's editable specifically. A flow-capable source box can
  // also mount the hidden data-view measuring copy (.rich-text-slice-measure),
  // which shares the .ck-content class and precedes the editor in the DOM; a
  // bare '.ck-content' lookup would return that unzoomed copy and, divided by
  // the inherited --zoom below, report a height scaled by 1/zoom.
  const element = container.value?.querySelector<HTMLElement>(
    '.ck-editor__editable',
  );

  if (element == null) {
    return null;
  }

  return element.getBoundingClientRect().height / getComputedZoom(element);
}

function clearLineOffsetsIfNoLongerMeasured() {
  if (
    !canOwnLineOffsets.value ||
    shouldMeasureLineOffsets.value ||
    props.element.lineOffsets.length === 0
  ) {
    return;
  }

  emit('update:lineOffsets', []);
}

// Only the source body box emits flow cut points. Continuation fragments may
// also mount a hidden data-view copy when they are the only visible fragment,
// but they are read-only renderers and should not write geometry back.
function syncLineOffsetsForCurrentGeometry() {
  if (!shouldMeasureLineOffsets.value) {
    clearLineOffsetsIfNoLongerMeasured();
    return;
  }

  // Measure the vertical offsets (px, unzoomed, relative to the content top) at
  // which the rendered content may be cut without slicing through a line of
  // text. Each entry is the bottom of a rendered line; the final entry is the
  // total content height. Used by the layout service to flow the box across
  // pages.
  //
  // Use the hidden data-view copy, not CKEditor's editing DOM. The print band
  // renderer clones from this same DOM shape, so the line offsets used by
  // LayoutService and the DOM boundaries used by computeFlowBandContents agree.
  const element = syncSliceMeasureContent();

  if (element == null) {
    return;
  }

  const contentRect = element.getBoundingClientRect();
  const fullHeight = contentRect.height;

  const range = document.createRange();
  range.selectNodeContents(element);

  // Each client rect is a rendered line box (plus any replaced elements).
  const allBands = Array.from(range.getClientRects())
    .map((rect) => ({
      top: rect.top - contentRect.top,
      bottom: rect.bottom - contentRect.top,
    }))
    .filter((band) => band.bottom - band.top > richTextLineMeasurementEpsilon)
    .sort((a, b) => a.top - b.top || a.bottom - b.bottom);

  const bands = removeContainerFlowBands(allBands);
  let offsets = getRowBottomOffsets(bands, fullHeight);

  // Atomic rich-content nodes (images, tables, CKEditor widgets, inserted
  // neumes) must not be split by a page boundary. Container-band filtering above
  // can discard the outer band for widgets that contain text or row/cell rects,
  // so re-add each atomic node's bottom as a valid whole-node cut and reject any
  // candidate cuts that fall strictly inside it. The renderer uses the same
  // atomic selector in boundariesAtLineYs(), so measurement and cloning agree on
  // what is indivisible.
  const atomicBands = getAtomicFlowBlocks(element, contentRect.top)
    .map((band) => ({
      top: Math.max(0, band.top),
      bottom: Math.min(fullHeight, band.bottom),
    }))
    .filter((band) => band.bottom - band.top > richTextLineMeasurementEpsilon);

  offsets = removeOffsetsInsideAtomicBands(offsets, atomicBands);

  const current = props.element.lineOffsets;

  const unchanged =
    current.length === offsets.length &&
    current.every(
      (value, index) =>
        Math.abs(value - offsets[index]) < richTextLineMeasurementEpsilon,
    );

  if (!unchanged) {
    emit('update:lineOffsets', offsets);
  }
}

function getHeightBottom() {
  const element = container.value?.querySelector('.ck-content.inline-bottom');

  if (element == null) {
    return null;
  }

  return element.getBoundingClientRect().height / getComputedZoom(element);
}

function getHeightTop() {
  const element = container.value?.querySelector('.ck-content.inline-top');

  if (element == null) {
    return null;
  }

  return element.getBoundingClientRect().height / getComputedZoom(element);
}

function setPadding(editor: Editor | undefined) {
  if (editor == null) {
    return;
  }

  editor.editing.view.change((writer) => {
    const editable = editor.editing.view.document.getRoot();

    if (props.element.centerOnPage) {
      writer.setStyle(
        'padding-right',
        `${props.pageSetup.innerPageWidth - props.element.width}px`,
        editable!,
      );
    } else {
      writer.removeStyle('padding-right', editable!);
    }
  });
}

function focus() {
  const editor =
    (props.element.multipanel
      ? getEditorInstanceCenter()
      : props.element.inline
        ? getEditorInstanceBottom()
        : getEditorInstance()) ??
    getEditorInstance() ??
    getEditorInstanceCenter() ??
    getEditorInstanceBottom() ??
    getEditorInstanceLeft() ??
    getEditorInstanceRight();

  if (editor == null) {
    focusOnReady.value = true;
    return;
  }

  editor.editing.view.focus();
}

defineExpose({
  focus,
  getPendingUpdates,
  htmlElement,
});
</script>

<style scoped>
:deep(p) {
  margin: 0;
}

/* Neutralize the leading/trailing block margin so content sits flush with the
   box edges. The editor's editable, the visible band, and the hidden measuring
   copy all carry .ck-content, so one rule covers all three. Flow cuts are
   measured from the hidden data-view copy; applying the same rule to the editor
   keeps the editing view aligned with the printed view. Scope to the container
   (which owns this component's scope id) so the rule reaches the CKEditor-
   managed editable, whose own descendants carry no scope id. Restricted to
   direct children: a margin on a nested first/last block is then preserved on
   all three and cannot drift. */
.rich-text-box-container :deep(.ck-content > :first-child) {
  margin-top: 0;
}

.rich-text-box-container :deep(.ck-content > :last-child) {
  margin-bottom: 0;
}

.ck-focused:not(.multipanel) {
  background-color: white;
  position: relative;
  z-index: 1;
}

.rich-text-editor {
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
  color: var(--ck-content-font-color);
  font-family: var(--ck-content-font-family);
  font-size: var(--ck-content-font-size);
  line-height: var(--ck-content-line-height);
  transform-origin: 0 0;
  transform: scale(var(--zoom, 1));
  border: none !important;
}

/* The visible band and the hidden measuring copy must lay out identically
   (same font, width and block margins) so rendered line breaks line up with
   the measured cut points. */
.rich-text-slice-content,
.rich-text-slice-measure {
  box-sizing: border-box;
  padding: 0;
  color: var(--ck-content-font-color);
  font-family: var(--ck-content-font-family);
  font-size: var(--ck-content-font-size);
  line-height: var(--ck-content-line-height);
  transform-origin: 0 0;
}

/* A justified paragraph that is cut across a page boundary: its last line in
   this slice is really an interior line, so justify it like one. */
.rich-text-slice-content :deep(.rich-text-slice-continued-block) {
  text-align-last: justify;
}

/* The first block of a slice that continues a paragraph from the previous page
   must not re-apply the paragraph's first-line indent. */
.rich-text-slice-content :deep(.rich-text-slice-continued-start-block) {
  text-indent: 0;
}

/* A slice that starts mid-list-item is continuing an item whose marker already
   printed on the previous page. Keep the <li> in the list so following ordered
   items retain their numbers, but suppress this duplicate marker. */
.rich-text-slice-content :deep(.rich-text-slice-continued-list-item) {
  list-style-type: none !important;
}

.rich-text-box-container {
  min-height: 10px;
}

.rich-text-box-container .handle {
  bottom: calc(50% - 5px);
  left: -10px;

  z-index: 1;

  display: none;
}

.rich-text-box-container.selected .handle {
  display: inline;
}

.rich-text-box-multipanel-container {
  display: flex;
}

.rich-text-editor.multipanel {
  outline: 1px dotted black;
  box-sizing: border-box;
  min-width: 2.5rem;
}

.rich-text-editor.left {
  position: absolute;
  left: 0;
  z-index: 1;
}

.rich-text-editor.center {
  flex: 1;
}

.rich-text-editor.right {
  position: absolute;
  right: 0;
  transform-origin: top right;
}

.inline-container {
  display: flex;
  flex-direction: column;
}

.inline-container,
.rich-text-editor.single {
  outline: 1px dotted black;
}

.selected .inline-container,
.selected .rich-text-editor.single {
  outline: 1px solid goldenrod;
}

.rich-text-editor.scrollable {
  overflow-y: auto;
}

.rich-text-editor.inline-top {
  white-space: nowrap !important;
  position: relative;
  border: none;
  overflow: visible;
}

.rich-text-editor.inline-bottom {
  display: inline-block;
  position: relative;
  white-space: nowrap !important;
  border: none;
  overflow: visible;
}

.inline-bottom-container,
.inline-top-container,
.inline-top-inner-container {
  display: inline-block;
  position: relative;
  border: none;
  overflow: visible;
}

:deep(.ck-editor__editable.ck-focused) {
  border: none !important;
  outline: var(--ck-focus-ring) !important;
}

@media print {
  /* A flowed slice's DOM is just its own band of whole lines (see
     computeFlowBandContents and the theory-of-operation note above
     boundariesAtLineYs); the next slice's lines live on the next page in a
     separate element. So there is deliberately NO overflow:hidden clip on a
     flowed slice here -- a clip could only ever cut the slice's own content,
     never hide a neighbour's line.

     This is required, not just harmless. Print does not lay text out at the line
     height the slice was measured at: the cut points (lineOffsets) are measured
     on screen, but Blink renders the same text a fraction of a pixel taller per
     line in print (line-height:normal resolves to slightly different font
     metrics). Over a page of lines that drift accumulates to a sizeable fraction
     of a line, so a slice clipped to its screen-measured height would slice its
     own last line in half. Letting the band overflow (via the global
     `body * { overflow: visible }` print rule) keeps every line whole; the drift
     only lets the last line sit slightly lower, as any page-filling text box
     does in print. */
  .rich-text-box-container .handle {
    display: none !important;
  }

  /* The hidden measuring copy is never printed (the band is already computed). */
  .rich-text-slice-measure {
    display: none !important;
  }

  .rich-text-editor.multipanel {
    border: none !important;
    outline: none !important;
  }

  :deep(.ck-widget) {
    outline: none !important;
  }

  :deep(.ck-editor__editable.ck-focused) {
    outline: none !important;
  }

  :deep(.ck-widget__type-around) {
    display: none !important;
  }
}
</style>
