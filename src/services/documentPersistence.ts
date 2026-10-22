import { toRaw } from 'vue';

import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';

export interface DocumentSaveResult {
  sourceFormat?: Workspace['sourceFormat'];
  success: boolean;
  filePath?: string;
  sourceMtimeMs?: number | null;
  sourceSize?: number | null;
}

const pendingSaves = new WeakMap<Workspace, Promise<unknown>>();

// Keep writes and their metadata/recovery completion in request order.
export function queueDocumentSave<T>(
  workspace: Workspace,
  save: () => Promise<T>,
): Promise<T> {
  const key = toRaw(workspace);
  const pending = pendingSaves.get(key);
  const result = pending == null ? save() : pending.catch(() => {}).then(save);
  pendingSaves.set(key, result);
  const finished = () => {
    if (pendingSaves.get(key) === result) {
      pendingSaves.delete(key);
    }
  };
  void result.then(finished, finished);
  return result;
}

export interface DocumentSaveState {
  contentRevision: number;
  contentStateId: number;
  sourceFormat: Workspace['sourceFormat'];
  filePath: string | null;
  score: Score;
}

// Capture alongside the serialized payload, before yielding to file I/O.
export function captureDocumentSaveState(
  workspace: Workspace,
): DocumentSaveState {
  return {
    contentRevision: workspace.contentRevision,
    contentStateId: workspace.contentStateId,
    sourceFormat: workspace.sourceFormat,
    filePath: workspace.filePath,
    score: toRaw(workspace.score),
  };
}

export function isDocumentSaveStateCurrent(
  workspace: Workspace,
  state: DocumentSaveState,
) {
  return (
    workspace.contentStateId === state.contentStateId &&
    isDocumentSaveContextCurrent(workspace, state)
  );
}

export function isDocumentSaveContextCurrent(
  workspace: Workspace,
  state: DocumentSaveState,
) {
  return (
    workspace.sourceFormat === state.sourceFormat &&
    workspace.filePath === state.filePath &&
    toRaw(workspace.score) === state.score
  );
}

// File metadata describes the completed write, but newer edits stay unsaved.
export function applyDocumentSave(
  workspace: Workspace,
  result: DocumentSaveResult,
  state: DocumentSaveState,
) {
  if (!result.success) {
    return false;
  }
  const unchanged = isDocumentSaveStateCurrent(workspace, state);
  const sameContext = isDocumentSaveContextCurrent(workspace, state);
  workspace.filePath = result.filePath ?? workspace.filePath;
  workspace.sourceFormat = result.sourceFormat ?? workspace.sourceFormat;
  workspace.sourceMtimeMs = result.sourceMtimeMs ?? null;
  workspace.sourceSize = result.sourceSize ?? null;
  if (sameContext) {
    // Remember what reached disk even when newer edits are present. Undoing
    // those edits later can return to this saved state without another write.
    workspace.markContentSaved(state.contentStateId);
    // The recovered draft reached disk. Newer edits still need recovery, but
    // undoing them must allow normal clean-workspace cleanup and closing.
    workspace.isRecovered = false;
  } else {
    workspace.hasUnsavedChanges = true;
  }
  return unchanged;
}

export function saveDocument<T extends DocumentSaveResult>(
  workspace: Workspace,
  persist: () => Promise<T>,
  hooks: {
    prepare(workspace: Workspace): void;
    saved(workspace: Workspace): Promise<void>;
    recover(workspace: Workspace): Promise<void>;
  },
) {
  return queueDocumentSave(workspace, async () => {
    hooks.prepare(workspace);
    const state = captureDocumentSaveState(workspace);
    const result = await persist();
    let savedContentUnchanged = false;
    if (result.success) {
      hooks.prepare(workspace);
      savedContentUnchanged = applyDocumentSave(workspace, result, state);
      if (savedContentUnchanged) {
        const savedState = captureDocumentSaveState(workspace);
        await hooks.saved(workspace);
        hooks.prepare(workspace);
        savedContentUnchanged = isDocumentSaveStateCurrent(
          workspace,
          savedState,
        );
        if (!isDocumentSaveContextCurrent(workspace, savedState)) {
          workspace.hasUnsavedChanges = true;
        }
      }
      if (!savedContentUnchanged) {
        await hooks.recover(workspace);
      }
    }
    return { ...result, savedContentUnchanged };
  });
}
