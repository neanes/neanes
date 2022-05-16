<template>
  <div class="home">
    <Editor :ipcService="ipcService" :showFileMenuBar="showFileMenuBar" />
  </div>
</template>

<script>
// @ is an alias to /src
import Editor from '@/components/Editor.vue';
import { IpcService } from '@/services/ipc/IpcService';
import { BrowserIpcService } from '@/services/ipc/BrowserIpcService';

export default {
  name: 'home',
  components: {
    Editor,
  },
  data() {
    return {
      ipcService: null,
      showFileMenuBar: false,
    };
  },
  created() {
    if (process.env.IS_ELECTRON) {
      this.ipcService = new IpcService();
    } else {
      this.ipcService = new BrowserIpcService();
      this.showFileMenuBar = true;
    }
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
