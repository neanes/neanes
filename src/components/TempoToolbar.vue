<template>
  <div class="tempo-toolbar">
    <div class="row">
      <label class="right-space">Space After</label>

      <InputUnit
        unit="pt"
        :min="0"
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
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

@Component({
  components: {
    InputUnit,
  },
})
export default class TempoToolbar extends Vue {
  @Prop() element!: TempoElement;
  @Prop() pageSetup!: PageSetup;

  get spaceAfterMax() {
    return Unit.toPt(this.pageSetup.pageWidth);
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
</style>
