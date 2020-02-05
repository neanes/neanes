<template>
  <span class="neume" :style="style">{{text}}</span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Neume as NeumeType } from '@/models/Neumes';
import { neumeMap } from '@/models/NeumeMappings';

@Component
export default class Neume extends Vue {
  @Prop() neume!: NeumeType;

  get mapping() {
    return neumeMap.get(this.neume)!;
  }

  get text() {
    return this.mapping.text;
  }

  get style() {
    return {
        fontFamily: this.mapping.fontFamily
    } as CSSStyleDeclaration;
  }
}
</script>