<template>
  <div class="color-picker-container">
    <div ref="swatch" class="swatch" @click="open">
      <div class="swatch--color" :style="colorStyle" />
    </div>
    <template v-if="isOpen">
      <div class="popover" :style="popupStyle">
        <div class="cover" @click="close" />
        <Sketch
          @input="onColorChanged"
          :value="color"
          :preset-colors="presetColors"
          :disableAlpha="true"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Sketch } from 'vue-color';

interface Color {
  hex: string;
}

@Component({ components: { Sketch } })
export default class ColorPicker extends Vue {
  @Prop() value!: string;
  @Prop({ default: 'colorPicker_presetColors' }) historyKey!: string;

  isOpen: boolean = false;

  presetColors: string[] = [];

  popupPositionTop: number = 0;

  maxHistorySize = 8;

  color: string = '#000000';

  created() {
    this.color = this.value;
  }

  get swatch() {
    return this.$refs.swatch as HTMLElement;
  }

  get colorStyle() {
    return {
      backgroundColor: this.color,
    } as CSSStyleDeclaration;
  }

  get popupStyle() {
    return {
      top: `${this.popupPositionTop}px`,
    } as CSSStyleDeclaration;
  }

  open() {
    this.presetColors = JSON.parse(localStorage.getItem(this.historyKey)!) || [
      '#000000',
    ];

    // Fist, try to position the popup underneath the swatch
    this.popupPositionTop =
      this.swatch.getBoundingClientRect().top + this.swatch.offsetHeight;

    // If the popover goes off the bottom of the screen, position above the swatch
    const popoverHeightPx = 260;

    if (this.popupPositionTop + popoverHeightPx > window.innerHeight) {
      this.popupPositionTop -= popoverHeightPx + this.swatch.offsetHeight;
    }

    this.isOpen = true;
  }

  onColorChanged(color: Color) {
    this.color = color.hex;
  }

  close() {
    const index = this.presetColors.indexOf(this.color);

    if (index >= 0) {
      this.presetColors.splice(index, 1);
    }

    this.presetColors.unshift(this.color);
    this.presetColors = this.presetColors.slice(0, this.maxHistorySize);
    localStorage.setItem(this.historyKey, JSON.stringify(this.presetColors));

    this.isOpen = false;

    if (this.color !== this.value) {
      this.$emit('input', this.color);
    }
  }
}
</script>

<style scoped>
.swatch {
  padding: 5px;
  background: white;
  border-radius: 1px;
  box-shadow: rgb(0 0 0 / 10%) 0px 0px 0px 1px;
  display: flex;
  cursor: pointer;
}

.swatch--color {
  width: 36px;
  height: 14px;
  border-radius: 2px;
}

.popover {
  position: fixed;
}

.cover {
  position: fixed;
  top: 0px;
  right: 0px;
  bottom: 0px;
  left: 0px;
  /* pointer-events: none; */
}
</style>
