<template>
  <span contenteditable="true" @blur="onBlur" v-html="content" @focus="onFocus"></span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class ContentEditable extends Vue {
  @Prop() content!: string;
  @Prop({default: true}) selectAllOnFocus!: boolean;

  onBlur() {
    this.$emit('blur', (this.$el as HTMLElement).innerText);
  }

  onFocus() {
    if (this.selectAllOnFocus) {
      setTimeout(() => {
        document.execCommand('selectAll', false)
      }, 0);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
