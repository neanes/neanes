<template>
  <div class="neume" :style="style">
    <Neume
      :neume="neume.neume"
      :fontFamily="pageSetup.neumeDefaultFontFamily"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { TempoElement } from '@/models/Element';
import Neume from '@/components/Neume.vue';
import { withZoom } from '@/utils/withZoom';
import { PageSetup } from '@/models/PageSetup';

@Component({
  components: {
    Neume,
  },
})
export default class NeumeBoxMartyria extends Vue {
  @Prop() neume!: TempoElement;
  @Prop() pageSetup!: PageSetup;

  get style() {
    return {
      color: this.pageSetup.tempoDefaultColor,
      fontSize: withZoom(this.pageSetup.neumeDefaultFontSize),
      webkitTextStrokeWidth: withZoom(this.pageSetup.tempoDefaultStrokeWidth),
    } as CSSStyleDeclaration;
  }
}
</script>

<style scoped></style>
