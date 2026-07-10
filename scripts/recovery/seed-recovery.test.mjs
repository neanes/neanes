import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

import { ensureSafeToDelete } from './seed-recovery.mjs';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

describe('seed recovery path guards', () => {
  it('rejects the filesystem root, home directory, and repository root even with force', async () => {
    await expect(
      ensureSafeToDelete({
        force: true,
        scenario: 'saved-source-missing',
        targetPath: path.parse(os.tmpdir()).root,
      }),
    ).rejects.toThrow('filesystem root');

    await expect(
      ensureSafeToDelete({
        force: true,
        scenario: 'saved-source-missing',
        targetPath: os.homedir(),
      }),
    ).rejects.toThrow('home directory');

    await expect(
      ensureSafeToDelete({
        force: true,
        scenario: 'saved-source-missing',
        targetPath: repoRoot,
      }),
    ).rejects.toThrow('repository root');
  });

  it('rejects existing non-scenario directories even with force', async () => {
    const targetPath = await fs.mkdtemp(
      path.join(os.tmpdir(), 'neanes-seed-guard-'),
    );

    try {
      await expect(
        ensureSafeToDelete({
          force: true,
          scenario: 'saved-source-missing',
          targetPath,
        }),
      ).rejects.toThrow('existing non-scenario directory');
    } finally {
      await fs.rm(targetPath, { force: true, recursive: true });
    }
  });

  it('still allows a fresh out-of-tree path when force is set', async () => {
    const targetPath = path.join(
      os.tmpdir(),
      `neanes-seed-fresh-${Date.now()}`,
    );

    await expect(
      ensureSafeToDelete({
        force: true,
        scenario: 'saved-source-missing',
        targetPath,
      }),
    ).resolves.toBeUndefined();
  });
});
