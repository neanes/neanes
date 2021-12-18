<template>
  <div class="main-toolbar">
    <button class="auto-mode-btn" @click="$emit('toggleAutoMode')" :class="{ on: autoMode === true }">Auto</button>
    <span class="space"></span>
    <button class="neume-button" @click="$emit('addAutoMartyria')">
        <span class="martyria">
          <Neume class="red neume" :neume="Note.Pa" />
          <Neume class="red neume" :neume="RootSign.Alpha" />
        </span>
    </button>
    <span class="space"></span>
    <button @click="$emit('updateLineBreak')">Line Break</button>
    <button @click="$emit('updatePageBreak')">Page Break</button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement } from '@/models/Element';
import { Accidental, GorgonNeume, Note, RootSign, TimeNeume, VocalExpressionNeume } from '@/models/Neumes';
import Neume from './Neume.vue';

@Component({
  components: {
    Neume
  }
})
export default class NeumeToolbar extends Vue {
  @Prop() element!: NoteElement;
  @Prop() autoMode!: boolean;
  Note = Note;
  RootSign = RootSign;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .main-toolbar {
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

  .martyria {
    position: relative;
    top: -21px;
    left: -4px;
  }
  </style>
