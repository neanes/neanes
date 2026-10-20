import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, mkdir, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import electron from 'electron';
import { build } from 'vite';

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
await access(path.join(root, 'dist', 'export.html'));
const temporary = await mkdtemp(path.join(os.tmpdir(), 'neanes-pdf-smoke-'));
const output = path.resolve(process.argv[2] ?? path.join(temporary, 'pdfs'));
await mkdir(output, { recursive: true });
await build({
  configFile: false,
  root,
  logLevel: 'warn',
  build: {
    outDir: path.join(temporary, 'host'),
    lib: {
      entry: path.join(root, 'scripts/rendering/backgroundPdfSmokeHost.ts'),
      formats: ['cjs'],
      fileName: () => 'smoke.cjs',
    },
    rolldownOptions: { external: ['electron', /^node:/] },
  },
});
const processHandle = spawn(
  electron,
  [path.join(temporary, 'host', 'smoke.cjs')],
  {
    env: {
      ...process.env,
      NEANES_PDF_SMOKE_ROOT: root,
      NEANES_PDF_SMOKE_PROFILE: path.join(temporary, 'profile'),
      NEANES_PDF_SMOKE_OUTPUT: output,
    },
    stdio: 'inherit',
  },
);
const timer = setTimeout(() => processHandle.kill('SIGKILL'), 120_000);
try {
  const code = await new Promise((resolve, reject) => {
    processHandle.on('error', reject);
    processHandle.on('exit', resolve);
  });
  assert.equal(code, 0, 'Background PDF smoke checks failed.');
  console.log(`PDFs: ${output}`);
} finally {
  clearTimeout(timer);
}
