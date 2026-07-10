import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';

import type {
  DiscardRecoverySnapshotReplyArgs,
  DiscardRecoverySnapshotsReplyArgs,
  ListRecoveryCandidatesReplyArgs,
  RecoveryCandidateArgs,
  RecoverySnapshotArgs,
  SaveRecoverySnapshotReplyArgs,
} from '../../ipc/ipcChannels';

const recoverySchemaVersion = 1;
const abandonedTempCleanupAgeMs = 24 * 60 * 60 * 1000;

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
  private readonly workspaceOperationQueues = new Map<string, Promise<void>>();

  constructor(
    private readonly recoveryDir: string,
    private readonly getAppVersion: () => string = () => 'unknown',
  ) {}

  public async listRecoveryCandidates(): Promise<ListRecoveryCandidatesReplyArgs> {
    await fs.mkdir(this.recoveryDir, { recursive: true });

    const entries = await fs.readdir(this.recoveryDir, {
      withFileTypes: true,
    });

    const workspaceIds = new Set<string>();
    const tempWorkspaceIds = new Set<string>();

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      if (entry.name.endsWith('.prev.json')) {
        workspaceIds.add(entry.name.replace(/\.prev\.json$/, ''));
      } else if (entry.name.endsWith('.tmp.json')) {
        tempWorkspaceIds.add(entry.name.replace(/\.tmp\.json$/, ''));
      } else if (
        entry.name.endsWith('.json') &&
        !entry.name.endsWith('.prev.json')
      ) {
        workspaceIds.add(entry.name.replace(/\.json$/, ''));
      }
    }

    const candidates: RecoveryCandidateArgs[] = [];

    for (const workspaceId of workspaceIds) {
      try {
        const currentPath = this.getCurrentPath(workspaceId);
        const prevPath = this.getPreviousPath(workspaceId);
        const tempPath = this.getTempPath(workspaceId);

        const currentRecoveryFile = await this.readRecoveryFile(currentPath);
        const previousRecoveryFile = await this.readRecoveryFile(prevPath);

        if (currentRecoveryFile != null) {
          candidates.push(
            await this.toCandidate(currentRecoveryFile, 'current'),
          );
        }

        if (previousRecoveryFile != null) {
          candidates.push(
            await this.toCandidate(previousRecoveryFile, 'previous'),
          );
        }

        if (currentRecoveryFile != null || previousRecoveryFile != null) {
          await this.cleanupAbandonedTempFile(tempPath);
        }
      } catch {
        continue;
      }
    }

    for (const workspaceId of tempWorkspaceIds) {
      if (workspaceIds.has(workspaceId)) {
        continue;
      }

      try {
        await this.cleanupAbandonedTempFile(this.getTempPath(workspaceId));
      } catch {
        continue;
      }
    }

    candidates.sort((a, b) => b.updatedAt - a.updatedAt);

    return { candidates };
  }

  public async saveRecoverySnapshot(
    snapshot: RecoverySnapshotArgs,
  ): Promise<SaveRecoverySnapshotReplyArgs> {
    return this.runWorkspaceOperation(snapshot.workspaceId, async () => {
      try {
        await fs.mkdir(this.recoveryDir, { recursive: true });

        const currentPath = this.getCurrentPath(snapshot.workspaceId);
        const prevPath = this.getPreviousPath(snapshot.workspaceId);
        const tempPath = this.getTempPath(snapshot.workspaceId);
        const existing = await this.readRecoveryFile(currentPath);
        const now = Date.now();
        const preserveCurrentSnapshot =
          snapshot.preserveCurrentSnapshot === true;
        const preserveCurrentSnapshotId =
          preserveCurrentSnapshot && existing != null
            ? existing.envelope.snapshotId
            : uuidv4();
        const createdAt = existing?.envelope.createdAt ?? now;
        const score = snapshot.score;
        const contentLength = Buffer.byteLength(score, 'utf8');
        const contentSha256 = crypto
          .createHash('sha256')
          .update(score, 'utf8')
          .digest('hex');
        const envelope: RecoverySnapshotEnvelope = {
          schemaVersion: recoverySchemaVersion,
          snapshotId: preserveCurrentSnapshotId,
          workspaceId: snapshot.workspaceId,
          createdAt,
          updatedAt: now,
          filePath: snapshot.filePath,
          tempFileName: snapshot.tempFileName,
          hasUnsavedChanges: snapshot.hasUnsavedChanges,
          score,
          sourceMtimeMs: snapshot.sourceMtimeMs,
          sourceSize: snapshot.sourceSize,
          appVersion: this.getAppVersion(),
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

        if (preserveCurrentSnapshot) {
          try {
            await fs.access(currentPath);
            await fs.rename(currentPath, prevPath);
          } catch {
            // Current file may not exist yet. That's fine.
          }

          await fs.rename(tempPath, currentPath);

          try {
            await fs.rm(prevPath, { force: true });
          } catch {
            // Ignore best-effort cleanup.
          }

          await this.syncDirectory(this.recoveryDir);

          return { success: true };
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
          if (validateUuid(snapshot.workspaceId)) {
            await fs.rm(this.getTempPath(snapshot.workspaceId), {
              force: true,
            });
          }
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
    });
  }

  public async discardRecoverySnapshot(
    workspaceId: string,
  ): Promise<DiscardRecoverySnapshotReplyArgs> {
    return this.runWorkspaceOperation(workspaceId, async () => {
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
    });
  }

  public async discardRecoverySnapshots(
    recoveryIds: string[],
  ): Promise<DiscardRecoverySnapshotsReplyArgs> {
    try {
      await fs.mkdir(this.recoveryDir, { recursive: true });

      const recoveryIdSet = new Set(recoveryIds);
      if (recoveryIdSet.size === 0) {
        return { success: true };
      }

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
        } else if (entry.name.endsWith('.tmp.json')) {
          workspaceIds.add(entry.name.replace(/\.tmp\.json$/, ''));
        } else if (entry.name.endsWith('.json')) {
          workspaceIds.add(entry.name.replace(/\.json$/, ''));
        }
      }

      for (const workspaceId of workspaceIds) {
        await this.runWorkspaceOperation(workspaceId, async () => {
          const currentPath = this.getCurrentPath(workspaceId);
          const previousPath = this.getPreviousPath(workspaceId);
          const tempPath = this.getTempPath(workspaceId);

          await this.discardMatchingRecoveryFile(currentPath, recoveryIdSet);
          await this.discardMatchingRecoveryFile(previousPath, recoveryIdSet);
          await this.discardMatchingRecoveryFile(tempPath, recoveryIdSet);
        });
      }

      await this.syncDirectory(this.recoveryDir);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Unable to discard recovery snapshots.',
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
        typeof envelope.snapshotId !== 'string' ||
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
    recordKind: 'current' | 'previous',
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
      recoveryId: envelope.snapshotId,
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
      recordKind,
    };
  }

  private async discardMatchingRecoveryFile(
    filePath: string,
    recoveryIds: Set<string>,
  ) {
    try {
      const recoveryFile = await this.readRecoveryFile(filePath);

      if (recoveryFile?.envelope.snapshotId != null) {
        if (recoveryIds.has(recoveryFile.envelope.snapshotId)) {
          await fs.rm(filePath, { force: true });
        }
      }
    } catch {
      // Leave unreadable files untouched.
    }
  }

  private async cleanupAbandonedTempFile(tempPath: string) {
    try {
      const stats = await fs.stat(tempPath);

      if (Date.now() - stats.mtimeMs < abandonedTempCleanupAgeMs) {
        return;
      }

      await fs.rm(tempPath, { force: true });
    } catch {
      // Best-effort cleanup only.
    }
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

  private async runWorkspaceOperation<T>(
    workspaceId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const previousOperation =
      this.workspaceOperationQueues.get(workspaceId) ?? Promise.resolve();

    let releaseCurrentOperation!: () => void;
    const currentOperation = previousOperation.then(
      () =>
        new Promise<void>((resolve) => {
          releaseCurrentOperation = resolve;
        }),
    );

    this.workspaceOperationQueues.set(workspaceId, currentOperation);

    await previousOperation;

    try {
      return await operation();
    } finally {
      releaseCurrentOperation();

      if (this.workspaceOperationQueues.get(workspaceId) === currentOperation) {
        this.workspaceOperationQueues.delete(workspaceId);
      }
    }
  }
}
