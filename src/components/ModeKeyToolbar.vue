<template>
  <div class="mode-key-toolbar">
    <input type="number" min="4" max="100" step="1" v-model="fontSize" />
    <input
      type="color"
      list="presetColors"
      :value="element.color"
      @change="$emit('update:color', $event.target.value)"
    />
    <datalist id="presetColors">
      <option>#000000</option>
      <option>#ff0000</option>
      <option>#0000ff</option>
    </datalist>
    <button @click="$emit('update:alignment', TextBoxAlignment.Left)">
      <img
        src="@/assets/alignleft.svg"
        width="32"
        height="32"
        title="Align Left"
      />
    </button>
    <button @click="$emit('update:alignment', TextBoxAlignment.Center)">
      <img
        src="@/assets/aligncenter.svg"
        width="32"
        height="32"
        title="Align Center"
      />
    </button>
    <button @click="$emit('update:alignment', TextBoxAlignment.Right)">
      <img
        src="@/assets/alignright.svg"
        width="32"
        height="32"
        title="Align Right"
      />
    </button>
    <span class="space" />
    <button @click="$emit('openModeKeyDialog')">Change Key</button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { TextBoxAlignment, ModeKeyElement } from '@/models/Element';
import { Unit } from '@/utils/Unit';

@Component({
  components: {},
})
export default class ModeKeyToolbar extends Vue {
  @Prop() element!: ModeKeyElement;
  TextBoxAlignment = TextBoxAlignment;

  private get fontSize() {
    return (this.element.fontSize * 72) / 96;
  }

  private set fontSize(value: number) {
    this.$emit('update:fontSize', Unit.FromPt(value));
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

.space {
  width: 16px;
}
</style>
