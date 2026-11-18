import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { BatchQuery } from '../../../src/automation/contracts/batch';
import { AutomationError } from '../../../src/automation/contracts/errors';
import type {
  WorkspaceFile,
  WriteScoreFileArgs,
} from '../../../src/services/documents/fileTypes';
import { isScoreFile } from '../files/scoreFiles';
import { canonicalFileIdentity, ScoreFiles } from './scoreFiles';

type OutputKind = 'score' | 'pdf';

function outputKind(filePath: string): OutputKind {
  return path.extname(filePath) === '.pdf' ? 'pdf' : 'score';
}

function assertOutputPath(filePath: string, kind: OutputKind) {
  if (!path.isAbsolute(filePath)) {
    throw new Error('ABSOLUTE_PATH_REQUIRED');
  }
  if (
    kind === 'pdf' ? path.extname(filePath) !== '.pdf' : !isScoreFile(filePath)
  ) {
    throw new Error('UNSUPPORTED_FILE_TYPE');
  }
}

// File access uses the application's OS permissions.
export class AutomationFiles {
  private files = new ScoreFiles((filePath, source) =>
    this.resolve(filePath, outputKind(filePath), true, source != null),
  );

  async resolve(
    filePath: string,
    kind: OutputKind,
    writing = false,
    sourceSave = false,
  ) {
    assertOutputPath(filePath, kind);
    let canonical: string;
    if (writing) {
      // In-place saves may follow the opened source's symlink. Other outputs
      // retain the no-symlink policy.
      if (sourceSave) {
        return fs.realpath(filePath);
      }
      canonical = path.join(
        await fs.realpath(path.dirname(filePath)),
        path.basename(filePath),
      );
      try {
        if ((await fs.lstat(canonical)).isSymbolicLink()) {
          throw new Error('SYMLINK_OUTPUT_NOT_ALLOWED');
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    } else {
      canonical = await fs.realpath(filePath);
    }
    return canonical;
  }

  async planBatch(query: BatchQuery) {
    const identity = (filePath: string, kind: OutputKind) => {
      assertOutputPath(filePath, kind);
      return canonicalFileIdentity(filePath);
    };
    const inputs = await Promise.all(
      query.files.map((file) => identity(file.filePath, 'score')),
    );
    const collision = (filePath: string) => {
      throw new AutomationError({
        code: 'VALIDATION_ERROR',
        message:
          'Batch paths must have distinct identities; outputs cannot overwrite another input.',
        details: { filePath },
      });
    };
    const seenInputs = new Set<string>();
    for (const [index, input] of inputs.entries()) {
      if (seenInputs.has(input)) {
        collision(query.files[index].filePath);
      }
      seenInputs.add(input);
    }
    const outputs = new Set<string>();
    for (const [index, file] of query.files.entries()) {
      for (const [requested, kind, ownSource] of [
        [
          query.save === 'inPlace' ? file.filePath : file.outputFilePath,
          'score',
          query.save === 'inPlace',
        ],
        [file.pdfFilePath, 'pdf', false],
      ] as const) {
        if (requested === undefined) {
          continue;
        }
        const output = await identity(requested, kind);
        if (
          outputs.has(output) ||
          inputs.some(
            (input, other) =>
              input === output && !(ownSource && other === index),
          )
        ) {
          collision(requested);
        }
        outputs.add(output);
      }
    }
  }

  async open(filePath: string, workspaces: WorkspaceFile[]) {
    await this.resolve(filePath, 'score');
    return this.files.open(filePath, workspaces);
  }

  async write(args: WriteScoreFileArgs) {
    return this.files.write(args);
  }

  // ScoreFiles resolves and validates the destination before writing.
  async writeOutput(filePath: string, data: Buffer, overwrite: boolean) {
    return this.files.writeOutput(filePath, data, overwrite);
  }
}
