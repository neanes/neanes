<template>
  <div class="file-menu-item" @click="$emit('click')">
    {{ label }}
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

@Component({ emits: ['click'] })
export default class FileMenuItem extends Vue {
  @Prop() label!: string;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.file-menu-item {
  cursor: pointer;
  padding: 0.5rem 1rem;
}

.file-menu-item:hover {
  background-color: darkgray;
}
</style>
