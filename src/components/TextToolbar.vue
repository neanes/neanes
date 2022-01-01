<template>
  <div class="text-toolbar">
    <select
      :value="element.fontFamily"
      @change="$emit('update:fontFamily', $event.target.value)"
    >
      <option>Athonite</option>
      <option>Omega</option>
    </select>
    <span class="space"></span>
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
      <option>#0000ff</option>
    </datalist>
    <span class="space"></span>
    <button
      class="icon-btn"
      :class="{ selected: element.alignment === TextBoxAlignment.Left }"
      @click="$emit('update:alignment', TextBoxAlignment.Left)"
    >
      <img
        src="@/assets/alignleft.svg"
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
        src="@/assets/aligncenter.svg"
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
        src="@/assets/alignright.svg"
        width="32"
        height="32"
        title="Align Right"
      />
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { TextBoxAlignment, TextBoxElement } from '@/models/Element';
import { Unit } from '@/utils/Unit';

@Component({
  components: {},
})
export default class TextToolbar extends Vue {
  @Prop() element!: TextBoxElement;

  TextBoxAlignment = TextBoxAlignment;

  private get fontSize() {
    return Unit.toPt(this.element.fontSize);
  }

  private set fontSize(value: number) {
    this.$emit(
      'update:fontSize',
      Math.min(Math.max(Unit.fromPt(value), Unit.fromPt(4)), Unit.fromPt(100)),
    );

    this.$forceUpdate();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.text-toolbar {
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
