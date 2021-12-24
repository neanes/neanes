<template>
  <div class="main-toolbar">
    <button
      class="entry-mode-btn"
      @click="
        $emit(
          'updateEntryMode',
          entryMode === EntryMode.Auto ? EntryMode.Edit : EntryMode.Auto,
        )
      "
      :class="{ on: entryMode === EntryMode.Auto }"
    >
      Auto
    </button>
    <button
      class="entry-mode-btn"
      @click="
        $emit(
          'updateEntryMode',
          entryMode === EntryMode.Insert ? EntryMode.Edit : EntryMode.Insert,
        )
      "
      :class="{ on: entryMode === EntryMode.Insert }"
    >
      Insert
    </button>
    <span class="space"></span>
    <button
      title="Insert Martyria"
      class="neume-button"
      @click="$emit('addAutoMartyria')"
    >
      <span class="martyria">
        <Neume class="red neume" :neume="Note.Pa" />
        <Neume class="red neume" :neume="RootSign.Alpha" />
      </span>
    </button>
    <span class="space"></span>
    <button
      class="neume-button"
      @click="$emit('updateTempo', TempoSign.VerySlow)"
    >
      <Neume class="red neume tempo" :neume="TempoSign.VerySlow" />
    </button>
    <button class="neume-button" @click="$emit('updateTempo', TempoSign.Slow)">
      <Neume class="red neume tempo" :neume="TempoSign.Slow" />
    </button>
    <button
      class="neume-button"
      @click="$emit('updateTempo', TempoSign.Medium)"
    >
      <Neume class="red neume tempo" :neume="TempoSign.Medium" />
    </button>
    <button
      class="neume-button"
      @click="$emit('updateTempo', TempoSign.Moderate)"
    >
      <Neume class="red neume tempo" :neume="TempoSign.Moderate" />
    </button>
    <button class="neume-button" @click="$emit('updateTempo', TempoSign.Quick)">
      <Neume class="red neume tempo" :neume="TempoSign.Quick" />
    </button>
    <button
      class="neume-button"
      @click="$emit('updateTempo', TempoSign.VeryQuick)"
    >
      <Neume class="red neume tempo" :neume="TempoSign.VeryQuick" />
    </button>
    <span class="space"></span>
    <button
      title="Insert Line Break After Selected Element"
      @click="$emit('updateLineBreak')"
    >
      Line Break
    </button>
    <button
      title="Insert Page Break After Selected Element"
      @click="$emit('updatePageBreak')"
    >
      Page Break
    </button>
    <span class="space"></span>
    <button
      class="red"
      title="Delete Selected Element"
      @click="$emit('deleteSelectedElement')"
    >
      X
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement } from '@/models/Element';
import {
  Accidental,
  GorgonNeume,
  Note,
  RootSign,
  TempoSign,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import Neume from './Neume.vue';
import { EntryMode } from './Editor.vue';

@Component({
  components: {
    Neume,
  },
})
export default class NeumeToolbar extends Vue {
  @Prop() element!: NoteElement;
  @Prop() entryMode!: EntryMode;
  Note = Note;
  RootSign = RootSign;
  TempoSign = TempoSign;
  EntryMode = EntryMode;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.main-toolbar {
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

.martyria {
  position: relative;

  top: -21px;
  left: -4px;
}

.tempo {
  top: -12px;
  left: -1px;
  font-size: 20px;
}
</style>
