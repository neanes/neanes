import crypto from 'crypto';

import { describe, expect, it } from 'vitest';

import { createRecoveryEnvelope } from './seed-recovery.mjs';

describe('createRecoveryEnvelope', () => {
  it('computes checksum and length from the score string', () => {
    const score = '{"version":"1.1","appVersion":"0.4.31"}';

    const envelope = createRecoveryEnvelope({
      appVersion: '0.5.39',
      filePath: '/tmp/source.byzx',
      hasUnsavedChanges: true,
      score,
      snapshotId: '10000000-0000-4000-8000-000000000001',
      sourceMtimeMs: 1234.5,
      sourceSize: 987,
      tempFileName: 'test.byzx',
      updatedAt: 1700000000000,
      workspaceId: '10000000-0000-4000-8000-000000000002',
    });

    expect(envelope.schemaVersion).toBe(1);
    expect(envelope.contentLength).toBe(Buffer.byteLength(score, 'utf8'));
    expect(envelope.contentSha256).toBe(
      crypto.createHash('sha256').update(score, 'utf8').digest('hex'),
    );
    expect(envelope.createdAt).toBe(1700000000000);
    expect(envelope.updatedAt).toBe(1700000000000);
    expect(envelope.filePath).toBe('/tmp/source.byzx');
    expect(envelope.sourceMtimeMs).toBe(1234.5);
    expect(envelope.sourceSize).toBe(987);
  });
});
