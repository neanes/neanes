import { mkdir, mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { atomicWrite } from './atomicWrite';

describe('private atomic file replacement', () => {
  it('creates and replaces complete files with private permissions and no temporary files', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'neanes-atomic-'));
    try {
      const file = path.join(directory, 'metadata');
      await atomicWrite(file, 'old');
      await atomicWrite(file, Buffer.from('new'));
      expect(await readFile(file, 'utf8')).toBe('new');
      expect(await readdir(directory)).toEqual(['metadata']);
      if (process.platform !== 'win32') {
        expect((await stat(file)).mode & 0o777).toBe(0o600);
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('cleans up the temporary file if replacement fails', async () => {
    const directory = await mkdtemp(
      path.join(tmpdir(), 'neanes-atomic-failure-'),
    );
    try {
      const destination = path.join(directory, 'existing-directory');
      await mkdir(destination);
      await expect(atomicWrite(destination, 'data')).rejects.toThrow();
      expect((await stat(destination)).isDirectory()).toBe(true);
      expect(await readdir(directory)).toEqual(['existing-directory']);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
