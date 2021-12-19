<template>
  <div class="neume" :style="style">
    <template v-if="neume.error">
      ?
    </template>
    <template v-else>
      <Neume :neume="neume.note"></Neume>
      <Neume :neume="neume.rootSign"></Neume>
      <Neume v-if="hasFthora" :neume="neume.fthora"></Neume>
      <Neume v-if="neume.apostrophe" :neume="Note.Apostrophe"></Neume>
      <Neume v-if="hasMeasureBar" :neume="neume.measureBar" class="red"></Neume>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { MartyriaElement } from '@/models/Element';
import { neumeMap } from '@/models/NeumeMappings';
import Neume  from '@/components/Neume.vue'
import { store } from '@/store';
import { Note } from '@/models/Neumes';

@Component({
  components: {
    Neume
  }
})
export default class NeumeBoxMartyria extends Vue {
  @Prop() neume!: MartyriaElement;
  Note = Note;

  get pageSetup() {
    return store.state.score.pageSetup;
  }

  get noteMapping() {
    return neumeMap.get(this.neume.note!)!;
  }

  get rootSignMapping() {
    return neumeMap.get(this.neume.rootSign!)!;
  }

  get hasFthora() {
    return this.neume.fthora != null;
  }

  get hasMeasureBar() {
    return this.neume.measureBar != null;
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
