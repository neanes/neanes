<template>
  <div
    class="drop-cap-container"
    @click="$emit('select-single')"
    :style="containerStyle"
  >
    <ContentEditable
      ref="text"
      class="drop-cap"
      :style="style"
      :content="element.content"
      @blur="updateContent"
    ></ContentEditable>
  </div>
</template>

<script lang="ts">
import { StyleValue } from 'vue';
import { Component, Prop, Vue } from 'vue-facing-decorator';

import ContentEditable from '@/components/ContentEditable.vue';
import { DropCapElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { withZoom } from '@/utils/withZoom';

@Component({
  components: { ContentEditable },
  emits: ['update:content', 'select-single'],
})
export default class DropCap extends Vue {
  @Prop() element!: DropCapElement;
  @Prop() pageSetup!: PageSetup;

  editable: boolean = false;

  get textElement() {
    return this.$refs.text as ContentEditable;
  }

  get style() {
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
  }

  get containerStyle() {
    return {
      direction: this.pageSetup.melkiteRtl ? 'rtl' : undefined,
    } as StyleValue;
  }

  focus() {
    this.textElement.focus(true);
  }

  blur() {
    this.textElement.blur();
  }

  updateContent(content: string) {
    // Nothing actually changed, so do nothing
    if (this.element.content === content) {
      return;
    }

    this.$emit('update:content', content);
  }
}
</script>

<style scoped>
.drop-cap:focus {
  outline: none;
}
</style>
