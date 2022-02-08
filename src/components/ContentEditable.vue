<template>
  <span
    :contenteditable="contentEditable"
    @blur="onBlur"
    v-html="content"
  ></span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class ContentEditable extends Vue {
  @Prop() content!: string;
  @Prop({ default: true }) selectAllOnFocus!: boolean;
  @Prop({ default: true }) editable!: boolean;
  @Prop({ default: true }) plaintextOnly!: boolean;

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
<style scoped></style>
