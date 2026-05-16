<template>
  <div
    class="drop-cap-container"
    :style="containerStyle"
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

<script lang="ts">
import { defineComponent, PropType, StyleValue } from 'vue';

import ContentEditable from '@/components/ContentEditable.vue';
import { DropCapElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { withZoom } from '@/utils/withZoom';

export default defineComponent({
  components: { ContentEditable },
  props: {
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
  },
  emits: ['update:content', 'select-single'],

  data() {
    return {};
  },

  computed: {
    textElement() {
      return this.$refs.text as InstanceType<typeof ContentEditable>;
    },

    style() {
      const style = {
        color: this.element.computedColor,
        fontFamily: getFontFamilyWithFallback(this.element.computedFontFamily),
        fontSize: withZoom(this.element.computedFontSize),
        fontWeight: this.element.computedFontWeight,
        fontStyle: this.element.computedFontStyle,
        lineHeight: `${this.element.computedLineHeight ?? 'normal'}`,
        webkitTextStrokeWidth: withZoom(this.element.computedStrokeWidth),
      } as StyleValue;

      return style;
    },

    containerStyle() {
      return {
        direction: this.pageSetup.melkiteRtl ? 'rtl' : undefined,
      } as StyleValue;
    },
  },

  methods: {
    focus() {
      if (this.editable) {
        this.textElement.focus(true);
      }
    },

    blur() {
      this.textElement.blur();
    },

    updateContent(content: string) {
      // Nothing actually changed, so do nothing
      if (this.element.content === content) {
        return;
      }

      this.$emit('update:content', content);
    },
  },
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
