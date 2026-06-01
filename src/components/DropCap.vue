<template>
  <div
    ref="container"
    class="drop-cap-container"
    dir="auto"
    @click="$emit('select-single')"
  >
    <span class="handle"></span>

    <ContentEditable
      ref="text"
      class="drop-cap"
      :style="style"
      :content="element.content"
      :editable="editable"
      @blur="updateContent"
    ></ContentEditable>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType, StyleValue, useTemplateRef } from 'vue';
import { ComponentExposed } from 'vue-component-type-helpers';

import ContentEditable from '@/components/ContentEditable.vue';
import { DropCapElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { withZoom } from '@/utils/withZoom';

const emit = defineEmits(['update:content', 'select-single']);
const props = defineProps({
  element: {
    type: Object as PropType<DropCapElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  editable: {
    type: Boolean,
    required: true,
  },
});

const container = useTemplateRef<HTMLElement>('container');
const text = useTemplateRef<ComponentExposed<typeof ContentEditable>>('text');

const htmlElement = computed(() => container.value!);
const textElement = computed(() => text.value!);

const style = computed(() => {
  const style = {
    color: props.element.computedColor,
    fontFamily: getFontFamilyWithFallback(props.element.computedFontFamily),
    fontSize: withZoom(props.element.computedFontSize),
    fontWeight: props.element.computedFontWeight,
    fontStyle: props.element.computedFontStyle,
    lineHeight: `${props.element.computedLineHeight ?? 'normal'}`,
    webkitTextStrokeWidth: withZoom(props.element.computedStrokeWidth),
  } as StyleValue;

  return style;
});

function focus() {
  if (props.editable) {
    textElement.value.focus(true);
  }
}

function blur() {
  textElement.value.blur();
}

function updateContent(content: string) {
  // Nothing actually changed, so do nothing
  if (props.element.content === content) {
    return;
  }

  emit('update:content', content);
}

defineExpose({
  blur,
  focus,
  htmlElement,
  textElement,
});
</script>

<style scoped>
.drop-cap:focus {
  outline: none;
}

.drop-cap-container .handle {
  bottom: calc(50% - 5px);
  left: -10px;

  z-index: 1;

  display: none;
}
</style>
