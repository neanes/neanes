import { promises as fs } from 'node:fs';
import path from 'node:path';

import type {
  OpenScoreFileResult,
  WorkspaceFile,
  WriteScoreFileArgs,
} from '../../../src/services/documents/fileTypes';
import {
  encodeScore,
  readScoreFile,
  scoreFileFormat,
} from '../files/scoreFiles';

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
    return this.read(filePath);
  }

  async read(filePath: string) {
    const before = await fs.stat(filePath);
    // The requested extension selects the format even when a symlink target differs.
    let data: string;
    try {
      data = await readScoreFile(filePath);
    } catch (error) {
      if (scoreFileFormat(filePath) === 'byz' && !('code' in Object(error))) {
        throw new Error('INVALID_SCORE_ARCHIVE', { cause: error });
      }
      throw error;
    }
    const stats = await fs.stat(filePath);
    if (before.mtimeMs !== stats.mtimeMs || before.size !== stats.size) {
      throw new Error('SOURCE_FILE_CONFLICT');
    }
    return {
      filePath,
      data,
      sourceMtimeMs: stats.mtimeMs,
      sourceSize: stats.size,
    };
  }

  async write(args: WriteScoreFileArgs) {
    const filePath = args.filePath;
    scoreFileFormat(filePath);
    const source = args.expectedSource;
    const expectedSource =
      source != null &&
      path.relative(
        await canonicalFileIdentity(source.filePath),
        await canonicalFileIdentity(filePath),
      ) === ''
        ? source
        : null;
    const data = await encodeScore(filePath, args.data);
    await this.writeOutput(
      filePath,
      data,
      args.overwrite || expectedSource != null,
      expectedSource,
    );
    const stats = await fs.stat(filePath);
    return {
      filePath,
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
    if (expectedSource != null) {
      const stats = await fs.stat(filePath);
      if (
        stats.mtimeMs !== expectedSource.mtimeMs ||
        stats.size !== expectedSource.size
      ) {
        throw new Error('SOURCE_FILE_CONFLICT');
      }
    }
    // Keep existing files and their ACLs/attributes in place. Exclusive creation
    // enforces the API's no-overwrite policy for unrelated destinations.
    await fs.writeFile(filePath, data, { flag: overwrite ? 'w' : 'wx' });
  }
}
