<template>
  <div class="neume-toolbar">
    <button class="auto-mode-btn" @click="$emit('toggleAutoMode')" :class="{ on: autoMode === true }">Auto</button>
    <span class="space"></span>
    <button class="neume-button" @click="setAccidental(Accidental.Flat_2_Left)"><Neume class="red neume flat" :neume=" Accidental.Flat_2_Right" /></button>
    <button class="neume-button" @click="setAccidental(Accidental.Sharp_2_Left)"><Neume class="red neume sharp" :neume="Accidental.Sharp_2_Left" /></button>
    <span class="space"></span>
    <button class="neume-button" @click="setTimeNeume(TimeNeume.Klasma_Top)"><Neume class="neume klasma-top" :neume="TimeNeume.Klasma_Top" /></button>
    <button class="neume-button" @click="setTimeNeume(TimeNeume.Klasma_Bottom)"><Neume class="neume klasma-bottom" :neume="TimeNeume.Klasma_Bottom" /></button>
    <button class="neume-button" @click="setTimeNeume(TimeNeume.Hapli)"><Neume class="neume hapli" :neume="TimeNeume.Hapli" /></button>
    <button class="neume-button" @click="setTimeNeume(TimeNeume.Dipli)"><Neume class="neume dipli" :neume="TimeNeume.Dipli" /></button>
    <button class="neume-button" @click="setTimeNeume(TimeNeume.Tripli)"><Neume class="neume tripli" :neume="TimeNeume.Tripli" /></button>
    <span class="space"></span>
    <button class="neume-button" @click="setVocalExpression(VocalExpressionNeume.Vareia)"><Neume class="neume vareia" :neume="VocalExpressionNeume.Vareia" /></button>
    <button class="neume-button" @click="setVocalExpression(VocalExpressionNeume.Homalon)"><Neume class="neume homalon" :neume="VocalExpressionNeume.Homalon" /><span class="homalon-1">1</span></button>
    <button class="neume-button" @click="setVocalExpression(VocalExpressionNeume.HomalonConnecting)"><Neume class="neume homalon" :neume="VocalExpressionNeume.Homalon" /><span class="homalon-2">2</span></button>
    <button class="neume-button" @click="setVocalExpression(VocalExpressionNeume.Antikenoma)"><Neume class="neume antikenoma" :neume="VocalExpressionNeume.Antikenoma" /></button>
    <button class="neume-button" @click="setVocalExpression(VocalExpressionNeume.Psifiston)"><Neume class="neume psifiston" :neume="VocalExpressionNeume.Psifiston" /></button>
    <button class="neume-button" @click="setVocalExpression(VocalExpressionNeume.Heteron)"><Neume class="red neume heteron" :neume="VocalExpressionNeume.Heteron" /></button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement } from '@/models/Element';
import { Accidental, TimeNeume, VocalExpressionNeume } from '@/models/Neumes';
import Neume from './Neume.vue';

@Component({
  components: {
    Neume
  }
})
export default class NeumeToolbar extends Vue {
  @Prop() element!: NoteElement;
  @Prop() autoMode!: boolean;
  Accidental = Accidental;
  VocalExpressionNeume = VocalExpressionNeume;
  TimeNeume = TimeNeume;
  
  private setAccidental(neume: Accidental) {
    if (this.element.accidental != null && this.element.accidental.neume === neume) {
      this.element.setAccidental(null);
    }
    else {
      this.element.setAccidental(neume);
    }

    this.$emit('scoreUpdated');
  }

  private setTimeNeume(neume: TimeNeume) {
    if (this.element.timeNeume != null && this.element.timeNeume.neume === neume) {
      this.element.setTimeNeume(null);
    }
    else {
      this.element.setTimeNeume(neume);
    }

    this.$emit('scoreUpdated');
  }

    private setVocalExpression(neume: VocalExpressionNeume) {
      if (this.element.vocalExpressionNeume != null && this.element.vocalExpressionNeume.neume === neume) {
        this.element.setVocalExpressionNeume(null);
      }
      else {
        this.element.setVocalExpressionNeume(neume);
      }

    this.$emit('scoreUpdated');
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .neume-toolbar {
    display: flex;
    background-color: lightgray;

    padding: 0.25rem;
  }

  .auto-mode-btn.on {
    background-color: lightsteelblue;
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
    top: -18px;
    left: 20px;
  }

  .dipli {
    top: -18px;
    left: 16px;
  }

  .tripli {
    top: -20px;
    left: 18px;
  }
  </style>
