<template>
  <div class="martyria-toolbar">
    <div class="row">
      <button class="neume-button" @click="setFthora(Fthora.DiatonicNiLow_TopRight)"><Neume class="red neume fthora" :neume="Fthora.DiatonicNiLow_TopCenter" /></button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicPa_TopRight)"><Neume class="red neume fthora" :neume="Fthora.DiatonicPa_TopCenter" /></button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicVou_TopRight)"><Neume class="red neume fthora" :neume="Fthora.DiatonicVou_TopCenter" /></button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicGa_TopRight)"><Neume class="red neume fthora" :neume="Fthora.DiatonicGa_TopCenter" /></button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicThi_TopRight)"><Neume class="red neume fthora" :neume="Fthora.DiatonicThi_TopCenter" /></button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicKe_TopRight)"><Neume class="red neume fthora" :neume="Fthora.DiatonicKe_TopCenter" /></button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicZo_TopRight)"><Neume class="red neume fthora" :neume="Fthora.DiatonicZo_TopCenter" /></button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicNiHigh_TopRight)"><Neume class="red neume fthora" :neume="Fthora.DiatonicNiHigh_TopCenter" /></button>
      <span class="space"></span>
      <button class="neume-button" @click="setFthora(Fthora.SoftChromaticPa_TopRight)"><Neume class="red neume fthora" :neume="Fthora.SoftChromaticPa_TopCenter" /></button>
      <button class="neume-button" @click="setFthora(Fthora.SoftChromaticThi_TopRight)"><Neume class="red neume fthora" :neume="Fthora.SoftChromaticThi_TopCenter" /></button>
      <span class="space"></span>
      <button class="neume-button" @click="setFthora(Fthora.HardChromaticPa_TopRight)"><Neume class="red neume fthora" :neume="Fthora.HardChromaticPa_TopCenter" /></button>
      <button class="neume-button" @click="setFthora(Fthora.HardChromaticThi_TopRight)"><Neume class="red neume fthora" :neume="Fthora.HardChromaticThi_TopCenter" /></button>
      <span class="space"></span>
      <button class="neume-button" @click="setFthora(Fthora.GeneralFlat_TopRight)"><Neume class="red neume fthora" :neume="Fthora.GeneralFlat_TopCenter" /></button>
      <button class="neume-button" @click="setFthora(Fthora.GeneralSharp_TopRight)"><Neume class="red neume fthora" :neume="Fthora.GeneralSharp_TopCenter" /></button>
      <button class="neume-button" @click="setFthora(Fthora.Enharmonic_TopRight)"><Neume class="red neume fthora" :neume="Fthora.Enharmonic_TopCenter" /></button>
      <span class="space"></span>
      <button class="neume-button" @click="setFthora(Fthora.Zygos_TopRight)"><Neume class="red neume fthora" :neume="Fthora.Zygos_TopCenter" /></button>
      <button class="neume-button" @click="setFthora(Fthora.Kliton_TopRight)"><Neume class="red neume fthora" :neume="Fthora.Kliton_TopCenter" /></button>
      <button class="neume-button" @click="setFthora(Fthora.Spathi_TopRight)"><Neume class="red neume fthora" :neume="Fthora.Spathi_TopCenter" /></button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { MartyriaElement } from '@/models/Element';
import { Fthora } from '@/models/Neumes';
import Neume from './Neume.vue';
import { areFthorasEquivalent } from '@/models/NeumeReplacements';

@Component({
  components: {
    Neume
  }
})
export default class MartyriaToolbar extends Vue {
  @Prop() element!: MartyriaElement;
  Fthora = Fthora;
  
  private setFthora(neume: Fthora) {
    if (this.element.fthora != null && areFthorasEquivalent(neume, this.element.fthora)) {
      this.element.fthora = null;
    }
    else {
      this.element.fthora = neume;
    }

    this.$emit('scoreUpdated');
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .martyria-toolbar {
    background-color: lightgray;

    padding: 0.25rem;
  }

  .row {
    display: flex;
  }

  .red {
    color: red;
  }

  .neume {
    font-size: 25px;
  }

  .neume-button {
    height: 32px;
    width: 32px;

    position: relative;
  }

  .space {
    width: 16px;
  }

  .fthora {
    left: 18px;
  }
  </style>
