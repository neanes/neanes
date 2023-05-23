<template>
  <div class="home">
    <Editor
      :ipcService="ipcService"
      :platformService="platformService"
      :showFileMenuBar="showFileMenuBar"
    />
  </div>
</template>

<script>
// @ is an alias to /src
import Editor from '@/components/Editor.vue';
import { IpcService } from '@/services/ipc/IpcService';
import { BrowserIpcService } from '@/services/ipc/BrowserIpcService';
import { PlatformService } from '@/services/platform/PlatformService';
import { BrowserPlatformService } from '@/services/platform/BrowserPlatformService';

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'home',
  components: {
    Editor,
  },
  data() {
    return {
      ipcService: null,
      platformService: null,
      showFileMenuBar: false,
    };
  },
  created() {
    if (process.env.IS_ELECTRON) {
      this.ipcService = new IpcService();
      this.platformService = new PlatformService();
    } else {
      this.ipcService = new BrowserIpcService();
      this.platformService = new BrowserPlatformService();

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
