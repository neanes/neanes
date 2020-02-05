<template>
  <span contenteditable="true" @blur="onBlur" v-html="content"></span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class ContentEditable extends Vue {
  @Prop() content!: string;

  onBlur() {
    this.$emit('blur', (this.$el as HTMLElement).innerText);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
