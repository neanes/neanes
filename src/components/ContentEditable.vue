<template>
  <span
    class="contenteditable"
    :contenteditable="contentEditable as any"
    :style="style"
    @blur="onBlur"
    @focus="$emit('focus')"
    @click="$emit('click')"
    v-html="content"
  ></span>
</template>

<script lang="ts">
import { StyleValue } from 'vue';
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
    } as StyleValue;
  }

  getInnerText() {
    return this.htmlElement.innerText;
  }

  getContent() {
    return this.escapeHtml(this.htmlElement.innerText);
  }

  onBlur() {
    this.$emit('blur', this.getContent());
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

  setInnerText(text: string) {
    this.htmlElement.innerText = text;
  }

  escapeHtml(text: string) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(text));
    return p.innerHTML;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.contenteditable {
  overflow-wrap: break-word;
}
</style>
