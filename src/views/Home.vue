<template>
  <div class="home">
    <TheEditor
      :ipcService="ipcService"
      :platformService="platformService"
      :showFileMenuBar="showFileMenuBar"
    />
  </div>
</template>

<script lang="ts">
// @ is an alias to /src
import TheEditor from '@/components/TheEditor.vue';
import { BrowserIpcService } from '@/services/ipc/BrowserIpcService';
import { IIpcService } from '@/services/ipc/IIpcService';
import { IpcService } from '@/services/ipc/IpcService';
import { BrowserPlatformService } from '@/services/platform/BrowserPlatformService';
import { IPlatformService } from '@/services/platform/IPlatformService';
import { PlatformService } from '@/services/platform/PlatformService';
import { isElectron } from '@/utils/isElectron';

interface Data {
  ipcService: IIpcService;
  platformService: IPlatformService;
  showFileMenuBar: boolean;
}

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'home',
  components: {
    TheEditor,
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
