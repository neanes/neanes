<template>
  <div @click="$emit('select-single')"></div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';

@Component({
  components: {},
  emits: ['select-single'],
})
export default class NeumeBoxEmpty extends Vue {}
</script>

<style scoped>
.empty-neume-box {
  border: 1px dotted black;
  box-sizing: border-box;
}
</style>
