<template>
  <span
    :contenteditable="editable"
    @blur="onBlur"
    v-html="content"
    @focus="onFocus"
  ></span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class ContentEditable extends Vue {
  @Prop() content!: string;
  @Prop({ default: true }) selectAllOnFocus!: boolean;
  @Prop({ default: true }) editable!: boolean;

  onBlur() {
    this.$emit('blur', (this.$el as HTMLElement).innerText);
  }

  onFocus() {
    if (this.selectAllOnFocus) {
      setTimeout(() => {
        document.execCommand('selectAll', false);
      }, 0);
    }
  }

  focus() {
    (this.$el as HTMLElement).focus();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
