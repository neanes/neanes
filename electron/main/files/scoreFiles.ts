import { randomUUID } from 'node:crypto';
import { constants, promises as fs } from 'node:fs';
import path from 'node:path';

import JSZip from 'jszip';

import type { Score } from '../../../src/models/save/v1/Score';

export class ScoreFileError extends Error {
  constructor(
    public readonly code: 'INVALID_SCORE_ARCHIVE' | 'NOT_REGULAR_FILE',
  ) {
    super(code);
  }
}

export async function readScoreFile(filePath: string): Promise<string> {
  if (path.extname(filePath) === '.byz') {
    const zip = await JSZip.loadAsync(await fs.readFile(filePath));
    const entry = zip.file(/\.(byzx)$/)[0];
    if (entry === undefined) {
      throw new ScoreFileError('INVALID_SCORE_ARCHIVE');
    }
    return entry.async('text');
  }
  if (path.extname(filePath) === '.byzx') {
    return fs.readFile(filePath, 'utf8');
  }
  throw `Unsupported file type: ${path.extname(filePath)}`;
}

async function encodeScore(filePath: string, score: Score) {
  // The selected path determines the format, even when its symlink target has
  // a different extension. The editor keeps that selected path for later saves.
  if (path.extname(filePath) === '.byz') {
    const zip = new JSZip();
    zip.file(`${path.basename(filePath, '.byz')}.byzx`, JSON.stringify(score));
    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  }
  return Buffer.from(JSON.stringify(score, null, 2));
}

async function resolveDestination(filePath: string): Promise<string> {
  try {
    return await fs.realpath(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
  // realpath cannot resolve a dangling link, but saving through one should
  // still create its target, just as a direct write would.
  try {
    const entry = await fs.lstat(filePath);
    if (entry.isSymbolicLink()) {
      return resolveDestination(
        path.resolve(path.dirname(filePath), await fs.readlink(filePath)),
      );
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
  return path.join(
    await fs.realpath(path.dirname(filePath)),
    path.basename(filePath),
  );
}

export async function writeScoreFile(filePath: string, score: Score) {
  // Finish encoding before touching the destination or creating a temporary file.
  const data = await encodeScore(filePath, score);
  const destination = await resolveDestination(filePath);
  let mode: number | undefined;
  try {
    const existing = await fs.stat(destination);
    if (!existing.isFile()) {
      throw new ScoreFileError('NOT_REGULAR_FILE');
    }
    // Replacing a directory entry must not bypass a read-only file's protection.
    await fs.access(destination, constants.W_OK);
    mode = existing.mode & 0o777;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
  const temporary = path.join(
    path.dirname(destination),
    `.neanes-${randomUUID()}.tmp`,
  );
  const handle = await fs.open(temporary, 'wx', mode ?? 0o666);
  try {
    try {
      await handle.writeFile(data);
      if (mode !== undefined) {
        // open's mode is affected by umask; retain existing permission bits exactly.
        await handle.chmod(mode);
      }
      await handle.sync();
    } finally {
      await handle.close();
    }
    // A sibling temporary file keeps this replacement on the same filesystem.
    await fs.rename(temporary, destination);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}
