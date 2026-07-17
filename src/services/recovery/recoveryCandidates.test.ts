import { describe, expect, it } from 'vitest';

import type { RecoveryCandidateArgs } from '@/ipc/ipcChannels';

import {
  classifyRecoveryCandidates,
  getRecoveryCandidateGroupRecoveryIds,
  getRecoveryCandidateSiblingRecoveryIds,
  getRecoveryCandidateSourceState,
  groupRecoveryCandidates,
  selectDefaultRecoveryCandidates,
} from './recoveryCandidates';

function candidate(
  overrides: Partial<RecoveryCandidateArgs> &
    Pick<RecoveryCandidateArgs, 'recoveryId' | 'workspaceId' | 'updatedAt'>,
) {
  return {
    filePath: null,
    tempFileName: 'temp.byzx',
    hasUnsavedChanges: false,
    score: '{"version":1}',
    sourceMtimeMs: null,
    sourceSize: null,
    sourceExists: false,
    sourceMatches: false,
    isUntitled: true,
    recordKind: 'current' as const,
    ...overrides,
  } satisfies RecoveryCandidateArgs;
}

describe('recovery candidate helpers', () => {
  it('groups duplicate saved-file candidates and keeps the newest one first', () => {
    const savedPath = '/tmp/score.byzx';
    const grouped = groupRecoveryCandidates([
      candidate({
        recoveryId: 'old',
        workspaceId: 'workspace-a',
        filePath: savedPath,
        isUntitled: false,
        sourceExists: true,
        sourceMatches: false,
        updatedAt: 10,
      }),
      candidate({
        recoveryId: 'new',
        workspaceId: 'workspace-a',
        filePath: savedPath,
        isUntitled: false,
        sourceExists: true,
        sourceMatches: false,
        updatedAt: 20,
      }),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.groupKey).toBe(savedPath);
    expect(grouped[0]?.candidates.map((item) => item.recoveryId)).toEqual([
      'new',
      'old',
    ]);
  });

  it('chooses the newest candidate in each group by default', () => {
    const selected = selectDefaultRecoveryCandidates([
      candidate({
        recoveryId: 'group-a-old',
        workspaceId: 'workspace-a',
        filePath: '/tmp/score-a.byzx',
        isUntitled: false,
        sourceExists: true,
        sourceMatches: true,
        updatedAt: 10,
      }),
      candidate({
        recoveryId: 'group-b-new',
        workspaceId: 'workspace-b',
        filePath: '/tmp/score-b.byzx',
        isUntitled: false,
        sourceExists: true,
        sourceMatches: true,
        updatedAt: 30,
      }),
      candidate({
        recoveryId: 'group-a-new',
        workspaceId: 'workspace-a',
        filePath: '/tmp/score-a.byzx',
        isUntitled: false,
        sourceExists: true,
        sourceMatches: true,
        updatedAt: 20,
      }),
    ]);

    expect(selected.map((item) => item.recoveryId)).toEqual([
      'group-a-new',
      'group-b-new',
    ]);
  });

  it('splits auto-recovery candidates from dialog candidates', () => {
    const savedPath = '/tmp/score.byzx';
    const untitled = candidate({
      recoveryId: 'untitled',
      workspaceId: 'workspace-untitled',
      filePath: null,
      tempFileName: 'untitled.byzx',
      isUntitled: true,
      updatedAt: 30,
    });
    const syncedSaved = candidate({
      recoveryId: 'synced',
      workspaceId: 'workspace-synced',
      filePath: savedPath,
      isUntitled: false,
      sourceExists: true,
      sourceMatches: true,
      updatedAt: 20,
    });
    const duplicateSavedOlder = candidate({
      recoveryId: 'duplicate-old',
      workspaceId: 'workspace-duplicate',
      filePath: '/tmp/duplicate.byzx',
      isUntitled: false,
      sourceExists: true,
      sourceMatches: false,
      updatedAt: 10,
    });
    const duplicateSavedNewer = candidate({
      recoveryId: 'duplicate-new',
      workspaceId: 'workspace-duplicate',
      filePath: '/tmp/duplicate.byzx',
      isUntitled: false,
      sourceExists: true,
      sourceMatches: false,
      updatedAt: 40,
    });

    const result = classifyRecoveryCandidates([
      duplicateSavedOlder,
      untitled,
      syncedSaved,
      duplicateSavedNewer,
    ]);

    expect(
      result.autoRecoveryCandidates.map((item) => item.recoveryId),
    ).toEqual(['untitled', 'synced']);
    expect(
      result.pendingRecoveryCandidates.map((item) => item.recoveryId),
    ).toEqual(['duplicate-new', 'duplicate-old']);
  });

  it('classifies missing and changed sources distinctly', () => {
    expect(
      getRecoveryCandidateSourceState(
        candidate({
          recoveryId: 'missing',
          workspaceId: 'workspace-missing',
          filePath: '/tmp/missing.byzx',
          isUntitled: false,
          sourceExists: false,
          sourceMatches: false,
          updatedAt: 1,
        }),
      ),
    ).toBe('missing');

    expect(
      getRecoveryCandidateSourceState(
        candidate({
          recoveryId: 'changed',
          workspaceId: 'workspace-changed',
          filePath: '/tmp/changed.byzx',
          isUntitled: false,
          sourceExists: true,
          sourceMatches: false,
          updatedAt: 1,
        }),
      ),
    ).toBe('changed');

    expect(
      getRecoveryCandidateSourceState(
        candidate({
          recoveryId: 'available',
          workspaceId: 'workspace-available',
          filePath: '/tmp/available.byzx',
          isUntitled: false,
          sourceExists: true,
          sourceMatches: true,
          updatedAt: 1,
        }),
      ),
    ).toBe('available');
  });

  it('returns sibling recovery ids for the selected recovery group(s)', () => {
    const sharedPath = '/tmp/shared.byzx';

    const siblingIds = getRecoveryCandidateSiblingRecoveryIds(
      [
        candidate({
          recoveryId: 'current',
          workspaceId: 'workspace-shared',
          filePath: sharedPath,
          isUntitled: false,
          updatedAt: 20,
        }),
        candidate({
          recoveryId: 'previous',
          workspaceId: 'workspace-shared',
          filePath: sharedPath,
          isUntitled: false,
          updatedAt: 10,
        }),
        candidate({
          recoveryId: 'other',
          workspaceId: 'workspace-other',
          filePath: '/tmp/other.byzx',
          isUntitled: false,
          updatedAt: 30,
        }),
      ],
      ['current'],
    );

    expect(siblingIds).toEqual(['previous']);
  });

  it('returns every recovery id in the selected group(s)', () => {
    const sharedPath = '/tmp/shared.byzx';

    const groupedIds = getRecoveryCandidateGroupRecoveryIds(
      [
        candidate({
          recoveryId: 'current',
          workspaceId: 'workspace-shared',
          filePath: sharedPath,
          isUntitled: false,
          updatedAt: 20,
        }),
        candidate({
          recoveryId: 'previous',
          workspaceId: 'workspace-shared',
          filePath: sharedPath,
          isUntitled: false,
          updatedAt: 10,
        }),
        candidate({
          recoveryId: 'other',
          workspaceId: 'workspace-other',
          filePath: '/tmp/other.byzx',
          isUntitled: false,
          updatedAt: 30,
        }),
      ],
      ['current'],
    );

    expect(groupedIds).toEqual(['current', 'previous']);
  });
});
