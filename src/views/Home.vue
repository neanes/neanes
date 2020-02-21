<template>
  <div class="home">
    <Editor/>
  </div>
</template>

<script>
// @ is an alias to /src
import Editor from '@/components/Editor.vue'

export default {
  name: 'home',
  components: {
    Editor
  }
}
</script>

<style scoped>
  .home {
    display: flex;
    flex-direction: column;

    flex: 1;
    height: 100%;
  }
</style>