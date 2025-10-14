<template>
  <div class="home">
    <TheEditor />
  </div>
</template>

<script lang="ts">
// @ is an alias to /src
import TheEditor from '@/components/TheEditor.vue';

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'home',
  components: {
    TheEditor,
  },
};
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;

  flex: 1;
  height: 100%;
}
</style>
