<template>
  <router-view />
  <div class="update-notification" v-if="updateExists">
    An update is available.
    <button class="ok" @click="refreshApp">Update</button>
    <button class="cancel" @click="updateExists = false">Not now</button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';

@Component
export default class App extends Vue {
  registration: ServiceWorkerRegistration | null = null;
  updateExists: boolean = false;

  created() {
    if (navigator.serviceWorker) {
      document.addEventListener(
        'swUpdated',
        this.onUpdateAvailable as EventListener,
        {
          once: true,
        },
      );

      let refreshing = false;

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          window.location.reload();
          refreshing = true;
        }
      });
    }
  }

  onUpdateAvailable(event: CustomEvent) {
    this.registration = event.detail;
    this.updateExists = true;
  }

  refreshApp() {
    this.updateExists = false;
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}
</script>

<style>
:root {
  --zoom: 1;

  --btn-color-selected: lightsteelblue;
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
}

@page {
  margin: 0;
}

@font-face {
  font-family: Neanes;
  src: url('./assets/fonts/Neanes.otf');
}

@font-face {
  font-family: NeanesStathisSeries;
  src: url('./assets/fonts/NeanesStathisSeries.otf');
}

@font-face {
  font-family: NeanesRTL;
  src: url('./assets/fonts/NeanesRTL.otf');
}

@font-face {
  font-family: Omega;
  src: url('./assets/fonts/EZ Omega.ttf');
}

@font-face {
  font-family: Athonite;
  src: url('./assets/fonts/Athonite.ttf');
}

@font-face {
  font-family: PFGoudyInitials;
  src: url('./assets/fonts/PFGoudyInitials.ttf');
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
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica,
    Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
}

.ok-btn {
  padding: 0.5rem;
  border: none;
  background-color: rgb(66, 139, 202);
  color: white;
  border-radius: 4px;
}

.ok-btn:hover {
  background-color: rgb(81, 157, 223);
}

.neutral-btn,
.cancel-btn {
  padding: 0.5rem;
  border: 1px solid black;
  background-color: white;
  border-radius: 4px;
}

.neutral-btn:hover,
.cancel-btn:hover {
  background-color: #f8fbff;
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
