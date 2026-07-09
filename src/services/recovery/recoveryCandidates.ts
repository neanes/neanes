import type { RecoveryCandidateArgs } from '../../ipc/ipcChannels';

export type RecoveryCandidateGroup = {
  groupKey: string;
  candidates: RecoveryCandidateArgs[];
};

export type RecoveryCandidateSourceState =
  'untitled' | 'missing' | 'changed' | 'available';

export function getRecoveryCandidateGroupKey(candidate: RecoveryCandidateArgs) {
  return candidate.isUntitled
    ? candidate.workspaceId
    : (candidate.filePath ?? candidate.workspaceId);
}

export function groupRecoveryCandidates(candidates: RecoveryCandidateArgs[]) {
  const candidateGroups = new Map<string, RecoveryCandidateArgs[]>();
  const orderedGroupKeys: string[] = [];

  for (const candidate of candidates) {
    const groupKey = getRecoveryCandidateGroupKey(candidate);
    const groupCandidates = candidateGroups.get(groupKey);

    if (groupCandidates == null) {
      candidateGroups.set(groupKey, [candidate]);
      orderedGroupKeys.push(groupKey);
    } else {
      groupCandidates.push(candidate);
    }
  }

  return orderedGroupKeys.map((groupKey) => {
    const candidates = (candidateGroups.get(groupKey) ?? []).sort(
      (left, right) => right.updatedAt - left.updatedAt,
    );

    return {
      groupKey,
      candidates,
    } satisfies RecoveryCandidateGroup;
  });
}

export function selectDefaultRecoveryCandidates(
  candidates: RecoveryCandidateArgs[],
) {
  const selectedCandidates = new Map<string, RecoveryCandidateArgs>();

  for (const candidate of candidates) {
    const groupKey = getRecoveryCandidateGroupKey(candidate);
    const existingCandidate = selectedCandidates.get(groupKey);

    if (
      existingCandidate == null ||
      candidate.updatedAt > existingCandidate.updatedAt
    ) {
      selectedCandidates.set(groupKey, candidate);
    }
  }

  return [...selectedCandidates.values()];
}

export function classifyRecoveryCandidates(
  candidates: RecoveryCandidateArgs[],
) {
  const groupedCandidates = groupRecoveryCandidates(candidates);
  const autoRecoveryCandidates: RecoveryCandidateArgs[] = [];
  const pendingRecoveryCandidates: RecoveryCandidateArgs[] = [];

  for (const group of groupedCandidates) {
    const candidate = group.candidates[0];

    if (
      candidate == null ||
      candidate.isUntitled ||
      (group.candidates.length === 1 && candidate.sourceMatches)
    ) {
      if (candidate != null) {
        autoRecoveryCandidates.push(candidate);
      }

      continue;
    }

    pendingRecoveryCandidates.push(...group.candidates);
  }

  return {
    autoRecoveryCandidates,
    pendingRecoveryCandidates,
  };
}

export function getRecoveryCandidateSourceState(
  candidate: RecoveryCandidateArgs,
): RecoveryCandidateSourceState {
  if (candidate.isUntitled) {
    return 'untitled';
  }

  if (!candidate.sourceExists) {
    return 'missing';
  }

  if (!candidate.sourceMatches) {
    return 'changed';
  }

  return 'available';
}
