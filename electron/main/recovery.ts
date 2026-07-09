import crypto from 'crypto';
import { app } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';

import type {
  DiscardRecoverySnapshotReplyArgs,
  ListRecoveryCandidatesReplyArgs,
  RecoveryCandidateArgs,
  RecoverySnapshotArgs,
  SaveRecoverySnapshotReplyArgs,
} from '../../src/ipc/ipcChannels';

const recoverySchemaVersion = 1;

interface RecoverySnapshotEnvelope {
  schemaVersion: number;
  snapshotId: string;
  workspaceId: string;
  createdAt: number;
  updatedAt: number;
  filePath: string | null;
  tempFileName: string;
  hasUnsavedChanges: boolean;
  score: string;
  sourceMtimeMs: number | null;
  sourceSize: number | null;
  appVersion: string;
  contentLength: number;
  contentSha256: string;
}

interface RecoverySnapshotFile {
  envelope: RecoverySnapshotEnvelope;
}

export class RecoveryStore {
  constructor(private readonly recoveryDir: string) {}

  public async listRecoveryCandidates(): Promise<ListRecoveryCandidatesReplyArgs> {
    await fs.mkdir(this.recoveryDir, { recursive: true });

    const entries = await fs.readdir(this.recoveryDir, {
      withFileTypes: true,
    });

    const workspaceIds = new Set<string>();

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      if (entry.name.endsWith('.prev.json')) {
        workspaceIds.add(entry.name.replace(/\.prev\.json$/, ''));
      } else if (
        entry.name.endsWith('.json') &&
        !entry.name.endsWith('.tmp.json')
      ) {
        workspaceIds.add(entry.name.replace(/\.json$/, ''));
      }
    }

    const candidates: RecoveryCandidateArgs[] = [];

    for (const workspaceId of workspaceIds) {
      let currentPath: string;
      let prevPath: string;

      try {
        currentPath = this.getCurrentPath(workspaceId);
        prevPath = currentPath.replace(/\.json$/, '.prev.json');
      } catch {
        continue;
      }

      const recoveryFile =
        (await this.readRecoveryFile(currentPath)) ??
        (await this.readRecoveryFile(prevPath));

      if (recoveryFile == null) {
        continue;
      }

      candidates.push(await this.toCandidate(recoveryFile));
    }

    candidates.sort((a, b) => b.updatedAt - a.updatedAt);

    return { candidates };
  }

  public async saveRecoverySnapshot(
    snapshot: RecoverySnapshotArgs,
  ): Promise<SaveRecoverySnapshotReplyArgs> {
    try {
      await fs.mkdir(this.recoveryDir, { recursive: true });

      const currentPath = this.getCurrentPath(snapshot.workspaceId);
      const prevPath = this.getPreviousPath(snapshot.workspaceId);
      const tempPath = this.getTempPath(snapshot.workspaceId);
      const existing = await this.readRecoveryFile(currentPath);
      const now = Date.now();
      const score = snapshot.score;
      const contentLength = Buffer.byteLength(score, 'utf8');
      const contentSha256 = crypto
        .createHash('sha256')
        .update(score, 'utf8')
        .digest('hex');
      const envelope: RecoverySnapshotEnvelope = {
        schemaVersion: recoverySchemaVersion,
        snapshotId: uuidv4(),
        workspaceId: snapshot.workspaceId,
        createdAt: existing?.envelope.createdAt ?? now,
        updatedAt: now,
        filePath: snapshot.filePath,
        tempFileName: snapshot.tempFileName,
        hasUnsavedChanges: snapshot.hasUnsavedChanges,
        score,
        sourceMtimeMs: snapshot.sourceMtimeMs,
        sourceSize: snapshot.sourceSize,
        appVersion: app.getVersion(),
        contentLength,
        contentSha256,
      };

      const data = JSON.stringify({ envelope }, null, 2);
      const tempFile = await fs.open(tempPath, 'w');

      try {
        await tempFile.writeFile(data, 'utf8');
        await tempFile.sync();
      } finally {
        await tempFile.close();
      }

      try {
        await fs.rm(prevPath, { force: true });
      } catch {
        // Ignore best-effort cleanup.
      }

      try {
        await fs.access(currentPath);
        await fs.rename(currentPath, prevPath);
        await this.syncDirectory(this.recoveryDir);
      } catch {
        // Current file may not exist yet. That's fine.
      }

      await fs.rename(tempPath, currentPath);
      await this.syncDirectory(this.recoveryDir);

      return { success: true };
    } catch (error) {
      try {
        await fs.rm(this.getTempPath(snapshot.workspaceId), { force: true });
      } catch {
        // Ignore cleanup failures after a write error.
      }

      return {
        success: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Unable to save recovery snapshot.',
      };
    }
  }

  public async discardRecoverySnapshot(
    workspaceId: string,
  ): Promise<DiscardRecoverySnapshotReplyArgs> {
    try {
      await fs.rm(this.getCurrentPath(workspaceId), { force: true });
      await fs.rm(this.getPreviousPath(workspaceId), { force: true });
      await fs.rm(this.getTempPath(workspaceId), { force: true });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Unable to discard recovery snapshot.',
      };
    }
  }

  private async readRecoveryFile(filePath: string) {
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw) as RecoverySnapshotFile;
      const envelope = parsed?.envelope;

      if (
        envelope == null ||
        envelope.schemaVersion !== recoverySchemaVersion ||
        envelope.workspaceId == null ||
        typeof envelope.score !== 'string' ||
        envelope.contentLength !== Buffer.byteLength(envelope.score, 'utf8') ||
        envelope.contentSha256 !==
          crypto
            .createHash('sha256')
            .update(envelope.score, 'utf8')
            .digest('hex')
      ) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private async toCandidate(
    recoveryFile: RecoverySnapshotFile,
  ): Promise<RecoveryCandidateArgs> {
    const envelope = recoveryFile.envelope;
    const sourceStats =
      envelope.filePath != null
        ? await this.readSourceStats(envelope.filePath)
        : null;

    const sourceExists = sourceStats != null;
    const sourceMatches =
      sourceStats != null &&
      sourceStats.mtimeMs === envelope.sourceMtimeMs &&
      sourceStats.size === envelope.sourceSize;

    return {
      recoveryId: envelope.workspaceId,
      workspaceId: envelope.workspaceId,
      filePath: envelope.filePath,
      tempFileName: envelope.tempFileName,
      hasUnsavedChanges: envelope.hasUnsavedChanges,
      score: envelope.score,
      updatedAt: envelope.updatedAt,
      sourceMtimeMs: envelope.sourceMtimeMs,
      sourceSize: envelope.sourceSize,
      sourceExists,
      sourceMatches,
      isUntitled: envelope.filePath == null,
    };
  }

  private async readSourceStats(filePath: string) {
    try {
      const stats = await fs.stat(filePath);

      return {
        mtimeMs: stats.mtimeMs,
        size: stats.size,
      };
    } catch {
      return null;
    }
  }

  private getCurrentPath(workspaceId: string) {
    return path.join(
      this.recoveryDir,
      `${this.getSafeWorkspaceId(workspaceId)}.json`,
    );
  }

  private getPreviousPath(workspaceId: string) {
    return path.join(
      this.recoveryDir,
      `${this.getSafeWorkspaceId(workspaceId)}.prev.json`,
    );
  }

  private getTempPath(workspaceId: string) {
    return path.join(
      this.recoveryDir,
      `${this.getSafeWorkspaceId(workspaceId)}.tmp.json`,
    );
  }

  private async syncDirectory(directoryPath: string) {
    try {
      const dirHandle = await fs.open(directoryPath, 'r');

      try {
        await dirHandle.sync();
      } finally {
        await dirHandle.close();
      }
    } catch {
      // Directory syncing is best-effort and not supported everywhere.
    }
  }

  private getSafeWorkspaceId(workspaceId: string) {
    if (!validateUuid(workspaceId)) {
      throw new Error(`Invalid recovery workspace id: ${workspaceId}`);
    }

    return workspaceId;
  }
}
