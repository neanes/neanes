import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Score } from '../../../src/models/Score';
import { SaveService } from '../../../src/services/SaveService';
import { writeScoreFile } from '../files/scoreFiles';
import { ScoreFiles } from './scoreFiles';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

// Real temporary files exercise scope checks and commits without filesystem mocks.
describe('score files', () => {
  let directory: string;
  let root: string;
  let files: ScoreFiles;
  const score = SaveService.SaveScoreToJson(new Score());

  beforeEach(async () => {
    directory = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'neanes-mcp-')),
    );
    root = path.join(directory, 'allowed');
    await fs.mkdir(root);
    files = new ScoreFiles();
  });
  afterEach(async () => {
    await fs.rm(directory, { recursive: true, force: true });
  });

  it.each(['byzx', 'byz'] as const)(
    'round-trips .%s through the current save format',
    async (extension) => {
      const filePath = path.join(root, `score.${extension}`);
      await files.write({
        filePath,
        data: score,
        overwrite: false,
        expectedSource: null,
      });
      const result = await files.read(filePath);
      expect(JSON.parse(result.data)).toEqual(score);
      expect(result.filePath).toBe(filePath);
    },
  );

  it.each(['request', 'workspace'])(
    'matches an open workspace through an aliased %s path without reloading its score',
    async (aliasedPath) => {
      const filePath = path.join(root, 'score.byzx');
      await files.write({
        filePath,
        data: score,
        overwrite: false,
        expectedSource: null,
      });
      const aliasDirectory = path.join(directory, 'alias');
      await fs.symlink(root, aliasDirectory, 'dir');
      const alias = path.join(aliasDirectory, 'score.byzx');
      // Even changed or invalid on-disk content must not replace an open score.
      await fs.writeFile(filePath, 'changed on disk');
      const result = await files.open(
        aliasedPath === 'request' ? alias : filePath,
        [
          {
            documentId: 'open-document',
            filePath: aliasedPath === 'workspace' ? alias : filePath,
          },
        ],
      );
      expect(result).toEqual({ documentId: 'open-document' });
    },
  );

  it.each(['byzx', 'byz'] as const)(
    'decodes a .%s symlink by its requested extension and retains the requested path',
    async (extension) => {
      const requested = path.join(root, `score.${extension}`);
      const target = path.join(root, 'extensionless');
      await writeScoreFile(requested, score);
      await fs.rename(requested, target);
      await fs.symlink(target, requested);

      for (const result of [
        await files.read(requested),
        await files.open(requested, []),
      ]) {
        expect(result).toMatchObject({ filePath: requested });
        expect('data' in result && JSON.parse(result.data)).toEqual(score);
      }
      // Native Save derives its format from the retained alias path.
      const changed = {
        ...score,
        documentProperties: { title: 'Native save', author: '' },
      };
      await writeScoreFile(requested, changed);
      expect(
        JSON.parse((await files.read(requested)).data).documentProperties.title,
      ).toBe('Native save');
      const opened = await files.read(requested);
      const saved = await files.write({
        filePath: opened.filePath,
        data: score,
        overwrite: false,
        expectedSource: {
          filePath: opened.filePath,
          mtimeMs: opened.sourceMtimeMs,
          size: opened.sourceSize,
        },
      });
      expect(saved.filePath).toBe(requested);
      if (extension === 'byz') {
        const archive = await JSZip.loadAsync(await fs.readFile(target));
        expect(Object.keys(archive.files)).toEqual(['score.byzx']);
      }
      expect(JSON.parse((await files.read(requested)).data)).toEqual(score);
      expect((await fs.lstat(requested)).isSymbolicLink()).toBe(true);
      await expect(
        files.open(requested, [{ documentId: 'existing', filePath: target }]),
      ).resolves.toEqual({ documentId: 'existing' });
    },
  );

  it('reads the file when no open workspace has the same identity', async () => {
    const filePath = path.join(root, 'score.byzx');
    await files.write({
      filePath,
      data: score,
      overwrite: false,
      expectedSource: null,
    });
    const result = await files.open(filePath, [
      { documentId: 'other-document', filePath: path.join(root, 'other.byzx') },
    ]);
    expect('data' in result && JSON.parse(result.data)).toEqual(score);
  });

  it('preserves the existing permissions for dialog-driven saves', async () => {
    const filePath = path.join(root, 'dialog-save.byzx');
    await fs.writeFile(filePath, 'original', { mode: 0o640 });
    const before = (await fs.stat(filePath)).mode;
    await writeScoreFile(filePath, score);
    expect(JSON.parse(await fs.readFile(filePath, 'utf8'))).toEqual(score);
    expect((await fs.stat(filePath)).mode).toBe(before);
  });

  it('keeps existing file identity, permissions and hard links on API overwrite', async () => {
    const filePath = path.join(root, 'metadata.byzx');
    const alias = path.join(root, 'metadata-alias.byzx');
    await writeScoreFile(filePath, score);
    await fs.link(filePath, alias);
    const before = await fs.stat(filePath);
    await files.write({
      filePath,
      data: { ...score, documentProperties: { title: 'API edit', author: '' } },
      overwrite: true,
      expectedSource: null,
    });
    const after = await fs.stat(filePath);
    expect(after.ino).toBe(before.ino);
    expect(after.mode).toBe(before.mode);
    expect(after.uid).toBe(before.uid);
    expect(after.gid).toBe(before.gid);
    expect(
      JSON.parse(await fs.readFile(alias, 'utf8')).documentProperties.title,
    ).toBe('API edit');
  });

  it('requires explicit overwrite for an unrelated destination and leaves no temporary files', async () => {
    const filePath = path.join(root, 'score.byzx');
    await fs.writeFile(filePath, 'original');
    await expect(
      files.write({
        filePath,
        data: score,
        overwrite: false,
        expectedSource: null,
      }),
    ).rejects.toThrow();
    expect(await fs.readFile(filePath, 'utf8')).toBe('original');
    expect(await fs.readdir(root)).toEqual(['score.byzx']);
    await files.write({
      filePath,
      data: score,
      overwrite: true,
      expectedSource: null,
    });
    expect(JSON.parse(await fs.readFile(filePath, 'utf8'))).toEqual(score);
  });

  it('saves to an unchanged source and rejects external modifications even with overwrite', async () => {
    const filePath = path.join(root, 'score.byzx');
    await files.write({
      filePath,
      data: score,
      overwrite: false,
      expectedSource: null,
    });
    const source = await files.read(filePath);
    const expectedSource = {
      filePath,
      mtimeMs: source.sourceMtimeMs,
      size: source.sourceSize,
    };
    await files.write({
      filePath,
      data: score,
      overwrite: false,
      expectedSource,
    });
    await fs.writeFile(filePath, 'external change');
    await expect(
      files.write({ filePath, data: score, overwrite: true, expectedSource }),
    ).rejects.toThrow('SOURCE_FILE_CONFLICT');
    expect(await fs.readFile(filePath, 'utf8')).toBe('external change');
  });

  it.each(['source', 'destination'])(
    'checks source conflicts with an aliased %s path',
    async (aliasedPath) => {
      const filePath = path.join(root, 'score.byzx');
      // Preserve the alias instead of normalizing it with path.join.
      const alias = `${root}${path.sep}..${path.sep}allowed${path.sep}score.byzx`;
      await files.write({
        filePath,
        data: score,
        overwrite: false,
        expectedSource: null,
      });
      const source = await files.read(filePath);
      const expectedSource = {
        filePath: aliasedPath === 'source' ? alias : filePath,
        mtimeMs: source.sourceMtimeMs,
        size: source.sourceSize,
      };
      const destination = aliasedPath === 'destination' ? alias : filePath;
      const saved = await files.write({
        filePath: destination,
        data: score,
        overwrite: false,
        expectedSource,
      });
      expectedSource.mtimeMs = saved.sourceMtimeMs;
      expectedSource.size = saved.sourceSize;
      await fs.writeFile(filePath, 'external change');
      await expect(
        files.write({
          filePath: destination,
          data: score,
          overwrite: true,
          expectedSource,
        }),
      ).rejects.toThrow('SOURCE_FILE_CONFLICT');
      expect(await fs.readFile(filePath, 'utf8')).toBe('external change');
    },
  );

  it('applies overwrite rules to save-as destinations independently of source metadata', async () => {
    const filePath = path.join(root, 'score.byzx');
    await files.write({
      filePath,
      data: score,
      overwrite: false,
      expectedSource: null,
    });
    const source = await files.read(filePath);
    const expectedSource = {
      filePath,
      mtimeMs: source.sourceMtimeMs,
      size: source.sourceSize,
    };
    const destination = path.join(root, 'copy.byzx');
    await fs.writeFile(destination, 'existing destination');
    await fs.writeFile(filePath, 'external change');
    await expect(
      files.write({
        filePath: destination,
        data: score,
        overwrite: false,
        expectedSource,
      }),
    ).rejects.toThrow();
    expect(await fs.readFile(destination, 'utf8')).toBe('existing destination');
    await files.write({
      filePath: destination,
      data: score,
      overwrite: true,
      expectedSource,
    });
    expect(JSON.parse(await fs.readFile(destination, 'utf8'))).toEqual(score);
    await fs.rm(filePath);
    await files.write({
      filePath: path.join(root, 'missing-source-copy.byzx'),
      data: score,
      overwrite: false,
      expectedSource,
    });
  });
});
