import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Score } from '../../../src/models/Score';
import { SaveService } from '../../../src/services/SaveService';
import { readScoreFile, writeScoreFile } from './scoreFiles';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

describe('score file persistence', () => {
  let directory: string;
  const score = SaveService.SaveScoreToJson(new Score());
  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'neanes-score-files-'));
  });
  afterEach(async () => {
    await fs.rm(directory, { recursive: true, force: true });
  });

  it.each(['byz', 'byzx'])(
    'round-trips and overwrites .%s scores',
    async (extension) => {
      const file = path.join(directory, `score.${extension}`);
      await writeScoreFile(file, score);
      expect(JSON.parse(await readScoreFile(file))).toEqual(score);
      const changed = {
        ...score,
        documentProperties: { title: 'Changed', author: '' },
      };
      await writeScoreFile(file, changed);
      expect(JSON.parse(await readScoreFile(file))).toEqual(changed);
      expect(await fs.readdir(directory)).toEqual([`score.${extension}`]);
      if (extension === 'byz') {
        const zip = await JSZip.loadAsync(await fs.readFile(file));
        expect(Object.keys(zip.files)).toEqual(['score.byzx']);
      } else {
        expect(await fs.readFile(file, 'utf8')).toBe(
          JSON.stringify(changed, null, 2),
        );
      }
    },
  );

  it.skipIf(process.platform === 'win32').each(['byz', 'byzx'])(
    'preserves a .%s symlink and encodes by its selected extension',
    async (extension) => {
      const alias = path.join(directory, `selected.${extension}`);
      const target = path.join(directory, 'target-without-extension');
      await fs.writeFile(target, 'old content');
      await fs.symlink(path.basename(target), alias);
      await writeScoreFile(alias, score);
      expect((await fs.lstat(alias)).isSymbolicLink()).toBe(true);
      expect(await fs.readlink(alias)).toBe(path.basename(target));
      expect(JSON.parse(await readScoreFile(alias))).toEqual(score);
      expect(await fs.readFile(target)).toEqual(await fs.readFile(alias));
      expect((await fs.readdir(directory)).sort()).toEqual([
        `selected.${extension}`,
        'target-without-extension',
      ]);
    },
  );

  it.skipIf(process.platform === 'win32')(
    'follows a dangling symlink when creating its target',
    async () => {
      const alias = path.join(directory, 'score.byzx');
      await fs.symlink('new-target', alias);
      await writeScoreFile(alias, score);
      expect((await fs.lstat(alias)).isSymbolicLink()).toBe(true);
      expect(
        JSON.parse(
          await fs.readFile(path.join(directory, 'new-target'), 'utf8'),
        ),
      ).toEqual(score);
    },
  );

  it.skipIf(process.platform === 'win32')(
    'retains existing permission bits',
    async () => {
      const file = path.join(directory, 'score.byzx');
      await fs.writeFile(file, 'original');
      await fs.chmod(file, 0o640);
      await writeScoreFile(file, score);
      expect((await fs.stat(file)).mode & 0o777).toBe(0o640);
    },
  );

  it.skipIf(process.platform === 'win32' || process.getuid?.() === 0)(
    'does not bypass a read-only file',
    async () => {
      const file = path.join(directory, 'score.byzx');
      await fs.writeFile(file, 'original');
      await fs.chmod(file, 0o444);
      await expect(writeScoreFile(file, score)).rejects.toMatchObject({
        code: 'EACCES',
      });
      expect(await fs.readFile(file, 'utf8')).toBe('original');
      expect(await fs.readdir(directory)).toEqual(['score.byzx']);
    },
  );

  it('saves long filenames', async () => {
    const basename = `${'x'.repeat(230)}.byzx`;
    const file = path.join(directory, basename);
    await writeScoreFile(file, score);
    await writeScoreFile(file, score);
    expect(JSON.parse(await readScoreFile(file))).toEqual(score);
    expect(await fs.readdir(directory)).toEqual([basename]);
  });

  it.each(['byz', 'byzx'])(
    'preserves file identity and hard links when saving .%s',
    async (extension) => {
      const file = path.join(directory, `score.${extension}`);
      const alias = path.join(directory, `alias.${extension}`);
      await writeScoreFile(file, score);
      await fs.link(file, alias);
      const before = await fs.stat(file);
      const changed = {
        ...score,
        documentProperties: { title: 'Changed', author: '' },
      };
      await writeScoreFile(file, changed);
      const after = await fs.stat(file);
      expect(after.ino).toBe(before.ino);
      expect(after.uid).toBe(before.uid);
      expect(after.gid).toBe(before.gid);
      expect(after.mode).toBe(before.mode);
      expect(JSON.parse(await readScoreFile(alias))).toEqual(changed);
    },
  );

  it.skipIf(process.platform !== 'darwin')(
    'preserves macOS ACLs and extended attributes',
    async () => {
      const file = path.join(directory, 'score.byzx');
      await writeScoreFile(file, score);
      execFileSync('/bin/chmod', [
        '+a',
        `${os.userInfo().username} allow read,write,readattr,writeattr,readextattr,writeextattr,readsecurity`,
        file,
      ]);
      execFileSync('/usr/bin/xattr', [
        '-w',
        'com.neanes.persistence-test',
        'retained',
        file,
      ]);
      const acl = () =>
        execFileSync('/bin/ls', ['-le', file], { encoding: 'utf8' })
          .split('\n')
          .slice(1);
      const before = acl();
      expect(before.join('\n')).toContain('allow');
      await writeScoreFile(file, {
        ...score,
        documentProperties: { title: 'Changed', author: '' },
      });
      expect(acl()).toEqual(before);
      expect(
        execFileSync(
          '/usr/bin/xattr',
          ['-p', 'com.neanes.persistence-test', file],
          { encoding: 'utf8' },
        ).trim(),
      ).toBe('retained');
    },
  );

  it('leaves the destination intact when serialization fails', async () => {
    const file = path.join(directory, 'score.byzx');
    await writeScoreFile(file, score);
    const original = await fs.readFile(file);
    const circular = { ...score };
    Object.assign(circular, { circular });
    await expect(writeScoreFile(file, circular)).rejects.toThrow(TypeError);
    expect(await fs.readFile(file)).toEqual(original);
    expect(await fs.readdir(directory)).toEqual(['score.byzx']);
  });

  it('rejects directories without modifying their contents', async () => {
    const file = path.join(directory, 'score.byzx');
    await fs.mkdir(file);
    await fs.writeFile(path.join(file, 'keep'), 'original');
    await expect(writeScoreFile(file, score)).rejects.toMatchObject({
      code: 'EISDIR',
    });
    expect(await fs.readFile(path.join(file, 'keep'), 'utf8')).toBe('original');
    expect(await fs.readdir(directory)).toEqual(['score.byzx']);
  });

  it('reports a missing destination directory', async () => {
    await expect(
      writeScoreFile(path.join(directory, 'missing', 'score.byzx'), score),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await fs.readdir(directory)).toEqual([]);
  });

  it('rejects unsupported input extensions', async () => {
    await expect(readScoreFile(path.join(directory, 'score.txt'))).rejects.toBe(
      'Unsupported file type: .txt',
    );
  });

  it('reports malformed archives and archives without score content', async () => {
    const file = path.join(directory, 'score.byz');
    await fs.writeFile(file, 'not a zip');
    await expect(readScoreFile(file)).rejects.toThrow();
    const zip = new JSZip();
    zip.file('unrelated.txt', 'content');
    await fs.writeFile(file, await zip.generateAsync({ type: 'nodebuffer' }));
    await expect(readScoreFile(file)).rejects.toThrow();
  });
});
