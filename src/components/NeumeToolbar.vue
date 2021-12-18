<template>
  <div class="neume-toolbar">
    <button class="entry-mode-btn" @click="$emit('toggleEntryMode')" :class="{ on: entryMode === true }">Entry Mode</button>
    <button class="neume-button" @click="setAccidental(Accidental.Flat_2_Left)"><Neume class="red neume flat" :neume=" Accidental.Flat_2_Right" /></button>
    <button class="neume-button" @click="setAccidental(Accidental.Sharp_2_Left)"><Neume class="red neume sharp" :neume="Accidental.Sharp_2_Left" /></button>
    <span class="space"></span>
    <button class="neume-button" @click="setVocalExpression(VocalExpressionNeume.Vareia)"><Neume class="neume vareia" :neume="VocalExpressionNeume.Vareia" /></button>
    <button class="neume-button" @click="setVocalExpression(VocalExpressionNeume.Homalon)"><Neume class="neume homalon" :neume="VocalExpressionNeume.Homalon" /></button>
    <button class="neume-button" @click="setVocalExpression(VocalExpressionNeume.Antikenoma)"><Neume class="neume antikenoma" :neume="VocalExpressionNeume.Antikenoma" /></button>
    <button class="neume-button" @click="setVocalExpression(VocalExpressionNeume.Psifiston)"><Neume class="neume psifiston" :neume="VocalExpressionNeume.Psifiston" /></button>
    <button class="neume-button" @click="setVocalExpression(VocalExpressionNeume.Heteron)"><Neume class="red neume heteron" :neume="VocalExpressionNeume.Heteron" /></button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement } from '@/models/Element';
import { Accidental, VocalExpressionNeume } from '@/models/Neumes';
import Neume from './Neume.vue';

@Component({
  components: {
    Neume
  }
})
export default class NeumeToolbar extends Vue {
  @Prop() element!: NoteElement;
  @Prop() entryMode!: boolean;
  Accidental = Accidental;
  VocalExpressionNeume = VocalExpressionNeume;
  
  private setAccidental(neume: Accidental) {
    if (this.element.accidental != null && this.element.accidental.neume === neume) {
      this.element.setAccidental(null);
    }
    else {
      this.element.setAccidental(neume);
    }

    this.$emit('scoreUpdated');
  }

    private setVocalExpression(neume: VocalExpressionNeume) {
      // Clicking the homalon once will set a normal homalon.
      // Clicking again switches to the connecting homalon.
      // Clicking again removes the homalon.
      if (neume === VocalExpressionNeume.Homalon && this.element.vocalExpressionNeume != null) {
        if (this.element.vocalExpressionNeume.neume === VocalExpressionNeume.Homalon) {
          this.element.setVocalExpressionNeume(VocalExpressionNeume.HomalonConnecting);
        }
        else if (this.element.vocalExpressionNeume.neume === VocalExpressionNeume.HomalonConnecting) {
          this.element.setVocalExpressionNeume(null);
        }
        else {  
          this.element.setVocalExpressionNeume(neume);
        }
      }
      else if (this.element.vocalExpressionNeume != null && this.element.vocalExpressionNeume.neume === neume) {
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

  .entry-mode-btn.on {
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
  </style>
