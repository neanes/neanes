<template>
  <div
    class="neume"
    :style="style"
    @click.exact="$emit('select-single')"
    @click.shift.exact="$emit('select-range')"
  >
    <template v-if="neume.error"> ? </template>
    <template v-else>
      <Neume
        v-if="hasMeasureBarLeft && !isMeasureBarAbove"
        :neume="neume.measureBarLeft"
        :style="measureBarStyle"
      />
      <Neume v-if="hasTempoLeft" :neume="neume.tempoLeft" :style="tempoStyle" />
      <Neume :neume="neume.note" />
      <Neume :neume="neume.rootSign" />
      <Neume v-if="hasFthora" :neume="neume.fthora" :style="fthoraStyle" />
      <Neume v-if="hasTempo" :neume="neume.tempo" :style="tempoStyle" />
      <Neume
        v-if="hasMeasureBarLeft && isMeasureBarAbove"
        :neume="neume.measureBarLeft"
        :style="measureBarStyle"
      />
      <Neume
        v-if="hasTempoRight"
        :neume="neume.tempoRight"
        :style="tempoStyle"
      />
      <Neume
        v-if="hasMeasureBarRight"
        :neume="neume.measureBarRight"
        :style="measureBarStyle"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { StyleValue } from 'vue';
import { Component, Prop, Vue } from 'vue-facing-decorator';

import Neume from '@/components/Neume.vue';
import { MartyriaElement } from '@/models/Element';
import { Note } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

@Component({
  components: {
    Neume,
  },
  emits: ['select-single', 'select-range'],
})
export default class NeumeBoxMartyria extends Vue {
  @Prop() neume!: MartyriaElement;
  @Prop() pageSetup!: PageSetup;

  Note = Note;

  get hasFthora() {
    return this.neume.fthora != null;
  }

  get hasTempoLeft() {
    return this.neume.tempoLeft != null;
  }

  get hasTempo() {
    return this.neume.tempo != null;
  }

  get hasTempoRight() {
    return this.neume.tempoRight != null;
  }

  get hasMeasureBarLeft() {
    return this.neume.measureBarLeft != null;
  }

  get hasMeasureBarRight() {
    return this.neume.measureBarRight != null;
  }

  get isMeasureBarAbove() {
    return this.neume.measureBarLeft?.endsWith('Above');
  }

  get style() {
    return {
      color: this.pageSetup.martyriaDefaultColor,
      fontFamily: this.pageSetup.neumeDefaultFontFamily,
      fontSize: withZoom(this.pageSetup.neumeDefaultFontSize),
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.martyriaDefaultStrokeWidth,
      ),
    } as StyleValue;
  }

  get fthoraStyle() {
    return {
      color: this.pageSetup.fthoraDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.fthoraDefaultStrokeWidth),
    } as StyleValue;
  }

  get tempoStyle() {
    return {
      color: this.pageSetup.tempoDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.tempoDefaultStrokeWidth),
    } as StyleValue;
  }

  get measureBarStyle() {
    return {
      color: this.pageSetup.measureBarDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.measureBarDefaultStrokeWidth,
      ),
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
