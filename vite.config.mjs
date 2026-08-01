import { rmSync } from 'node:fs';

import eslintPlugin from '@nabla/vite-plugin-eslint';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import electron from 'vite-plugin-electron';
import { VitePWA } from 'vite-plugin-pwa';
import VueDevTools from 'vite-plugin-vue-devtools';

import pkg from './package.json';

// lib-font probes for Node's fs and zlib at module load, behind runtime
// guards that never fire in the renderer: the fetch shim only activates when
// globalThis.fetch is missing, and the zlib decompressors only run for
// WOFF/WOFF2 input, while Local Font Access hands lib-font raw SFNT bytes.
// Resolve those two imports to an empty stub so the client build does not
// warn about externalized Node builtins. Scoped to lib-font importers so a
// genuine Node-builtin import anywhere else still warns loudly.
const libFontNodeBuiltinStub = () => {
  const stubId = '\0lib-font-node-builtin-stub';

  return {
    name: 'lib-font-node-builtin-stub',
    enforce: 'pre',
    resolveId(source, importer) {
      if (
        (source === 'fs' || source === 'zlib') &&
        importer != null &&
        /node_modules[\\/]lib-font[\\/]/.test(importer)
      ) {
        return stubId;
      }
    },
    load(id) {
      if (id === stubId) {
        return 'export default {};';
      }
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isServe = command === 'serve';
  const isBuild = command === 'build';
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  Object.assign(process.env, loadEnv(mode, process.cwd()));
  const isElectron = process.env.VITE_IS_ELECTRON === 'true';

  if (isElectron) {
    rmSync('dist-electron', { recursive: true, force: true });
  }

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      APP_VERSION: JSON.stringify(pkg.version),
    },
    plugins: [
      libFontNodeBuiltinStub(),
      !isElectron
        ? VitePWA({
            registerType: null, // We'll inject the service worker ourselves
            workbox: {
              maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
            },
            includeAssets: [
              'favicon-32.png',
              'favicon-16.png',
              'apple-touch-icon.png',
              'msapplication-icon.png',
              'safari-pinned-tab.svg',
            ],
            manifest: {
              name: 'Neanes',
              short_name: 'Neanes',
              description: 'A Byzantine Chant Scorewriter',
              theme_color: '#052F43',
              icons: [
                {
                  src: 'assets/icons/icon-72x72.png',
                  sizes: '72x72',
                  type: 'image/png',
                  purpose: 'maskable any',
                },
                {
                  src: 'assets/icons/icon-96x96.png',
                  sizes: '96x96',
                  type: 'image/png',
                  purpose: 'maskable any',
                },
                {
                  src: 'assets/icons/icon-128x128.png',
                  sizes: '128x128',
                  type: 'image/png',
                  purpose: 'maskable any',
                },
                {
                  src: 'assets/icons/icon-144x144.png',
                  sizes: '144x144',
                  type: 'image/png',
                  purpose: 'maskable any',
                },
                {
                  src: 'assets/icons/icon-152x152.png',
                  sizes: '152x152',
                  type: 'image/png',
                  purpose: 'maskable any',
                },
                {
                  src: 'assets/icons/icon-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                  purpose: 'maskable any',
                },
                {
                  src: 'assets/icons/icon-384x384.png',
                  sizes: '384x384',
                  type: 'image/png',
                  purpose: 'maskable any',
                },
                {
                  src: 'assets/icons/icon-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable any',
                },
              ],
            },
          })
        : undefined,
      vue(),
      tailwindcss(),
      process.env.VITE_ENABLE_DEV_TOOLS === 'true' ? VueDevTools() : undefined,
      eslintPlugin({
        eslintOptions: {
          cache: false,
          overrideConfigFile: 'eslint.config.mjs',
        },
      }),
      isElectron
        ? electron([
            {
              // Main-Process entry file of the Electron App.
              entry: 'electron/main/index.ts',
              onstart(options) {
                if (process.env.VSCODE_DEBUG) {
                  console.log(
                    /* For `.vscode/.debug.script.mjs` */ '[startup] Electron App',
                  );
                } else {
                  options.startup();
                }
              },
              vite: {
                build: {
                  sourcemap,
                  minify: isBuild,
                  outDir: 'dist-electron/main',
                  rolldownOptions: {
                    external: Object.keys(
                      'dependencies' in pkg ? pkg.dependencies : {},
                    ),
                  },
                },
              },
            },
            {
              entry: 'electron/preload/index.ts',
              onstart(options) {
                // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
                // instead of restarting the entire Electron App.
                options.reload();
              },
              vite: {
                build: {
                  sourcemap: sourcemap ? 'inline' : undefined, // #332
                  minify: isBuild,
                  outDir: 'dist-electron/preload',
                  rolldownOptions: {
                    external: Object.keys(
                      'dependencies' in pkg ? pkg.dependencies : {},
                    ),
                  },
                },
              },
            },
          ])
        : undefined,
    ],
    server:
      process.env.VSCODE_DEBUG &&
      (() => {
        const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
        return {
          host: url.hostname,
          port: +url.port,
        };
      })(),
    optimizeDeps: {
      // Work around a Vite 8/Rolldown dep optimizer bug where Vue init helper
      // calls are emitted without imports in pre-bundled chunks. This only
      // affects dev mode; production builds do not use optimizeDeps.
      // See https://github.com/rolldown/rolldown/issues/9502.
      //
      // lib-font is excluded because the dep optimizer resolves with its own
      // pipeline, ignoring the libFontNodeBuiltinStub plugin, so a
      // pre-bundled lib-font still warns about externalized fs/zlib in dev.
      // Excluded, it is served through the transform pipeline where the stub
      // applies.
      exclude: ['@ckeditor/ckeditor5-vue', 'lib-font'],
    },
    clearScreen: false,
  };
});
