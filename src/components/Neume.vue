<template>
  <span class="neume" :style="style">{{ text }}</span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Neume as NeumeType } from '@/models/Neumes';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { ScoreElementOffset } from '@/models/Element';
import { withZoom } from '@/utils/withZoom';

@Component
export default class Neume extends Vue {
  @Prop() neume!: NeumeType;
  @Prop() offset!: ScoreElementOffset;
  @Prop() fontFamily!: string;

  get mapping() {
    let mapping = NeumeMappingService.getMapping(this.neume);

    if (!mapping) {
      console.warn('Could not find mapping for neume ' + this.neume);
      mapping = {
        text: '?',
        glyphName: 'ison',
      };
    }

    return mapping!;
  }

  get text() {
    return this.mapping.text;
  }

  get style() {
    const style = {} as CSSStyleDeclaration;

    style.fontFamily = this.fontFamily;

    if (this.offset) {
      style.left = withZoom(this.offset.x);
      style.top = withZoom(this.offset.y);
    }

    return style;
  }
}
</script>

<style scoped>
.neume {
  position: relative;
}
</style>
