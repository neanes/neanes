<template>
  <div class="neume">
    <Neume :neume="neume.note"></Neume>
    <Neume :neume="neume.rootSign"></Neume>
    <Neume v-if="neume.apostrophe" neume="Apostrophe"></Neume>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { MartyriaNeume } from '@/models/Element';
import { neumeMap } from '@/models/NeumeMappings';
import Neume  from '@/components/Neume.vue'

@Component({
  components: {
    Neume
  }
})
export default class NeumeBoxMartyria extends Vue {
  @Prop() neume!: MartyriaNeume;

  get noteMapping() {
    return neumeMap.get(this.neume.note!)!;
  }

  get rootSignMapping() {
    return neumeMap.get(this.neume.rootSign!)!;
  }
}
</script>

<style scoped>
.neume {
    font-size: 1.6rem;

    color: #ED0000;
}
</style>
