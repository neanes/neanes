<template>
  <div class="neume" :style="style">
    <template v-if="neume.error">
      ?
    </template>
    <template v-else>
      <Neume :neume="neume.note"></Neume>
      <Neume :neume="neume.rootSign"></Neume>
      <Neume v-if="neume.apostrophe" neume="Apostrophe"></Neume>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { MartyriaElement } from '@/models/Element';
import { neumeMap } from '@/models/NeumeMappings';
import Neume  from '@/components/Neume.vue'
import { store } from '@/store';

@Component({
  components: {
    Neume
  }
})
export default class NeumeBoxMartyria extends Vue {
  @Prop() neume!: MartyriaElement;

  get pageSetup() {
    return store.state.score.pageSetup;
  }

  get noteMapping() {
    return neumeMap.get(this.neume.note!)!;
  }

  get rootSignMapping() {
    return neumeMap.get(this.neume.rootSign!)!;
  }

  get style() {
    return {
      color: this.pageSetup.martyriaDefaultColor,
      fontSize: this.pageSetup.neumeDefaultFontSize + 'px',
    } as CSSStyleDeclaration;
  }
}
</script>

<style scoped>

</style>
