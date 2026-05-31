<template>
  <div class="home">
    <TheEditor />
  </div>
</template>

<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
// @ is an alias to /src
import TheEditor from '@/components/TheEditor.vue';

defineOptions({
  name: 'Home',
});
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;

  flex: 1;
  height: 100%;
}
</style>
