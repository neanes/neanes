<template>
  <div class="text-box-toolbar">
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
      :class="{ selected: element.bold }"
      @click="$emit('update:bold', !element.bold)"
    >
      <b>B</b>
    </button>
    <button
      class="icon-btn"
      :class="{ selected: element.italic }"
      @click="$emit('update:italic', !element.italic)"
    >
      <i>I</i>
    </button>
    <button
      class="icon-btn"
      :class="{ selected: element.underline }"
      @click="$emit('update:underline', !element.underline)"
    >
      <u>U</u>
    </button>
    <span class="space"></span>
    <button
      class="icon-btn"
      :class="{ selected: element.alignment === TextBoxAlignment.Left }"
      @click="$emit('update:alignment', TextBoxAlignment.Left)"
    >
      <img
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
        src="@/assets/icons/alignright.svg"
        width="32"
        height="32"
        title="Align Right"
      />
    </button>
    <span class="space"></span>
    <button class="icon-btn" @mousedown.prevent="$emit('insert:pelastikon')">
      <img
        src="@/assets/icons/letterPelastikon.svg"
        width="32"
        height="32"
        title="Insert Pelastikon"
      />
    </button>
    <button class="icon-btn" @mousedown.prevent="$emit('insert:gorthmikon')">
      <img
        src="@/assets/icons/letterGorthmikon.svg"
        width="32"
        height="32"
        title="Insert Gorthmikon"
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
export default class TextBoxToolbar extends Vue {
  @Prop() element!: TextBoxElement;

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
.text-box-toolbar {
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
