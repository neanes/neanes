<template>
  <div class="neume-toolbar">
    <button @click="setAccidental(Accidental.Flat_2_Left)"><Neume class="red neume flat" :neume=" Accidental.Flat_2_Right" /></button>
    <button @click="setAccidental(Accidental.Sharp_2_Left)"><Neume class="red neume sharp" :neume="Accidental.Sharp_2_Left" /></button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { AccidentalElement, NoteElement } from '@/models/Element';
import { Accidental } from '@/models/Neumes';
import Neume from './Neume.vue';

@Component({
  components: {
    Neume
  }
})
export default class NeumeToolbar extends Vue {
  @Prop() element!: NoteElement;
  Accidental = Accidental;
  
  private setAccidental(neume: Accidental) {
    if (this.element.accidental != null && this.element.accidental.neume === neume) {
      this.element.accidental = null;
    }
    else {
      this.element.accidental = new AccidentalElement(neume);
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

  .red {
    color: red;
  }

  .neume {
    font-size: 25px;
  }

  button {
    height: 32px;
    width: 32px;
  }

  .sharp {
    top: -23px;
    left: 24px;
    position: relative;
  }

  .flat {
    top: 2px;
    left: 2px;
    position: relative;
  }
  </style>
