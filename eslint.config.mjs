import prettierConfig from '@vue/eslint-config-prettier';
import vueTsEslintConfig from '@vue/eslint-config-typescript';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import pluginVue from 'eslint-plugin-vue';

export default [
  {
    ignores: [
      'dist/**/*',
      'dist-electron/**/*',
      'release/**/*',
      '**/.vitepress/cache/**/*',
      '**/.vitepress/dist/**/*',
    ],
  },
  ...pluginVue.configs['flat/recommended'],
  ...vueTsEslintConfig({
    extends: ['recommended'],
  }),
  prettierConfig,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      curly: ['error', 'all'],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/components/ui/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
    },
  },
];
