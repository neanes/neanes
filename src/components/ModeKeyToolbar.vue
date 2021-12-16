<template>
  <div class="mode-key-toolbar">
    <input 
      type="number" 
      min="4" 
      max="100" 
      step="1"
      v-model="fontSize" 
      @change="$emit('scoreUpdated')"/> 
    <input type="color" list="presetColors" v-model="element.color" @change="$emit('scoreUpdated')" />
    <datalist id="presetColors">
      <option>#000000</option>
      <option>#ff0000</option>
      <option>#0000ff</option>
    </datalist>
    <button @click="align('left')"><img src="@/assets/alignleft.svg" width="32" height="32" title="Align Left" /></button>
    <button @click="align('center')"><img src="@/assets/aligncenter.svg" width="32" height="32" title="Align Center" /></button>
    <button @click="align('right')"><img src="@/assets/alignright.svg" width="32" height="32" title="Align Right" /></button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { TextBoxAlignment, ModeKeyElement } from '@/models/Element';
import { Unit } from '@/utils/Unit';

@Component({
  components: {
  }
})
export default class ModeKeyToolbar extends Vue {
  @Prop() element!: ModeKeyElement;

  private get fontSize() {
    return this.element.fontSize * 72 / 96; 
  }

  private set fontSize(value: number) {
      this.element.fontSize = Unit.FromPt(value); 
  }

  private align(alignment: TextBoxAlignment) {
    this.element.alignment = alignment;
    this.$emit('scoreUpdated');
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .mode-key-toolbar {
    display: flex;
    background-color: lightgray;

    padding: 0.25rem;
  }
  </style>
