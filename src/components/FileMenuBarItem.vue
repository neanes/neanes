<template>
  <div class="file-menu-bar-item">
    {{label}}
    <slot/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class FileMenuBarItem extends Vue {
  @Prop() label!: string;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
