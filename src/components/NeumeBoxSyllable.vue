<template>
  <div class="neume" :style="style">
    <Neume v-if="note.vareia" :neume="VocalExpressionNeume.Vareia"></Neume>
    <Neume :neume="note.quantitativeNeume"></Neume>
    <Neume
      v-if="hasVocalExpressionNeume"
      :neume="note.vocalExpressionNeume"
      :style="vocalExpressionStyle"
    ></Neume>
    <Neume v-if="hasTimeNeume" :neume="note.timeNeume"></Neume>
    <Neume
      v-if="hasGorgonNeume"
      :neume="note.gorgonNeume"
      :style="gorgonStyle"
    ></Neume>
    <Neume
      v-if="hasSecondaryGorgonNeume"
      :neume="note.secondaryGorgonNeume"
      :style="gorgonStyle"
    ></Neume>
    <Neume v-if="hasFthora" :neume="note.fthora" :style="fthoraStyle"></Neume>
    <Neume
      v-if="hasAccidental"
      :neume="note.accidental"
      :style="accidentalStyle"
    ></Neume>
    <Neume
      v-if="hasNoteIndicator"
      :neume="note.noteIndicator"
      :style="noteIndicatorStyle"
    ></Neume>
    <Neume v-if="hasIson" :neume="note.ison" :style="isonStyle"></Neume>
    <Neume
      v-if="hasMeasureNumber"
      :neume="note.measureNumber"
      :style="measureNumberStyle"
    ></Neume>
    <Neume
      v-if="hasMeasureBar"
      :neume="note.measureBar"
      :style="measureBarStyle"
    ></Neume>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement } from '@/models/Element';
import { VocalExpressionNeume } from '@/models/Neumes';
import Neume from '@/components/Neume.vue';
import { withZoom } from '@/utils/withZoom';
import { PageSetup } from '@/models/PageSetup';

@Component({
  components: {
    Neume,
  },
})
export default class NeumeBoxSyllable extends Vue {
  @Prop() note!: NoteElement;
  @Prop() pageSetup!: PageSetup;

  VocalExpressionNeume = VocalExpressionNeume;

  get hasVocalExpressionNeume() {
    return this.note.vocalExpressionNeume != null;
  }

  get hasTimeNeume() {
    return this.note.timeNeume != null;
  }

  get hasGorgonNeume() {
    return this.note.gorgonNeume != null;
  }

  get hasSecondaryGorgonNeume() {
    return this.note.secondaryGorgonNeume != null;
  }

  get hasFthora() {
    return this.note.fthora != null;
  }

  get hasAccidental() {
    return this.note.accidental != null;
  }

  get hasMeasureBar() {
    return this.note.measureBar != null;
  }

  get hasMeasureNumber() {
    return this.note.measureNumber != null;
  }

  get hasNoteIndicator() {
    return this.note.noteIndicator != null;
  }

  get hasIson() {
    return this.note.ison != null;
  }

  get style() {
    return {
      fontFamily: this.pageSetup.neumeDefaultFontFamily,
      fontSize: withZoom(this.pageSetup.neumeDefaultFontSize),
      color: this.pageSetup.neumeDefaultColor,
    } as CSSStyleDeclaration;
  }

  get gorgonStyle() {
    return {
      color: this.pageSetup.gorgonDefaultColor,
    } as CSSStyleDeclaration;
  }

  get fthoraStyle() {
    return {
      color: this.pageSetup.fthoraDefaultColor,
    } as CSSStyleDeclaration;
  }

  get accidentalStyle() {
    return {
      color: this.pageSetup.accidentalDefaultColor,
    } as CSSStyleDeclaration;
  }

  get measureBarStyle() {
    return {
      color: this.pageSetup.measureBarDefaultColor,
    } as CSSStyleDeclaration;
  }

  get measureNumberStyle() {
    return {
      color: this.pageSetup.measureNumberDefaultColor,
    } as CSSStyleDeclaration;
  }

  get noteIndicatorStyle() {
    return {
      color: this.pageSetup.noteIndicatorDefaultColor,
    } as CSSStyleDeclaration;
  }

  get isonStyle() {
    return {
      color: this.pageSetup.isonDefaultColor,
    } as CSSStyleDeclaration;
  }

  get vocalExpressionStyle() {
    if (
      this.note.vocalExpressionNeume === VocalExpressionNeume.Heteron ||
      this.note.vocalExpressionNeume === VocalExpressionNeume.HeteronConnecting
    ) {
      return {
        color: this.pageSetup.heteronDefaultColor,
      } as CSSStyleDeclaration;
    }

    return null;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.neume {
  cursor: default;
  user-select: none;
}
</style>
