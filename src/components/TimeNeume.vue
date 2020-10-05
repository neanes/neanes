<template>
  <Neume 
    class="neume"
    :neume="element.neume"
  ></Neume>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Neume as NeumeType } from '@/models/Neumes';
import { neumeMap } from '@/models/NeumeMappings';
import { TimeNeumeElement } from '@/models/Element';
import Neume from '@/components/Neume.vue';

@Component({
  components: {
    Neume,
  }
})
export default class TimeNeume extends Vue {
  @Prop() element!: TimeNeumeElement;

  startX: number = 0;
  startY: number = 0;

  // TODO implement this later
  // get style() {
  //   return {
  //     left: this.element.offset.x + 'px',
  //     top: this.element.offset.y + 'px',
  //   }
  // }

  beforeDestroy() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseDown(e: MouseEvent) {
    console.log('check');
    e.preventDefault();

    this.startX = e.clientX - this.element.offset.x;
    this.startY = e.clientY - this.element.offset.y;
    
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove(e: MouseEvent) {
    e.preventDefault();

    this.element.offset.x = e.clientX - this.startX;
    this.element.offset.y = e.clientY - this.startY;
  }

  handleMouseUp() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }
}
</script>

<style scoped>
  .neume {
    position: relative;
  }
</style>