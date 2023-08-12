<template>
  <div
    class="neume"
    :style="style"
    @click.exact="$emit('select-single')"
    @click.shift.exact="$emit('select-range')"
  >
    <Neume
      :neume="neume.neume"
      :fontFamily="pageSetup.neumeDefaultFontFamily"
    />
  </div>
</template>

<script lang="ts">
import { StyleValue } from 'vue';
import { Component, Prop, Vue } from 'vue-facing-decorator';

import Neume from '@/components/Neume.vue';
import { TempoElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

@Component({
  components: {
    Neume,
  },
  emits: ['select-single', 'select-range'],
})
export default class NeumeBoxMartyria extends Vue {
  @Prop() neume!: TempoElement;
  @Prop() pageSetup!: PageSetup;

  get style() {
    return {
      color: this.pageSetup.tempoDefaultColor,
      fontSize: withZoom(this.pageSetup.neumeDefaultFontSize),
      webkitTextStrokeWidth: withZoom(this.pageSetup.tempoDefaultStrokeWidth),
    } as StyleValue;
  }
}
</script>

<style scoped>
.neume {
  cursor: default;
  user-select: none;
}
</style>
