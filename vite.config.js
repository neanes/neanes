import { rmSync } from 'node:fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron';
import eslintPlugin from 'vite-plugin-eslint';
import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  rmSync('dist-electron', { recursive: true, force: true });

  const isServe = command === 'serve';
  const isBuild = command === 'build';
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      mode === 'web'
        ? VitePWA({
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
      eslintPlugin(),
      !mode.includes('web')
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
                  rollupOptions: {
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
                  rollupOptions: {
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
    test: {
      globals: true,
    },
    clearScreen: false,
  };
});
