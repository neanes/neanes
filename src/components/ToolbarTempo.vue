<template>
  <div class="tempo-toolbar">
    <div class="row">
      <label class="right-space">BPM</label>
      <InputBpm :value="element.bpm" @input="$emit('update:bpm', $event)" />

      <span class="space" />

      <label class="right-space">Space After</label>

      <InputUnit
        unit="pt"
        :min="-spaceAfterMax"
        :max="spaceAfterMax"
        :step="0.5"
        :precision="2"
        :value="element.spaceAfter"
        @input="$emit('update:spaceAfter', $event)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { TempoElement } from '@/models/Element';
import InputUnit from './InputUnit.vue';
import InputBpm from './InputBpm.vue';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

@Component({
  components: {
    InputUnit,
    InputBpm,
  },
})
export default class ToolbarTempo extends Vue {
  @Prop() element!: TempoElement;
  @Prop() pageSetup!: PageSetup;

  get spaceAfterMax() {
    return Math.round(Unit.toPt(this.pageSetup.pageWidth));
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.tempo-toolbar {
  background-color: lightgray;

  padding: 0.25rem;

  --btn-size: 32px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

label.right-space {
  margin-right: 0.5rem;
}

.space {
  width: 16px;
}
</style>
