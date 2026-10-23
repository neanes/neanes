import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { batchQuerySchema } from '../../../src/automation/contracts/batch';
import { Score } from '../../../src/models/Score';
import { SaveService } from '../../../src/services/SaveService';
import { writeScoreFile } from '../files/scoreFiles';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

import { AutomationFiles } from './files';

async function readScore(files: AutomationFiles, filePath: string) {
  const result = await files.open(filePath, []);
  if ('documentId' in result) {
    throw new Error('An empty workspace list must read the saved file.');
  }
  return result;
}

describe('automation file access', () => {
  let directory: string;
  let root: string;
  let files: AutomationFiles;
  beforeEach(async () => {
    directory = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'neanes-mcp-scope-')),
    );
    root = path.join(directory, 'allowed');
    await fs.mkdir(root);
    files = new AutomationFiles();
  });
  afterEach(async () => {
    await fs.rm(directory, { recursive: true, force: true });
  });

  it('preflights batch paths including aliases and outputs that would clobber later inputs', async () => {
    const first = path.join(root, 'a.byzx');
    const second = path.join(root, 'b.byzx');
    await fs.writeFile(first, '{}');
    await fs.writeFile(second, '{}');
    const alias = path.join(root, 'alias.byzx');
    await fs.symlink(first, alias);
    await files.planBatch(
      batchQuerySchema.parse({
        files: [{ filePath: first }, { filePath: second }],
      }),
    );
    for (const query of [
      { files: [{ filePath: first }, { filePath: alias }] },
      {
        files: [
          { filePath: first, outputFilePath: second },
          { filePath: second, outputFilePath: path.join(root, 'c.byzx') },
        ],
        save: 'copy',
      },
      { files: [{ filePath: first, outputFilePath: alias }], save: 'copy' },
      {
        files: [
          { filePath: first, pdfFilePath: path.join(root, 'same.pdf') },
          { filePath: second, pdfFilePath: path.join(root, 'same.pdf') },
        ],
      },
    ]) {
      await expect(
        files.planBatch(batchQuerySchema.parse(query)),
      ).rejects.toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
    }
    const outputAlias = path.join(root, 'alias.pdf');
    await fs.symlink(second, outputAlias);
    await expect(
      files.planBatch(
        batchQuerySchema.parse({
          files: [
            { filePath: first, pdfFilePath: outputAlias },
            { filePath: second },
          ],
        }),
      ),
    ).rejects.toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
    await expect(
      files.planBatch(
        batchQuerySchema.parse({ files: [{ filePath: 'relative.byzx' }] }),
      ),
    ).rejects.toThrow('ABSOLUTE_PATH_REQUIRED');
    expect(await fs.readFile(first, 'utf8')).toBe('{}');
    expect(await fs.readFile(second, 'utf8')).toBe('{}');
  });

  it('decodes an allowed symlink using its requested extension', async () => {
    const target = path.join(root, 'extensionless');
    const requested = path.join(root, 'score.byzx');
    await fs.writeFile(target, '{"version":"1.0"}');
    await fs.symlink(target, requested);

    for (const result of [
      await readScore(files, requested),
      await readScore(files, requested),
    ]) {
      expect(result).toMatchObject({
        filePath: requested,
        data: '{"version":"1.0"}',
      });
    }
  });

  it('allows paths outside the former root while preserving path and symlink-output validation', async () => {
    const outside = path.join(directory, 'outside.byzx');
    await fs.writeFile(outside, '{"version":"1.0"}');
    await fs.symlink(outside, path.join(root, 'link.byzx'));
    await fs.symlink(directory, path.join(root, 'escape'), 'dir');
    for (const requested of [
      outside,
      path.join(root, '..', 'outside.byzx'),
      path.join(root, 'link.byzx'),
    ]) {
      expect((await readScore(files, requested)).filePath).toBe(requested);
    }
    expect(
      await files.resolve(path.join(root, 'escape', 'new.pdf'), 'pdf', true),
    ).toBe(path.join(directory, 'new.pdf'));
    await expect(
      files.resolve(path.join(root, 'link.byzx'), 'score', true),
    ).rejects.toThrow('SYMLINK_OUTPUT_NOT_ALLOWED');
    await expect(readScore(files, 'relative.byzx')).rejects.toThrow(
      'ABSOLUTE_PATH_REQUIRED',
    );
  });
});

describe('requested paths and file validation', () => {
  it.each(['byzx', 'byz'] as const)(
    'round-trips %s aliases through extensionless and differently named targets',
    async (format) => {
      const directory = await fs.realpath(
        await fs.mkdtemp(path.join(os.tmpdir(), 'neanes-requested-path-')),
      );
      try {
        const files = new AutomationFiles();
        const score = SaveService.SaveScoreToJson(new Score());
        for (const suffix of ['', format === 'byz' ? '.byzx' : '.byz']) {
          const target = path.join(directory, `target${suffix}`);
          const alias = path.join(directory, `alias${suffix}.${format}`);
          await writeScoreFile(alias, score);
          await fs.rename(alias, target);
          await fs.symlink(target, alias);
          const opened = await readScore(files, alias);
          expect(opened.filePath).toBe(alias);
          const expectedSource = {
            filePath: opened.filePath,
            mtimeMs: opened.sourceMtimeMs,
            size: opened.sourceSize,
          };
          score.documentProperties = { title: 'Changed', author: '' };
          const saved = await files.write({
            filePath: opened.filePath,
            data: score,
            overwrite: false,
            expectedSource,
          });
          expect(saved.filePath).toBe(alias);
          expect((await fs.lstat(alias)).isSymbolicLink()).toBe(true);
          expect(
            JSON.parse((await readScore(files, alias)).data).documentProperties
              .title,
          ).toBe('Changed');
          // Identity aliases do not weaken source conflict protection.
          await fs.appendFile(target, 'external modification');
          await expect(
            files.write({
              filePath: alias,
              data: score,
              overwrite: true,
              expectedSource,
            }),
          ).rejects.toThrow('SOURCE_FILE_CONFLICT');
          const copy = path.join(
            directory,
            `copy${suffix}.${format === 'byz' ? 'byzx' : 'byz'}`,
          );
          const copied = await files.write({
            filePath: copy,
            data: score,
            overwrite: false,
            expectedSource,
          });
          expect(copied.filePath).toBe(copy);
          expect(JSON.parse((await readScore(files, copy)).data)).toEqual(
            score,
          );
        }
      } finally {
        await fs.rm(directory, { recursive: true, force: true });
      }
    },
  );

  it('validates suffixes and symlink outputs while permitting saves in other folders', async () => {
    const directory = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'neanes-source-scope-')),
    );
    try {
      const root = path.join(directory, 'allowed');
      await fs.mkdir(root);
      const files = new AutomationFiles();
      const score = SaveService.SaveScoreToJson(new Score());
      const source = path.join(root, 'source.byzx');
      await writeScoreFile(source, score);
      const opened = await readScore(files, source);
      const expectedSource = {
        filePath: source,
        mtimeMs: opened.sourceMtimeMs,
        size: opened.sourceSize,
      };
      await expect(
        files.write({
          filePath: path.join(root, 'unrelated'),
          data: score,
          overwrite: true,
          expectedSource,
        }),
      ).rejects.toThrow('UNSUPPORTED_FILE_TYPE');
      await expect(
        files.write({
          filePath: 'source.byzx',
          data: score,
          overwrite: true,
          expectedSource,
        }),
      ).rejects.toThrow('ABSOLUTE_PATH_REQUIRED');
      const outside = path.join(directory, 'outside.byzx');
      await files.write({
        filePath: outside,
        data: score,
        overwrite: false,
        expectedSource,
      });
      expect(JSON.parse((await readScore(files, outside)).data)).toEqual(score);
      const link = path.join(root, 'other.byzx');
      await fs.symlink(outside, link);
      await expect(
        files.write({
          filePath: link,
          data: score,
          overwrite: true,
          expectedSource,
        }),
      ).rejects.toThrow('SYMLINK_OUTPUT_NOT_ALLOWED');
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
});
