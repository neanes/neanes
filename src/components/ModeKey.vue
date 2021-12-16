<template>
  <div class="mode-key-container" :style="style">
    <template v-for="(neume, index) in element.neumes">
      <Neume :neume="neume" :key="index" />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ModeKeyElement } from '@/models/Element';
import ContentEditable from '@/components/ContentEditable.vue';
import Neume from '@/components/Neume.vue';
import { store } from '@/store';

@Component({
  components: {
    ContentEditable,
    Neume,
  },
})
export default class ModeKey extends Vue {
  @Prop() element!: ModeKeyElement;

  get style() {
    return  {
      color: this.element.color,
      fontSize: this.element.fontSize + 'px',
      textAlign: this.element.alignment,
    } as CSSStyleDeclaration;
  }
}
</script>

<style scoped>
 .mode-key-container {
   width: 624px;
   border: 1px dotted black;
   box-sizing: border-box;
 }
</style>