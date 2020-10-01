<template>
  <div class="file-menu-item" @click="$emit('click')">
    {{label}}
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class FileMenuItem extends Vue {
  @Prop() label!: string;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
