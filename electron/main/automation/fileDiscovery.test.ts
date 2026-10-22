import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { fileDiscoveryQuerySchema } from '../../../src/automation/contracts/fileDiscovery';
import { discoverScoreFiles } from './fileDiscovery';

const signal = new AbortController().signal;

describe('score file discovery', () => {
  let root: string;
  beforeEach(async () => {
    root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'neanes-discovery-')),
    );
    await fs.mkdir(path.join(root, 'child'));
    await fs.mkdir(path.join(root, 'empty'));
    for (const file of ['z.byz', 'a.byzx', 'ignore.pdf', 'child/b.byzx']) {
      await fs.writeFile(path.join(root, file), 'Not parsed during discovery');
    }
    await fs.symlink(path.join(root, 'a.byzx'), path.join(root, 'alias.byzx'));
    await fs.symlink(root, path.join(root, 'child', 'loop'));
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('lists only regular scores and skips child folders by default', async () => {
    expect(
      await discoverScoreFiles(
        fileDiscoveryQuerySchema.parse({ folderPath: root }),
        signal,
      ),
    ).toEqual({
      files: [path.join(root, 'a.byzx'), path.join(root, 'z.byz')],
      nextOffset: null,
    });
  });

  it('resolves an explicitly supplied folder alias to canonical result paths', async () => {
    const result = await discoverScoreFiles(
      fileDiscoveryQuerySchema.parse({
        folderPath: path.join(root, 'child', 'loop'),
      }),
      signal,
    );
    expect(result).toEqual({
      files: [path.join(root, 'a.byzx'), path.join(root, 'z.byz')],
      nextOffset: null,
    });
  });

  it('paginates recursive traversal without following symlinks or replaying files', async () => {
    const files: string[] = [];
    let offset: number | null = 0;
    do {
      const result = await discoverScoreFiles(
        fileDiscoveryQuerySchema.parse({
          folderPath: root,
          recursive: true,
          offset,
          limit: 1,
        }),
        signal,
      );
      files.push(...result.files);
      offset = result.nextOffset;
    } while (offset !== null);
    expect(files).toEqual(
      ['a.byzx', 'z.byz', 'child/b.byzx'].map((file) => path.join(root, file)),
    );
  });

  it('returns an empty final page for empty folders or offsets beyond the matches', async () => {
    for (const query of [
      { folderPath: path.join(root, 'empty') },
      { folderPath: root, offset: 9 },
    ]) {
      expect(
        await discoverScoreFiles(fileDiscoveryQuerySchema.parse(query), signal),
      ).toEqual({ files: [], nextOffset: null });
    }
  });

  it('reports invalid roots and honors cancellation before traversal', async () => {
    await expect(
      discoverScoreFiles(
        fileDiscoveryQuerySchema.parse({ folderPath: 'relative' }),
        signal,
      ),
    ).rejects.toThrow('ABSOLUTE_PATH_REQUIRED');
    await expect(
      discoverScoreFiles(
        fileDiscoveryQuerySchema.parse({
          folderPath: path.join(root, 'missing'),
        }),
        signal,
      ),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(
      discoverScoreFiles(
        fileDiscoveryQuerySchema.parse({
          folderPath: path.join(root, 'a.byzx'),
        }),
        signal,
      ),
    ).rejects.toMatchObject({ code: 'ENOTDIR' });
    const controller = new AbortController();
    controller.abort(new Error('EXPORT_CANCELLED'));
    await expect(
      discoverScoreFiles(
        fileDiscoveryQuerySchema.parse({ folderPath: root }),
        controller.signal,
      ),
    ).rejects.toThrow('EXPORT_CANCELLED');
  });

  it('fails explicitly when traversal exceeds its entry budget', async () => {
    const wide = path.join(root, 'wide');
    await fs.mkdir(wide);
    for (let start = 0; start < 10001; start += 100) {
      await Promise.all(
        Array.from({ length: Math.min(100, 10001 - start) }, (_, index) =>
          fs.mkdir(path.join(wide, String(start + index))),
        ),
      );
    }
    await expect(
      discoverScoreFiles(
        fileDiscoveryQuerySchema.parse({ folderPath: wide }),
        signal,
      ),
    ).rejects.toMatchObject({ error: { code: 'RESPONSE_TOO_LARGE' } });
  });
});
