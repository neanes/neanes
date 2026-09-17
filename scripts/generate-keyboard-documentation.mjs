import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { format } from 'prettier';
import { runnerImport } from 'vite';

const documentationPath = new URL('../docs/guide/keyboard.md', import.meta.url);
const startMarker = '<!-- BEGIN GENERATED KEYBOARD REFERENCE -->';
const endMarker = '<!-- END GENERATED KEYBOARD REFERENCE -->';

const viteConfig = {
  configFile: false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
};

const { module: keyboardModule } = await runnerImport(
  fileURLToPath(new URL('../src/services/NeumeKeyboard.ts', import.meta.url)),
  viteConfig,
);
const { module: documentationModule } = await runnerImport(
  fileURLToPath(
    new URL('../src/services/NeumeKeyboardDocumentation.ts', import.meta.url),
  ),
  viteConfig,
);
const keyboard = new keyboardModule.NeumeKeyboard();
const generated = documentationModule.generateNeumeKeyboardDocumentation(
  keyboard.getDocumentationSource(),
);
const documentation = await readFile(documentationPath, 'utf8');
const start = documentation.indexOf(startMarker);
const end = documentation.indexOf(endMarker);

if (start === -1 || end === -1 || end < start) {
  throw new Error('Could not find the generated keyboard reference markers');
}

const updated = `${documentation.slice(0, start + startMarker.length)}\n${generated}${documentation.slice(end)}`;
await writeFile(
  documentationPath,
  await format(updated, { parser: 'markdown' }),
);
