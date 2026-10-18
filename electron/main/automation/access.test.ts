import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { initializeAccessPolicy, readAccessPolicy } from './access';

describe('internal agent credentials', () => {
  it('generates private credentials once, including concurrent first launches', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'neanes-access-'));
    try {
      const file = path.join(directory, 'credentials.json');
      const [first, second] = await Promise.all([
        initializeAccessPolicy(file),
        initializeAccessPolicy(file),
      ]);
      expect(first).toEqual(second);
      expect(first.token.length).toBeGreaterThanOrEqual(32);
      expect(await initializeAccessPolicy(file)).toEqual(first);
      expect(JSON.parse(await readFile(file, 'utf8'))).toEqual(first);
      if (process.platform !== 'win32') {
        expect((await stat(file)).mode & 0o777).toBe(0o600);
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
  it('ignores retired enable, folder, and generation fields, preserving the credential', async () => {
    const directory = await mkdtemp(
      path.join(tmpdir(), 'neanes-access-legacy-'),
    );
    try {
      const file = path.join(directory, 'credentials.json');
      await writeFile(
        file,
        JSON.stringify({
          enabled: false,
          token: 'a'.repeat(32),
          roots: ['/missing/former-root'],
          generation: 'legacy',
        }),
      );
      expect(await readAccessPolicy(file)).toEqual({ token: 'a'.repeat(32) });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
