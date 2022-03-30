<template>
  <div class="mode-key-toolbar">
    <input type="number" min="4" max="100" step="1" v-model.lazy="fontSize" />
    <span class="space"></span>
    <input
      type="color"
      list="presetColors"
      :value="element.color"
      @change="$emit('update:color', $event.target.value)"
    />
    <datalist id="presetColors">
      <option>#000000</option>
      <option>#ED0000</option>
      <option>#0000FF</option>
    </datalist>
    <span class="space"></span>
    <button
      class="icon-btn"
      :class="{ selected: element.alignment === TextBoxAlignment.Left }"
      @click="$emit('update:alignment', TextBoxAlignment.Left)"
    >
      <img
        class="icon-btn-img"
        src="@/assets/icons/alignleft.svg"
        width="32"
        height="32"
        title="Align Left"
      />
    </button>
    <button
      class="icon-btn"
      :class="{ selected: element.alignment === TextBoxAlignment.Center }"
      @click="$emit('update:alignment', TextBoxAlignment.Center)"
    >
      <img
        class="icon-btn-img"
        src="@/assets/icons/aligncenter.svg"
        width="32"
        height="32"
        title="Align Center"
      />
    </button>
    <button
      class="icon-btn"
      :class="{ selected: element.alignment === TextBoxAlignment.Right }"
      @click="$emit('update:alignment', TextBoxAlignment.Right)"
    >
      <img
        class="icon-btn-img"
        src="@/assets/icons/alignright.svg"
        width="32"
        height="32"
        title="Align Right"
      />
    </button>
    <span class="space" />
    <button @click="$emit('open-mode-key-dialog')">Change Key</button>
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
    return Unit.toPt(this.element.fontSize);
  }

  private set fontSize(value: number) {
    // Round to nearest 0.5
    const valueRounded = Math.round(value * 2) / 2;

    this.$emit(
      'update:fontSize',
      Math.min(
        Math.max(Unit.fromPt(valueRounded), Unit.fromPt(4)),
        Unit.fromPt(100),
      ),
    );

    this.$forceUpdate();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.mode-key-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  background-color: lightgray;

  padding: 0.25rem;
}

.icon-btn {
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn.selected {
  background-color: var(--btn-color-selected);
}

.space {
  width: 16px;
}
</style>
