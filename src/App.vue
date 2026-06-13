<template>
  <TooltipProvider :delay-duration="500" :skip-delay-duration="0">
    <router-view />
  </TooltipProvider>
  <div class="toaster-wrapper contents">
    <Toaster />
  </div>
  <div v-if="updateExists" class="update-notification">
    An update is available.
    <button class="ok" @click="refreshApp">Update</button>
    <button class="cancel" @click="updateExists = false">Not now</button>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { EventBus } from '@/eventBus';
import type { UpdateAvailableArgs, UpdateErrorArgs } from '@/ipc/ipcChannels';
import { IpcMainChannels, IpcRendererChannels } from '@/ipc/ipcChannels';

const registration = ref<ServiceWorkerRegistration | null>(null);
const updateExists = ref(false);
const electronUpdateAvailableToastId = 'electron-update-available';
const electronUpdateDownloadingToastId = 'electron-update-downloading';
const electronUpdateDownloadedToastId = 'electron-update-downloaded';
const electronUpdateErrorToastId = 'electron-update-error';

async function downloadElectronUpdate() {
  try {
    await window.ipcRenderer?.invoke(IpcRendererChannels.DownloadUpdate);
  } catch (error) {
    showElectronUpdateErrorToast({
      message:
        error instanceof Error ? error.message : 'Unable to download update.',
    });
  }
}

async function restartToInstallElectronUpdate() {
  try {
    await window.ipcRenderer?.invoke(
      IpcRendererChannels.RestartToInstallUpdate,
    );
  } catch (error) {
    showElectronUpdateErrorToast({
      message:
        error instanceof Error
          ? error.message
          : 'Unable to restart to install the update.',
    });
  }
}

function showElectronUpdateAvailableToast(args?: UpdateAvailableArgs) {
  toast.info('An update is available.', {
    id: electronUpdateAvailableToastId,
    duration: Infinity,
    description: args?.version
      ? `Version ${args.version} is available.`
      : undefined,
    action: {
      label: 'Download',
      onClick: () => {
        void downloadElectronUpdate();
      },
    },
    cancel: {
      label: 'Later',
    },
  });
}

function showElectronUpdateDownloadingToast() {
  toast.loading('Downloading update...', {
    id: electronUpdateDownloadingToastId,
    duration: Infinity,
  });
}

function showElectronUpdateDownloadedToast(args?: UpdateAvailableArgs) {
  toast.dismiss(electronUpdateDownloadingToastId);

  toast.success('Update downloaded. Restart to install.', {
    id: electronUpdateDownloadedToastId,
    duration: Infinity,
    description: args?.version
      ? `Version ${args.version} is ready.`
      : undefined,
    action: {
      label: 'Restart now',
      onClick: () => {
        void restartToInstallElectronUpdate();
      },
    },
    cancel: {
      label: 'Later',
    },
  });
}

function showElectronUpdateErrorToast(args: UpdateErrorArgs) {
  toast.error('Update failed.', {
    id: electronUpdateErrorToastId,
    description: args.message,
  });
}

if (navigator.serviceWorker) {
  document.addEventListener('swUpdated', onUpdateAvailable as EventListener, {
    once: true,
  });

  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      window.location.reload();
      refreshing = true;
    }
  });
}

function onUpdateAvailable(event: CustomEvent) {
  registration.value = event.detail;
  updateExists.value = true;
}

function refreshApp() {
  updateExists.value = false;
  if (registration.value?.waiting) {
    registration.value.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

const onElectronUpdateAvailable = (args?: UpdateAvailableArgs) =>
  showElectronUpdateAvailableToast(args);
const onElectronUpdateDownloadStarted = () =>
  showElectronUpdateDownloadingToast();
const onElectronUpdateDownloaded = (args?: UpdateAvailableArgs) =>
  showElectronUpdateDownloadedToast(args);
const onElectronUpdateError = (args?: UpdateErrorArgs) => {
  toast.dismiss(electronUpdateDownloadingToastId);
  showElectronUpdateErrorToast(args ?? { message: 'Unable to update.' });
};

onMounted(() => {
  if (window.ipcRenderer == null) {
    return;
  }

  EventBus.$on(IpcMainChannels.UpdateAvailable, onElectronUpdateAvailable);
  EventBus.$on(
    IpcMainChannels.UpdateDownloadStarted,
    onElectronUpdateDownloadStarted,
  );
  EventBus.$on(IpcMainChannels.UpdateDownloaded, onElectronUpdateDownloaded);
  EventBus.$on(IpcMainChannels.UpdateError, onElectronUpdateError);
});

onBeforeUnmount(() => {
  EventBus.$off(IpcMainChannels.UpdateAvailable, onElectronUpdateAvailable);
  EventBus.$off(
    IpcMainChannels.UpdateDownloadStarted,
    onElectronUpdateDownloadStarted,
  );
  EventBus.$off(IpcMainChannels.UpdateDownloaded, onElectronUpdateDownloaded);
  EventBus.$off(IpcMainChannels.UpdateError, onElectronUpdateError);
});
</script>

<style>
:root {
  --zoom: 1;
}

#app {
  display: flex;
  flex-direction: column;
  flex: 1;

  height: 100%;
}

@media print {
  :root {
    --zoom: 1 !important;
  }

  body {
    overflow: visible !important;
  }

  .ck-body-wrapper {
    display: none !important;
  }

  .toaster-wrapper,
  .toaster-wrapper * {
    display: none !important;
  }
}

@page {
  margin: 0;
}

@font-face {
  font-family: NeanesLegacy;
  src: url('./assets/fonts/Neanes.otf');
}

@font-face {
  font-family: Neanes;
  src: url('./assets/fonts/NeanesEngraving.otf');
}

@font-face {
  font-family: NeanesStathisSeriesLegacy;
  src: url('./assets/fonts/NeanesStathisSeries.otf');
}

@font-face {
  font-family: NeanesStathisSeries;
  src: url('./assets/fonts/NeanesStathisSeriesEngraving.otf');
}

@font-face {
  font-family: NeanesRTLLegacy;
  src: url('./assets/fonts/NeanesRTL.otf');
}

@font-face {
  font-family: NeanesRTL;
  src: url('./assets/fonts/NeanesRTLEngraving.otf');
}

@font-face {
  font-family: 'GFS Didot';
  src: url('./assets/fonts/GFSDidot.otf');
}

@font-face {
  font-family: 'GFS Didot';
  src: url('./assets/fonts/GFSDidotBold.otf');
  font-weight: bold;
}

@font-face {
  font-family: 'GFS Didot';
  src: url('./assets/fonts/GFSDidotItalic.otf');
  font-style: italic;
}

@font-face {
  font-family: 'GFS Didot';
  src: url('./assets/fonts/GFSDidotBoldItalic.otf');
  font-weight: bold;
  font-style: italic;
}

@font-face {
  font-family: 'Old Standard';
  src: url('./assets/fonts/OldStandard-Bold.otf');
  font-weight: bold;
}

@font-face {
  font-family: 'Old Standard';
  src: url('./assets/fonts/OldStandard-BoldItalic.otf');
  font-weight: bold;
  font-style: italic;
}

@font-face {
  font-family: 'Old Standard';
  src: url('./assets/fonts/OldStandard-Italic.otf');
  font-style: italic;
}

@font-face {
  font-family: 'Old Standard';
  src: url('./assets/fonts/OldStandard-Regular.otf');
}

@font-face {
  font-family: 'Noto Naskh Arabic';
  src: url('./assets/fonts/NotoNaskhArabic-Regular.otf');
}

@font-face {
  font-family: 'Noto Naskh Arabic';
  src: url('./assets/fonts/NotoNaskhArabic-Bold.otf');
  font-weight: bold;
}

@font-face {
  font-family: 'Source Serif';
  src: url('./assets/fonts/SourceSerif4-Regular.otf');
}

@font-face {
  font-family: 'Source Serif';
  src: url('./assets/fonts/SourceSerif4-Bold.otf');
  font-weight: bold;
}

@font-face {
  font-family: 'Source Serif';
  src: url('./assets/fonts/SourceSerif4-It.otf');
  font-style: italic;
}

@font-face {
  font-family: 'Source Serif';
  src: url('./assets/fonts/SourceSerif4-BoldIt.otf');
  font-weight: bold;
  font-style: italic;
}

html {
  height: 100vh;
}

body {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;

  font-size: 16px;
}

body,
button,
input,
select,
textarea {
  font-family: var(--font-sans);
}
</style>

<style scoped>
.update-notification {
  position: absolute;
  bottom: 0;

  background-color: darkslategray;
  color: white;

  padding: 1rem;

  cursor: default;
}

.update-notification button {
  padding: 0.5rem;
}

.update-notification button.ok {
  background-color: #003366;
  color: white;
  margin: 0 0.75rem;
}
</style>
