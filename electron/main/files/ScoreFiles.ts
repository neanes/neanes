import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import JSZip from 'jszip';

import type { Score } from '../../../src/models/save/v1/Score';
import type {
  OpenScoreFileResult,
  ScoreFileFormat,
  WorkspaceFile,
  WriteScoreFileArgs,
} from '../../../src/services/documents/fileTypes';

export function scoreFileFormat(filePath: string): ScoreFileFormat {
  const extension = path.extname(filePath);
  if (extension !== '.byz' && extension !== '.byzx') {
    throw new Error('UNSUPPORTED_FILE_TYPE');
  }
  return extension === '.byz' ? 'byz' : 'byzx';
}

export async function readScoreFile(filePath: string, formatPath = filePath) {
  const format = scoreFileFormat(formatPath);
  if (format === 'byz') {
    const bytes = await fs.readFile(filePath);
    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(bytes);
    } catch (error) {
      throw new Error('INVALID_SCORE_ARCHIVE', { cause: error });
    }
    const entry = zip.file(/\.(byzx)$/)[0];
    if (entry == null) {
      throw new Error('INVALID_SCORE_ARCHIVE');
    }
    return entry.async('text');
  }
  return fs.readFile(filePath, 'utf8');
}

export async function encodeScore(
  filePath: string,
  score: Score,
  format = scoreFileFormat(filePath),
) {
  if (format === 'byz') {
    const zip = new JSZip();
    zip.file(`${path.basename(filePath, '.byz')}.byzx`, JSON.stringify(score));
    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  }
  return Buffer.from(JSON.stringify(score, null, 2));
}

export async function writeScoreFile(
  filePath: string,
  score: Score,
  format = scoreFileFormat(filePath),
) {
  await fs.writeFile(filePath, await encodeScore(filePath, score, format));
}

// Missing sources must still allow save-as to a different destination.
export async function canonicalFileIdentity(filePath: string): Promise<string> {
  try {
    return await fs.realpath(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  try {
    return path.join(
      await fs.realpath(path.dirname(filePath)),
      path.basename(filePath),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
    return path.resolve(filePath);
  }
}

export class ScoreFiles {
  constructor(
    private resolveOutputPath:
      | ((
          filePath: string,
          source: WriteScoreFileArgs['expectedSource'],
        ) => Promise<string>)
      | null = null,
  ) {}
  async open(
    filePath: string,
    workspaces: WorkspaceFile[],
    formatPath = filePath,
  ): Promise<OpenScoreFileResult> {
    const canonical = await canonicalFileIdentity(filePath);
    for (const workspace of workspaces) {
      if (
        path.relative(
          await canonicalFileIdentity(workspace.filePath),
          canonical,
        ) === ''
      ) {
        return { documentId: workspace.documentId };
      }
    }
    return this.read(canonical, formatPath);
  }

  async read(filePath: string, formatPath = filePath) {
    filePath = await canonicalFileIdentity(filePath);
    const before = await fs.stat(filePath);
    // The requested extension selects the format even when a symlink target differs.
    const data = await readScoreFile(filePath, formatPath);
    const stats = await fs.stat(filePath);
    if (before.mtimeMs !== stats.mtimeMs || before.size !== stats.size) {
      throw new Error('SOURCE_FILE_CONFLICT');
    }
    return {
      filePath,
      data,
      sourceFormat: scoreFileFormat(formatPath),
      sourceMtimeMs: stats.mtimeMs,
      sourceSize: stats.size,
    };
  }

  async write(args: WriteScoreFileArgs) {
    const filePath = await canonicalFileIdentity(args.filePath);
    const source = args.expectedSource;
    const expectedSource =
      source != null &&
      path.relative(
        await canonicalFileIdentity(source.filePath),
        await canonicalFileIdentity(filePath),
      ) === ''
        ? source
        : null;
    const sourceFormat =
      expectedSource?.format ?? scoreFileFormat(args.filePath);
    const data = await encodeScore(filePath, args.data, sourceFormat);
    await this.writeOutput(
      filePath,
      data,
      args.overwrite || expectedSource != null,
      expectedSource,
    );
    const stats = await fs.stat(filePath);
    return {
      filePath,
      sourceFormat,
      sourceMtimeMs: stats.mtimeMs,
      sourceSize: stats.size,
    };
  }

  async writeOutput(
    filePath: string,
    data: Buffer,
    overwrite: boolean,
    expectedSource: WriteScoreFileArgs['expectedSource'] = null,
  ) {
    if (this.resolveOutputPath != null) {
      filePath = await this.resolveOutputPath(filePath, expectedSource);
    }
    const tempPath = path.join(
      path.dirname(filePath),
      `.${path.basename(filePath)}.${randomUUID()}.tmp`,
    );
    try {
      await fs.writeFile(tempPath, data, { flag: 'wx', mode: 0o600 });
      if (expectedSource != null) {
        const stats = await fs.stat(filePath);
        if (
          stats.mtimeMs !== expectedSource.mtimeMs ||
          stats.size !== expectedSource.size
        ) {
          throw new Error('SOURCE_FILE_CONFLICT');
        }
      }
      if (overwrite) {
        await fs.rename(tempPath, filePath);
      } else {
        await fs.link(tempPath, filePath);
      }
    } finally {
      await fs.rm(tempPath, { force: true });
    }
  }
}
