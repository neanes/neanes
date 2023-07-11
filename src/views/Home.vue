<template>
  <div class="home">
    <Editor
      :ipcService="ipcService"
      :platformService="platformService"
      :showFileMenuBar="showFileMenuBar"
    />
  </div>
</template>

<script lang="ts">
// @ is an alias to /src
import Editor from '@/components/Editor.vue';
import { IpcService } from '@/services/ipc/IpcService';
import { BrowserIpcService } from '@/services/ipc/BrowserIpcService';
import { PlatformService } from '@/services/platform/PlatformService';
import { BrowserPlatformService } from '@/services/platform/BrowserPlatformService';
import { isElectron } from '@/utils/isElectron';
import { IIpcService } from '@/services/ipc/IIpcService';
import { IPlatformService } from '@/services/platform/IPlatformService';

interface Data {
  ipcService: IIpcService;
  platformService: IPlatformService;
  showFileMenuBar: boolean;
}

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'home',
  components: {
    Editor,
  },
  data(): Data {
    let ipcService: IpcService;
    let platformService: IPlatformService;
    let showFileMenuBar = false;

    if (isElectron()) {
      ipcService = new IpcService();
      platformService = new PlatformService();
    } else {
      ipcService = new BrowserIpcService();
      platformService = new BrowserPlatformService();

      showFileMenuBar = true;
    }

    return {
      ipcService,
      platformService,
      showFileMenuBar,
    };
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
