<template>
  <div class="neume-toolbar">
    <div class="row">
      <button
        class="neume-button"
        @click="setAccidental(Accidental.Flat_2_Right)"
      >
        <Neume class="red neume flat" :neume="Accidental.Flat_2_Right" />
      </button>
      <button
        class="neume-button"
        @click="setAccidental(Accidental.Sharp_2_Left)"
      >
        <Neume class="red neume sharp" :neume="Accidental.Sharp_2_Left" />
      </button>
      <span class="space"></span>
      <button class="neume-button" @click="setTimeNeume(TimeNeume.Klasma_Top)">
        <Neume class="neume klasma-top" :neume="TimeNeume.Klasma_Top" />
      </button>
      <button
        class="neume-button"
        @click="setTimeNeume(TimeNeume.Klasma_Bottom)"
      >
        <Neume class="neume klasma-bottom" :neume="TimeNeume.Klasma_Bottom" />
      </button>
      <button class="neume-button" @click="setTimeNeume(TimeNeume.Hapli)">
        <Neume class="neume hapli" :neume="TimeNeume.Hapli" />
      </button>
      <button class="neume-button" @click="setTimeNeume(TimeNeume.Dipli)">
        <Neume class="neume dipli" :neume="TimeNeume.Dipli" />
      </button>
      <button class="neume-button" @click="setTimeNeume(TimeNeume.Tripli)">
        <Neume class="neume tripli" :neume="TimeNeume.Tripli" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="setGorgonNeume(GorgonNeume.Gorgon_Top)"
      >
        <Neume class="red neume gorgon-top" :neume="GorgonNeume.Gorgon_Top" />
      </button>
      <button
        class="neume-button"
        @click="setGorgonNeume(GorgonNeume.Gorgon_Bottom)"
      >
        <Neume
          class="red neume gorgon-bottom"
          :neume="GorgonNeume.Gorgon_Bottom"
        />
      </button>
      <button
        class="neume-button"
        @click="setGorgonNeume(GorgonNeume.GorgonDottedLeft)"
      >
        <Neume
          class="red neume gorgon-dotted-left"
          :neume="GorgonNeume.GorgonDottedLeft"
        />
      </button>
      <button
        class="neume-button"
        @click="setGorgonNeume(GorgonNeume.GorgonDottedRight)"
      >
        <Neume
          class="red neume gorgon-dotted-right"
          :neume="GorgonNeume.GorgonDottedRight"
        />
      </button>
      <button
        class="neume-button"
        @click="setGorgonNeume(GorgonNeume.Digorgon)"
      >
        <Neume class="red neume digorgon" :neume="GorgonNeume.Digorgon" />
      </button>
      <button
        class="neume-button"
        @click="setGorgonNeume(GorgonNeume.Trigorgon)"
      >
        <Neume class="red neume trigorgon" :neume="GorgonNeume.Trigorgon" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.Vareia)"
      >
        <Neume class="neume vareia" :neume="VocalExpressionNeume.Vareia" />
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.Homalon)"
      >
        <Neume
          class="neume homalon"
          :neume="VocalExpressionNeume.Homalon"
        /><span class="homalon-1">1</span>
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.HomalonConnecting)"
      >
        <Neume
          class="neume homalon"
          :neume="VocalExpressionNeume.Homalon"
        /><span class="homalon-2">2</span>
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.Antikenoma)"
      >
        <Neume
          class="neume antikenoma"
          :neume="VocalExpressionNeume.Antikenoma"
        />
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.Psifiston)"
      >
        <Neume
          class="neume psifiston"
          :neume="VocalExpressionNeume.Psifiston"
        />
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.Heteron)"
      >
        <Neume
          class="red neume heteron"
          :neume="VocalExpressionNeume.Heteron"
        />
      </button>
      <span class="space"></span>
      <button class="neume-button" @click="setGorgonNeume(GorgonNeume.Argon)">
        <Neume class="red neume argon" :neume="GorgonNeume.Argon" />
      </button>
      <button
        class="neume-button"
        @click="setGorgonNeume(GorgonNeume.Hemiolion)"
      >
        <Neume class="red neume hemiolion" :neume="GorgonNeume.Hemiolion" />
      </button>
      <button class="neume-button" @click="setGorgonNeume(GorgonNeume.Diargon)">
        <Neume class="red neume diargon" :neume="GorgonNeume.Diargon" />
      </button>
    </div>
    <div class="row">
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.DiatonicNiLow_TopCenter,
            Fthora.DiatonicNiLow_BottomCenter,
          ])
        "
      >
        <Neume
          class="red neume fthora"
          :neume="Fthora.DiatonicNiLow_TopCenter"
        />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.DiatonicPa_TopCenter,
            Fthora.DiatonicPa_BottomCenter,
          ])
        "
      >
        <Neume class="red neume fthora" :neume="Fthora.DiatonicPa_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="setFthora([Fthora.DiatonicVou_TopCenter])"
      >
        <Neume class="red neume fthora" :neume="Fthora.DiatonicVou_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="setFthora([Fthora.DiatonicGa_TopCenter])"
      >
        <Neume class="red neume fthora" :neume="Fthora.DiatonicGa_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.DiatonicThi_TopCenter,
            Fthora.DiatonicThi_BottomCenter,
          ])
        "
      >
        <Neume class="red neume fthora" :neume="Fthora.DiatonicThi_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.DiatonicKe_TopCenter,
            Fthora.DiatonicKe_BottomCenter,
          ])
        "
      >
        <Neume class="red neume fthora" :neume="Fthora.DiatonicKe_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="setFthora([Fthora.DiatonicZo_TopCenter])"
      >
        <Neume class="red neume fthora" :neume="Fthora.DiatonicZo_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.DiatonicNiHigh_TopCenter,
            Fthora.DiatonicNiHigh_BottomCenter,
          ])
        "
      >
        <Neume
          class="red neume fthora"
          :neume="Fthora.DiatonicNiHigh_TopCenter"
        />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.SoftChromaticPa_TopCenter,
            Fthora.SoftChromaticPa_BottomCenter,
          ])
        "
      >
        <Neume
          class="red neume fthora"
          :neume="Fthora.SoftChromaticPa_TopCenter"
        />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.SoftChromaticThi_TopCenter,
            Fthora.SoftChromaticThi_BottomCenter,
          ])
        "
      >
        <Neume
          class="red neume fthora"
          :neume="Fthora.SoftChromaticThi_TopCenter"
        />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.HardChromaticPa_TopCenter,
            Fthora.HardChromaticPa_BottomCenter,
          ])
        "
      >
        <Neume
          class="red neume fthora"
          :neume="Fthora.HardChromaticPa_TopCenter"
        />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.HardChromaticThi_TopCenter,
            Fthora.HardChromaticThi_BottomCenter,
          ])
        "
      >
        <Neume
          class="red neume fthora"
          :neume="Fthora.HardChromaticThi_TopCenter"
        />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.GeneralFlat_TopCenter,
            Fthora.GeneralFlat_BottomCenter,
          ])
        "
      >
        <Neume class="red neume fthora" :neume="Fthora.GeneralFlat_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.GeneralSharp_TopCenter,
            Fthora.GeneralSharp_BottomCenter,
          ])
        "
      >
        <Neume
          class="red neume fthora"
          :neume="Fthora.GeneralSharp_TopCenter"
        />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.Enharmonic_TopCenter,
            Fthora.Enharmonic_BottomCenter,
          ])
        "
      >
        <Neume class="red neume fthora" :neume="Fthora.Enharmonic_TopCenter" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="setFthora([Fthora.Zygos_TopCenter, Fthora.Zygos_BottomCenter])"
      >
        <Neume class="red neume fthora" :neume="Fthora.Zygos_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([Fthora.Kliton_TopCenter, Fthora.Kliton_BottomCenter])
        "
      >
        <Neume class="red neume fthora" :neume="Fthora.Kliton_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="setFthora([Fthora.Spathi_TopCenter])"
      >
        <Neume class="red neume fthora" :neume="Fthora.Spathi_TopCenter" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="setMeasureBar(MeasureBar.MeasureBarRight)"
      >
        <Neume
          class="red neume measure-bar-right"
          :neume="MeasureBar.MeasureBarRight"
        />
      </button>
      <button
        class="neume-button"
        @click="setMeasureBar(MeasureBar.MeasureBarTop)"
      >
        <Neume
          class="red neume measure-bar-top"
          :neume="MeasureBar.MeasureBarTop"
        />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { MartyriaElement, NoteElement } from '@/models/Element';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  MeasureBar,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import Neume from './Neume.vue';
import {
  areFthorasEquivalent,
  areGorgonsEquivalent,
  areTimeNeumesEquivalent,
  areVocalExpressionsEquivalent,
} from '@/models/NeumeReplacements';

@Component({
  components: {
    Neume,
  },
})
export default class NeumeToolbar extends Vue {
  @Prop() element!: NoteElement;
  Accidental = Accidental;
  VocalExpressionNeume = VocalExpressionNeume;
  TimeNeume = TimeNeume;
  GorgonNeume = GorgonNeume;
  Fthora = Fthora;
  MeasureBar = MeasureBar;

  private setAccidental(neume: Accidental) {
    if (this.element.accidental != null && this.element.accidental === neume) {
      this.element.setAccidental(null);
    } else {
      this.element.setAccidental(neume);
    }

    this.$emit('scoreUpdated');
  }

  private setTimeNeume(neume: TimeNeume) {
    if (
      this.element.timeNeume != null &&
      areTimeNeumesEquivalent(neume, this.element.timeNeume)
    ) {
      this.element.setTimeNeume(null);
    } else {
      this.element.setTimeNeume(neume);
    }

    this.$emit('scoreUpdated');
  }

  private setGorgonNeume(neume: GorgonNeume) {
    if (
      this.element.gorgonNeume != null &&
      areGorgonsEquivalent(neume, this.element.gorgonNeume)
    ) {
      this.element.setGorgonNeume(null);
    } else {
      this.element.setGorgonNeume(neume);
    }

    this.$emit('scoreUpdated');
  }

  private setVocalExpression(neume: VocalExpressionNeume) {
    if (
      this.element.vocalExpressionNeume != null &&
      areVocalExpressionsEquivalent(neume, this.element.vocalExpressionNeume)
    ) {
      this.element.setVocalExpressionNeume(null);
    } else {
      this.element.setVocalExpressionNeume(neume);
    }

    this.$emit('scoreUpdated');
  }

  private setMeasureBar(neume: MeasureBar) {
    if (neume === this.element.measureBar) {
      this.element.measureBar = null;
    } else {
      this.element.measureBar = neume;
    }

    this.$emit('scoreUpdated');
  }

  private setFthora(neumes: Fthora[]) {
    let equivalent = false;

    for (let neume of neumes) {
      // If previous neume was matched, set to the next neume in the cycle
      if (equivalent) {
        this.element.setFthora(neume);
        return;
      }

      equivalent =
        this.element.fthora != null &&
        areFthorasEquivalent(neume, this.element.fthora);
    }

    // We've cycled through all the neumes.
    // If we got to the end of the cycle, remove all
    // fthora neumes. Otherwise set fthora to the first neume
    // in the cycle.
    if (equivalent) {
      this.element.setFthora(null);
    } else {
      this.element.setFthora(neumes[0]);
    }

    this.$emit('scoreUpdated');
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.neume-toolbar {
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

.sharp {
  top: -23px;
  left: 24px;
}

.flat {
  top: 2px;
  left: 2px;
}

.vareia {
  top: -10px;
}

.homalon {
  top: -15px;
  left: 10px;
  font-size: 22px;
}

.homalon-1,
.homalon-2 {
  position: absolute;
  top: 17px;
  left: 10px;
  font-size: 12px;
}

.antikenoma {
  top: -12px;
  left: 14px;
  font-size: 20px;
}

.psifiston {
  top: -10px;
  left: 13px;
  font-size: 18px;
}

.heteron {
  top: -15px;
  left: 35px;
  font-size: 20px;
}

.klasma-top {
  top: -6px;
  left: 18px;
}

.klasma-bottom {
  top: -12px;
  left: 18px;
}

.hapli {
  top: -19px;
  left: 19px;
}

.dipli {
  top: -19px;
  left: 16px;
}

.tripli {
  top: -22px;
  left: 18px;
}

.gorgon-top {
  top: -5px;
  left: 18px;
}

.gorgon-bottom {
  top: -14px;
  left: 18px;
}

.gorgon-dotted-left {
  left: 18px;
}

.gorgon-dotted-right {
  top: -2.5px;
  left: 18px;
}

.digorgon {
  left: 13px;
}

.trigorgon {
  left: 10px;
}

.fthora {
  left: 18px;
}

.argon,
.hemiolion,
.diargon {
  left: 20px;
}

.measure-bar-right {
  top: -10px;
}

.measure-bar-top {
  top: -5px;
  left: 17px;
}
</style>
