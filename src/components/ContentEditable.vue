<template>
  <span
    class="contenteditable"
    :contenteditable="contentEditable"
    :style="style"
    @blur="onBlur"
    @focus="$emit('focus')"
    @click="$emit('click')"
    v-html="content"
  ></span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

@Component({
  emits: ['click', 'focus', 'blur'],
})
export default class ContentEditable extends Vue {
  @Prop() content!: string;
  @Prop({ default: true }) selectAllOnFocus!: boolean;
  @Prop({ default: true }) editable!: boolean;
  @Prop({ default: true }) plaintextOnly!: boolean;
  @Prop({ default: 'break-spaces' }) whiteSpace!: string;

  get contentEditable() {
    return this.editable
      ? this.plaintextOnly
        ? 'plaintext-only'
        : 'true'
      : 'false';
  }

  get htmlElement() {
    return this.$el as HTMLElement;
  }

  get style() {
    return {
      whiteSpace: this.whiteSpace,
    } as CSSStyleDeclaration;
  }

  getInnerText() {
    return this.htmlElement.innerText;
  }

  onBlur() {
    this.$emit('blur', this.htmlElement.innerText);
  }

  focus(selectAll: boolean) {
    this.htmlElement.focus();

    if (selectAll) {
      document.execCommand('selectAll', false);
    }
  }

  blur() {
    this.htmlElement.blur();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.contenteditable {
  overflow-wrap: break-word;
}
</style>
