<template>
  <div class="lyrics-toolbar">
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
import { NoteElement } from '@/models/Element';
import { Unit } from '@/utils/Unit';

@Component({
  components: {},
})
export default class ToolbarLyrics extends Vue {
  @Prop() element!: NoteElement;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.lyrics-toolbar {
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
