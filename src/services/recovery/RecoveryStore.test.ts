import crypto from 'crypto';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { RecoveryStore } from './RecoveryStore';

function createEnvelope({
  appVersion,
  filePath = null,
  hasUnsavedChanges = false,
  score,
  snapshotId,
  tempFileName = 'temp.byzx',
  updatedAt = 1,
  workspaceId,
}: {
  appVersion: string;
  filePath?: string | null;
  hasUnsavedChanges?: boolean;
  score: string;
  snapshotId: string;
  tempFileName?: string;
  updatedAt?: number;
  workspaceId: string;
}) {
  return {
    schemaVersion: 1,
    snapshotId,
    workspaceId,
    createdAt: updatedAt,
    updatedAt,
    filePath,
    tempFileName,
    hasUnsavedChanges,
    score,
    sourceMtimeMs: null,
    sourceSize: null,
    appVersion,
    contentLength: Buffer.byteLength(score, 'utf8'),
    contentSha256: crypto
      .createHash('sha256')
      .update(score, 'utf8')
      .digest('hex'),
  };
}

async function createTempStore() {
  const recoveryDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'neanes-recovery-'),
  );
  const store = new RecoveryStore(recoveryDir, () => 'test-app');

  return { recoveryDir, store };
}

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readEnvelope(filePath: string) {
  return JSON.parse(await fs.readFile(filePath, 'utf8')).envelope as {
    createdAt: number;
    updatedAt: number;
    score: string;
    appVersion: string;
    snapshotId: string;
    workspaceId: string;
  };
}

describe('RecoveryStore', () => {
  it('writes current snapshots atomically and rolls the old snapshot into .prev', async () => {
    const { recoveryDir, store } = await createTempStore();
    const workspaceId = '11111111-1111-4111-8111-111111111111';
    const currentPath = path.join(recoveryDir, `${workspaceId}.json`);
    const prevPath = path.join(recoveryDir, `${workspaceId}.prev.json`);
    const tempPath = path.join(recoveryDir, `${workspaceId}.tmp.json`);

    const firstResult = await store.saveRecoverySnapshot({
      workspaceId,
      filePath: null,
      tempFileName: 'first.byzx',
      hasUnsavedChanges: false,
      score: '{"version":1}',
      sourceMtimeMs: null,
      sourceSize: null,
    });

    expect(firstResult).toEqual({ success: true });
    expect(await exists(currentPath)).toBe(true);
    expect(await exists(prevPath)).toBe(false);
    expect(await exists(tempPath)).toBe(false);

    const firstCurrent = await readEnvelope(currentPath);

    const secondResult = await store.saveRecoverySnapshot({
      workspaceId,
      filePath: null,
      tempFileName: 'second.byzx',
      hasUnsavedChanges: true,
      score: '{"version":2}',
      sourceMtimeMs: null,
      sourceSize: null,
    });

    expect(secondResult).toEqual({ success: true });
    expect(await exists(currentPath)).toBe(true);
    expect(await exists(prevPath)).toBe(true);
    expect(await exists(tempPath)).toBe(false);

    const current = await readEnvelope(currentPath);
    const previous = await readEnvelope(prevPath);

    expect(current.score).toBe('{"version":2}');
    expect(previous.score).toBe('{"version":1}');
    expect(current.appVersion).toBe('test-app');
    expect(previous.appVersion).toBe('test-app');
    expect(current.createdAt).toBe(firstCurrent.createdAt);
    expect(previous.createdAt).toBe(firstCurrent.createdAt);

    await fs.rm(recoveryDir, { recursive: true, force: true });
  });

  it('falls back to .prev snapshots when the current file is corrupt', async () => {
    const { recoveryDir, store } = await createTempStore();
    const workspaceId = '22222222-2222-4222-8222-222222222222';
    const currentPath = path.join(recoveryDir, `${workspaceId}.json`);
    const prevPath = path.join(recoveryDir, `${workspaceId}.prev.json`);

    await fs.writeFile(currentPath, '{not-json', 'utf8');
    await fs.writeFile(
      prevPath,
      JSON.stringify({
        envelope: createEnvelope({
          appVersion: 'test-app',
          score: '{"version":1}',
          snapshotId: '33333333-3333-3333-3333-333333333333',
          workspaceId,
        }),
      }),
      'utf8',
    );

    const result = await store.listRecoveryCandidates();

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.recordKind).toBe('previous');
    expect(result.candidates[0]?.score).toBe('{"version":1}');

    await fs.rm(recoveryDir, { recursive: true, force: true });
  });

  it('removes stale abandoned temp files and leaves recent ones alone', async () => {
    const { recoveryDir, store } = await createTempStore();
    const staleWorkspaceId = '33333333-3333-4333-8333-333333333333';
    const recentWorkspaceId = '44444444-4444-4444-8444-444444444444';
    const staleTempPath = path.join(
      recoveryDir,
      `${staleWorkspaceId}.tmp.json`,
    );
    const recentTempPath = path.join(
      recoveryDir,
      `${recentWorkspaceId}.tmp.json`,
    );
    const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000);

    await fs.writeFile(staleTempPath, 'stale', 'utf8');
    await fs.writeFile(recentTempPath, 'recent', 'utf8');
    await fs.utimes(staleTempPath, oldTime, oldTime);

    const result = await store.listRecoveryCandidates();

    expect(result.candidates).toEqual([]);
    expect(await exists(staleTempPath)).toBe(false);
    expect(await exists(recentTempPath)).toBe(true);

    await fs.rm(recoveryDir, { recursive: true, force: true });
  });

  it('rejects invalid workspace ids without leaving files behind', async () => {
    const { recoveryDir, store } = await createTempStore();

    const saveResult = await store.saveRecoverySnapshot({
      workspaceId: 'not-a-uuid',
      filePath: null,
      tempFileName: 'invalid.byzx',
      hasUnsavedChanges: false,
      score: '{"version":1}',
      sourceMtimeMs: null,
      sourceSize: null,
    });

    const discardResult = await store.discardRecoverySnapshot('not-a-uuid');

    expect(saveResult.success).toBe(false);
    expect(saveResult.errorMessage).toContain('Invalid recovery workspace id');
    expect(discardResult.success).toBe(false);
    expect(discardResult.errorMessage).toContain(
      'Invalid recovery workspace id',
    );
    expect(await fs.readdir(recoveryDir)).toEqual([]);

    await fs.rm(recoveryDir, { recursive: true, force: true });
  });

  it('discards matching current, previous, and temp snapshots by recovery id', async () => {
    const { recoveryDir, store } = await createTempStore();
    const targetRecoveryId = '55555555-5555-4555-8555-555555555555';
    const otherRecoveryId = '66666666-6666-4666-8666-666666666666';
    const workspaceId = '77777777-7777-4777-8777-777777777777';
    const currentPath = path.join(recoveryDir, `${workspaceId}.json`);
    const prevPath = path.join(recoveryDir, `${workspaceId}.prev.json`);
    const tempPath = path.join(recoveryDir, `${workspaceId}.tmp.json`);
    const otherPath = path.join(recoveryDir, `${otherRecoveryId}.json`);

    const sharedEnvelope = createEnvelope({
      appVersion: 'test-app',
      score: '{"version":1}',
      snapshotId: targetRecoveryId,
      workspaceId,
    });

    await fs.writeFile(
      currentPath,
      JSON.stringify({ envelope: sharedEnvelope }),
      'utf8',
    );
    await fs.writeFile(
      prevPath,
      JSON.stringify({ envelope: sharedEnvelope }),
      'utf8',
    );
    await fs.writeFile(
      tempPath,
      JSON.stringify({ envelope: sharedEnvelope }),
      'utf8',
    );
    await fs.writeFile(
      otherPath,
      JSON.stringify({
        envelope: createEnvelope({
          appVersion: 'test-app',
          score: '{"version":2}',
          snapshotId: otherRecoveryId,
          workspaceId: otherRecoveryId,
        }),
      }),
      'utf8',
    );

    const result = await store.discardRecoverySnapshots([targetRecoveryId]);

    expect(result).toEqual({ success: true });
    expect(await exists(currentPath)).toBe(false);
    expect(await exists(prevPath)).toBe(false);
    expect(await exists(tempPath)).toBe(false);
    expect(await exists(otherPath)).toBe(true);

    await fs.rm(recoveryDir, { recursive: true, force: true });
  });
});
