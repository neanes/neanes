<template>
  <div
    ref="container"
    class="text-box-container"
    :style="containerStyle"
    :class="{ selected: selected }"
    dir="auto"
    @click="$emit('select-single')"
  >
    <span class="handle"></span>
    <div v-if="element.multipanel" class="text-box-multipanel-container">
      <ContentEditable
        ref="textLeft"
        class="text-box multipanel left"
        :class="textBoxClass"
        :style="textBoxStyle"
        :content="contentLeft"
        :editable="editMode"
        @blur="onBlur"
        @on-editor-ready="onEditorReady"
      ></ContentEditable>
      <ContentEditable
        ref="textCenter"
        class="text-box multipanel center"
        :class="textBoxClass"
        :style="textBoxStyle"
        :content="contentCenter"
        :editable="editMode"
        @blur="onBlur"
        @on-editor-ready="onEditorReady"
      ></ContentEditable>
      <ContentEditable
        ref="textRight"
        class="text-box multipanel right"
        :class="textBoxClass"
        :style="textBoxStyle"
        :content="contentRight"
        :editable="editMode"
        @blur="onBlur"
        @on-editor-ready="onEditorReady"
      ></ContentEditable>
    </div>
    <div v-else-if="element.inline" class="inline-container">
      <ContentEditable
        ref="text"
        class="text-box inline-top"
        :class="textBoxClass"
        :style="textBoxStyleTop"
        :content="content"
        :editable="editMode"
        @blur="onBlur"
      ></ContentEditable>
      <ContentEditable
        ref="textBottom"
        class="text-box inline-bottom"
        :class="textBoxClass"
        :style="textBoxStyleBottom"
        :content="contentBottom"
        :editable="editMode"
        @blur="onBlur"
      ></ContentEditable>
    </div>
    <ContentEditable
      v-else
      ref="text"
      class="text-box single"
      :class="textBoxClass"
      :style="textBoxStyle"
      :content="content"
      :editable="editMode"
      @blur="onBlur"
      @on-editor-ready="onEditorReady"
    ></ContentEditable>
  </div>
</template>

<script setup lang="ts">
import { debounce, throttle } from 'throttle-debounce';
import type { PropType, StyleValue } from 'vue';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import type { ComponentExposed } from 'vue-component-type-helpers';

import ContentEditable from '@/components/ContentEditable.vue';
import { useResizeObserver } from '@/composables/useResizeObserver';
import type { TextBoxElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import type { TokenMetadata, TokenScope } from '@/utils/replaceTokens';
import { replaceTokens } from '@/utils/replaceTokens';
import { withZoom } from '@/utils/withZoom';

const emit = defineEmits(['update', 'update:height', 'select-single']);
const props = defineProps({
  element: {
    type: Object as PropType<TextBoxElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
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
});

const container = useTemplateRef<HTMLElement>('container');
const text = useTemplateRef<ComponentExposed<typeof ContentEditable>>('text');
const textLeft =
  useTemplateRef<ComponentExposed<typeof ContentEditable>>('textLeft');
const textRight =
  useTemplateRef<ComponentExposed<typeof ContentEditable>>('textRight');
const textCenter =
  useTemplateRef<ComponentExposed<typeof ContentEditable>>('textCenter');
const textBottom =
  useTemplateRef<ComponentExposed<typeof ContentEditable>>('textBottom');

const unmounting = ref(false);
const { observe: observeResize } = useResizeObserver();
const setupResizeObserverDebounced = debounce(100, setupResizeObserver);

const htmlElement = computed(() => container.value!);

const content = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.content
    : replaceTokens(
        props.element.content,
        props.metadata,
        props.element.alignment,
        props.tokenScope,
      );
});

const contentBottom = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.contentBottom
    : replaceTokens(
        props.element.contentBottom,
        props.metadata,
        props.element.alignment,
        props.tokenScope,
      );
});

const contentLeft = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.contentLeft
    : replaceTokens(
        props.element.contentLeft,
        props.metadata,
        TextBoxAlignment.Left,
        props.tokenScope,
      );
});

const contentCenter = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.contentCenter
    : replaceTokens(
        props.element.contentCenter,
        props.metadata,
        TextBoxAlignment.Center,
        props.tokenScope,
      );
});

const contentRight = computed(() => {
  return props.editMode || props.metadata == null
    ? props.element.contentRight
    : replaceTokens(
        props.element.contentRight,
        props.metadata,
        TextBoxAlignment.Right,
        props.tokenScope,
      );
});

const width = computed(() => withZoom(props.element.width));

const containerStyle = computed(() => {
  const style = {
    color: props.element.computedColor,
    fontFamily: getFontFamilyWithFallback(props.element.computedFontFamily),
    fontSize: withZoom(props.element.computedFontSize),
    fontWeight: props.element.computedFontWeight,
    fontStyle: props.element.computedFontStyle,
    textAlign: props.element.alignment,
    width: width.value,
    height: withZoom(props.element.height),
    minHeight: withZoom(props.element.minHeight),
    webkitTextStrokeWidth: withZoom(props.element.computedStrokeWidth),
    lineHeight: `${props.element.computedLineHeight ?? 'normal'}`,
  } as StyleValue;

  return style;
});

const textBoxStyle = computed(() => {
  const style: any = {
    width: !props.element.multipanel ? width.value : undefined,
    height:
      props.element.inline || props.element.customHeight
        ? withZoom(props.element.height)
        : undefined,
    minHeight: withZoom(props.element.minHeight),
    textWrap: props.element.alignment === 'center' ? 'balance' : 'pretty',
  };

  return style;
});

const textBoxStyleTop = computed(() => {
  const style: any = {
    width: width.value,
    height: withZoom(props.element.height),
    textWrap: props.element.alignment === 'center' ? 'balance' : 'pretty',
  };

  return style;
});

const textBoxStyleBottom = computed(() => {
  const style: any = {
    width: width.value,
    textWrap: props.element.alignment === 'center' ? 'balance' : 'pretty',
    top: withZoom(props.pageSetup.lyricsVerticalOffset),
  };

  return style;
});

const textBoxClass = computed(() => {
  return {
    underline: props.element.underline,
  };
});

watch(
  () => props.element.customHeight,
  (newVal) => {
    if (newVal == null) {
      update();
    }
  },
);

onMounted(() => {
  const height = getHeight();

  if (height != null && Math.abs(props.element.height - height) > 0.001) {
    emit('update:height', height);
  }

  setupResizeObserver();
});

onBeforeUnmount(() => {
  unmounting.value = true;
  update();
  // Observer is disconnected automatically by useResizeObserver's own
  // onBeforeUnmount hook.
});

function getTextElement() {
  return text.value!;
}

function getTextElementLeft() {
  return textLeft.value!;
}

function getTextElementRight() {
  return textRight.value!;
}

function getTextElementCenter() {
  return textCenter.value!;
}

function getTextElementBottom() {
  return textBottom.value!;
}

function onEditorReady() {
  setupResizeObserverDebounced();
}

function update() {
  const updates: Partial<TextBoxElement> = {};

  let updated = false;

  const height = getHeight();

  const currentContent = getTextElement()?.getContent() ?? '';
  const currentContentBottom = getTextElementBottom()?.getContent() ?? '';
  const currentContentLeft = getTextElementLeft()?.getContent() ?? '';
  const currentContentRight = getTextElementRight()?.getContent() ?? '';
  const currentContentCenter = getTextElementCenter()?.getContent() ?? '';

  // This should never happen, but if it does, we don't want
  // to save garbage values.
  if (height == null) {
    return;
  }

  // Nothing actually changed, so do nothing
  if (props.editMode && props.element.content !== currentContent) {
    updates.content = currentContent;
    updated = true;
  }

  if (props.editMode && props.element.contentBottom !== currentContentBottom) {
    updates.contentBottom = currentContentBottom;
    updated = true;
  }

  if (props.editMode && props.element.contentLeft !== currentContentLeft) {
    updates.contentLeft = currentContentLeft;
    updated = true;
  }

  if (props.editMode && props.element.contentRight !== currentContentRight) {
    updates.contentRight = currentContentRight;
    updated = true;
  }

  if (props.editMode && props.element.contentCenter !== currentContentCenter) {
    updates.contentCenter = currentContentCenter;
    updated = true;
  }

  if (
    !props.element.inline &&
    Math.abs(props.element.height - height) > 0.001
  ) {
    updates.height = height;
    updated = true;
  }

  if (updated) {
    emit('update', updates);
  }
}

function blur() {
  getTextElement()?.blur();
}

function focus() {
  getTextElement()?.focus(true);
}

function setupResizeObserver() {
  const textElement = getTextElement();
  const textElementLeft = getTextElementLeft();
  const textElementCenter = getTextElementCenter();
  const textElementRight = getTextElementRight();

  if (
    textElement ||
    (textElementLeft && textElementCenter && textElementRight)
  ) {
    const elements = [
      textElement,
      textElementLeft,
      textElementCenter,
      textElementRight,
    ]
      .filter((element) => element != null)
      .map((element) => element.htmlElement);

    observeResize(
      elements,
      throttle(100, () => {
        const resizedHeight = getHeight();

        if (
          resizedHeight != null &&
          Math.abs(props.element.height - resizedHeight) > 0.001
        ) {
          emit('update', { height: resizedHeight });
        }
      }),
    );
  }
}

function getHeight() {
  if (props.element.multipanel) {
    if (
      getTextElementLeft() == null ||
      getTextElementCenter() == null ||
      getTextElementRight() == null
    ) {
      return null;
    }

    const zoom = Number(
      getComputedStyle(getTextElementCenter()!.htmlElement).getPropertyValue(
        '--zoom',
      ),
    );

    return (
      Math.max(
        getTextElementLeft()!.htmlElement.getBoundingClientRect().height,
        getTextElementCenter()!.htmlElement.getBoundingClientRect().height,
        getTextElementRight()!.htmlElement.getBoundingClientRect().height,
      ) / zoom
    );
  }

  if (getTextElement() == null) {
    return null;
  }

  const zoom = Number(
    getComputedStyle(getTextElement()!.htmlElement).getPropertyValue('--zoom'),
  );

  return getTextElement()!.htmlElement.getBoundingClientRect().height / zoom;
}

function onBlur() {
  if (!unmounting.value) {
    update();
  }
}

defineExpose({
  blur,
  focus,
  getTextElement,
  htmlElement,
});
</script>

<style scoped>
.text-box-container {
  box-sizing: border-box;
  min-height: 10px;
}

.text-box-multipanel-container {
  display: flex;
}

.text-box {
  display: block;
  box-sizing: border-box;
  min-height: 10px;
}

.text-box:focus {
  outline: none;
}

.text-box:focus:not(.multipanel) {
  outline: var(--ck-focus-ring);
  background-color: white;
  position: relative;
  z-index: 1;
}

.text-box.inline-top {
  display: flex;
  flex-direction: column;
  justify-content: center;
  white-space: nowrap !important;
}

.text-box.inline-bottom {
  display: inline-block;
  position: relative;
  white-space: nowrap !important;
}

.text-box.underline {
  text-decoration: underline;
}

.text-box.multipanel {
  border: 1px dotted black;
  box-sizing: border-box;
  min-width: 2.5rem;
}

.text-box.left {
  position: absolute;
  left: 0;
}

.text-box.center {
  flex: 1;
  text-align: center;
}

.text-box.right {
  position: absolute;
  right: 0;
  text-align: right;
}

.text-box-container .handle {
  bottom: calc(50% - 5px);
  left: -10px;

  z-index: 1;

  display: none;
}

.text-box-container.selected .handle {
  display: inline;
}

.inline-container {
  display: flex;
  flex-direction: column;
}

.inline-container,
.text-box.single {
  outline: 1px dotted black;
}

.selected .inline-container,
.selected .text-box.single {
  outline: 1px solid goldenrod;
}

@media print {
  .text-box-container .handle {
    display: none !important;
  }

  .text-box.multipanel {
    border: none !important;
    outline: none !important;
  }
}
</style>
