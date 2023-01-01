<template>
  <div
    class="menu-container"
    @mousedown="openMenu"
    @mouseleave="selectedOption = null"
  >
    <button class="neume-button">
      <img draggable="false" :src="mainIcon" />
    </button>
    <div class="menu" v-if="showMenu">
      <div
        v-for="option in options"
        :key="getKey(option)"
        class="menu-item"
        @mouseenter="selectedOption = option.neume"
      >
        <img draggable="false" :src="option.icon" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Neume } from '@/models/Neumes';
import { Component, Prop, Vue } from 'vue-property-decorator';

export interface ButtonWithMenuOption {
  icon: string;
  neume: Neume | Neume[];
}

@Component({ components: {} })
export default class ButtonWithMenu extends Vue {
  @Prop({ default: 'up' }) direction!: 'up' | 'down';
  @Prop({ required: true }) options!: ButtonWithMenuOption[];

  showMenu: boolean = false;
  selectedOption: Neume | Neume[] | null = null;

  get mainIcon() {
    return this.direction === 'up'
      ? this.options.at(-1)!.icon
      : this.options[0];
  }

  getKey(option: ButtonWithMenuOption) {
    return Array.isArray(option.neume) ? option.neume[0] : option.neume;
  }

  beforeDestroy() {
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  openMenu() {
    this.showMenu = true;
    window.addEventListener('mouseup', this.onMouseUp);
  }

  onMouseUp() {
    if (this.selectedOption) {
      this.$emit('select', this.selectedOption);
    }

    this.showMenu = false;

    window.removeEventListener('mouseup', this.onMouseUp);
  }
}
</script>

<style scoped>
.neume-button {
  height: var(--btn-size);
  width: var(--btn-size);

  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;

  user-select: none;
}

.neume-button img {
  height: var(--btn-size);
  width: var(--btn-size);
}

.menu-container {
  display: flex;
  position: relative;
  height: var(--btn-size);
}

.menu {
  position: absolute;
  z-index: 999;
  background-color: white;
  border: 1px solid black;
  box-sizing: border-box;
  width: var(--btn-size);
  bottom: 0;
}

.menu-item {
  height: var(--btn-size);
  width: 100%;
  padding: 3px 0;
  box-sizing: border-box;
  text-align: center;
  user-select: none;
  overflow: hidden;
  position: relative;
}

.menu-item:hover {
  background-color: aliceblue;
}
</style>
