import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
      excludeAfterRemap: true,
    },
  },
});
