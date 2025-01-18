<template>
  <div
    class="mode-key-container"
    :style="style"
    @click="$emit('select-single')"
  >
    <Neume :neume="ModeSign.Ekhos" />
    <Neume v-if="element.isPlagal" :neume="ModeSign.Plagal" />
    <Neume v-if="element.isVarys" :neume="ModeSign.Varys" />
    <Neume :neume="element.martyria" />
    <Neume v-if="hasNote" :neume="element.note" />
    <Neume v-if="hasFthoraAboveNote" :neume="element.fthoraAboveNote" />
    <Neume
      v-if="hasQuantitativeNeumeAboveNote"
      :neume="element.quantitativeNeumeAboveNote"
    />
    <Neume v-if="hasNote2" :neume="element.note2" />
    <Neume v-if="hasFthoraAboveNote2" :neume="element.fthoraAboveNote2" />
    <Neume
      v-if="hasQuantitativeNeumeAboveNote2"
      :neume="element.quantitativeNeumeAboveNote2"
    />
    <Neume
      v-if="hasQuantitativeNeumeRight"
      :neume="element.quantitativeNeumeRight"
    />
    <Neume
      v-if="hasFthoraAboveQuantitativeNeumeRight"
      :neume="element.fthoraAboveQuantitativeNeumeRight"
    />
    <Neume
      v-if="hasTempo && !element.tempoAlignRight"
      :neume="element.tempo"
      :style="tempoStyle"
    />
    <span class="right-container">
      <span class="ambitus" v-if="element.showAmbitus">
        <span class="ambitus-text">(</span>
        <span class="ambitus-low" :style="ambitusStyle">
          <Neume :neume="element.ambitusLowNote" />
          <Neume :neume="element.ambitusLowRootSign" />
        </span>
        <span class="ambitus-text">-</span>
        <span class="ambitus-high" :style="ambitusStyle">
          <Neume :neume="element.ambitusHighNote" />
          <Neume :neume="element.ambitusHighRootSign" />
        </span>
        <span class="ambitus-text">)</span>
      </span>

      <Neume
        v-if="hasTempo && element.tempoAlignRight"
        :neume="element.tempo"
        :style="tempoStyle"
      />
    </span>
  </div>
</template>

<script lang="ts">
import { StyleValue } from 'vue';
import { Component, Prop, Vue } from 'vue-facing-decorator';

import Neume from '@/components/Neume.vue';
import { ModeKeyElement } from '@/models/Element';
import { ModeSign } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

@Component({
  components: {
    Neume,
  },
  emits: ['select-single'],
})
export default class ModeKey extends Vue {
  @Prop() element!: ModeKeyElement;
  @Prop() pageSetup!: PageSetup;
  ModeSign = ModeSign;

  get hasFthoraAboveNote() {
    return this.element.fthoraAboveNote != null;
  }

  get hasNote() {
    return this.element.note != null;
  }

  get hasNote2() {
    return this.element.note2 != null;
  }

  get hasFthoraAboveNote2() {
    return this.element.fthoraAboveNote2 != null;
  }

  get hasFthoraAboveQuantitativeNeumeRight() {
    return this.element.fthoraAboveQuantitativeNeumeRight != null;
  }

  get hasQuantitativeNeumeAboveNote() {
    return this.element.quantitativeNeumeAboveNote != null;
  }

  get hasQuantitativeNeumeAboveNote2() {
    return this.element.quantitativeNeumeAboveNote2 != null;
  }

  get hasQuantitativeNeumeRight() {
    return this.element.quantitativeNeumeRight != null;
  }

  get hasTempo() {
    return this.element.tempo != null;
  }

  get style() {
    return {
      color: this.element.computedColor,
      fontFamily: this.element.computedFontFamily,
      fontSize: withZoom(this.element.computedFontSize),
      textAlign: this.element.alignment,
      width: withZoom(this.element.width),
      height: withZoom(this.element.height),
      webkitTextStrokeWidth: withZoom(this.element.computedStrokeWidth),
    } as StyleValue;
  }

  get tempoStyle() {
    // TODO figure out a way to remove the hard-coded -.45em
    // maybe put it in the font metadata json?
    const style = {
      color: this.pageSetup.tempoDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.tempoDefaultStrokeWidth),
      top: '-0.45em',
      marginLeft: withZoom(8),
    } as StyleValue;

    return style;
  }

  get ambitusStyle() {
    // TODO figure out a way to remove the hard-coded -.45em
    // maybe put it in the font metadata json?
    const style = {
      color: this.pageSetup.martyriaDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.martyriaDefaultStrokeWidth,
      ),
      position: 'relative',
      top: '-0.45em',
    } as StyleValue;

    return style;
  }
}
</script>

<style scoped>
.mode-key-container {
  border: 1px dotted black;
  box-sizing: border-box;
  user-select: none;

  position: relative;
}

.right-container {
  position: absolute;
  right: 0;
}

.ambitus {
  position: relative;
  top: calc(-4px * var(--zoom));
}

.ambitus-text {
  font-family: Arial, Helvetica, sans-serif;
}

.ambitus-low {
  margin-right: 10px;
}

.ambitus-high {
  margin-left: 2px;
  margin-right: 4px;
}
</style>
