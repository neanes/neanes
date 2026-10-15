import { promises as fs } from 'node:fs';
import path from 'node:path';

import type {
  ScoreFileFormat,
  WorkspaceFile,
  WriteScoreFileArgs,
} from '../../../src/services/documents/fileTypes';
import { canonicalFileIdentity, ScoreFiles } from '../files/ScoreFiles';

function contains(root: string, target: string) {
  const relative = path.relative(root, target);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== '..' &&
      !path.isAbsolute(relative))
  );
}

// Canonical paths keep symlinks from expanding the configured filesystem scope.
export class AutomationFiles {
  private files = new ScoreFiles((filePath, source) =>
    this.resolve(
      filePath,
      path.extname(filePath) === '.pdf' ? 'pdf' : 'score',
      true,
      source?.format,
    ),
  );
  private constructor(private roots: string[]) {}

  static async create(roots: string[]) {
    if (roots.length === 0 || roots.some((root) => !path.isAbsolute(root))) {
      throw new Error(
        'MCP_ROOTS_REQUIRED: Configure absolute allowed directories.',
      );
    }
    const canonical = await Promise.all(roots.map((root) => fs.realpath(root)));
    for (const root of canonical) {
      if (!(await fs.stat(root)).isDirectory()) {
        throw new Error('MCP_ROOT_NOT_DIRECTORY');
      }
    }
    return new AutomationFiles(canonical);
  }

  async resolve(
    filePath: string,
    extension: 'score' | 'pdf',
    writing = false,
    sourceFormat?: ScoreFileFormat,
  ) {
    if (!path.isAbsolute(filePath)) {
      throw new Error('ABSOLUTE_PATH_REQUIRED');
    }
    const extensions = extension === 'score' ? ['.byzx', '.byz'] : ['.pdf'];
    if (
      sourceFormat === undefined &&
      !extensions.includes(path.extname(filePath))
    ) {
      throw new Error('UNSUPPORTED_FILE_TYPE');
    }
    let canonical: string;
    if (writing) {
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
    if (!this.roots.some((root) => contains(root, canonical))) {
      throw new Error('PATH_OUTSIDE_ALLOWED_ROOTS');
    }
    return canonical;
  }

  async open(filePath: string, workspaces: WorkspaceFile[]) {
    return this.files.open(
      await this.resolve(filePath, 'score'),
      workspaces,
      filePath,
    );
  }

  async read(filePath: string) {
    return this.files.read(await this.resolve(filePath, 'score'), filePath);
  }

  async write(args: WriteScoreFileArgs) {
    if (!path.isAbsolute(args.filePath)) {
      throw new Error('ABSOLUTE_PATH_REQUIRED');
    }
    const source = args.expectedSource;
    const canonical = await canonicalFileIdentity(args.filePath);
    const sameSource =
      source != null &&
      path.relative(await canonicalFileIdentity(source.filePath), canonical) ===
        '';
    // Only a save to the known source may use its decoding format instead of a suffix.
    const filePath =
      sameSource && source.format !== undefined
        ? await this.resolve(canonical, 'score', true, source.format)
        : await this.resolve(args.filePath, 'score', true);
    return this.files.write({ ...args, filePath });
  }

  async writeOutput(filePath: string, data: Buffer, overwrite: boolean) {
    filePath = await this.resolve(
      filePath,
      path.extname(filePath) === '.pdf' ? 'pdf' : 'score',
      true,
    );
    return this.files.writeOutput(filePath, data, overwrite);
  }
}
