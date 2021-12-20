<template>
  <div class="neume" :style="style">
    <Neume :neume="neume.neume"></Neume>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { TempoElement } from '@/models/Element';
import Neume  from '@/components/Neume.vue'
import { store } from '@/store';

@Component({
  components: {
    Neume
  }
})
export default class NeumeBoxMartyria extends Vue {
  @Prop() neume!: TempoElement;

  get pageSetup() {
    return store.state.score.pageSetup;
  }

  get style() {
    return {
      color: this.pageSetup.tempoDefaultColor,
      fontSize: this.pageSetup.neumeDefaultFontSize + 'px',
    } as CSSStyleDeclaration;
  }
}
</script>

<style scoped>

</style>
