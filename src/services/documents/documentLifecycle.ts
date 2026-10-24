import type { Workspace } from '@/models/Workspace';

import { snapshotDocument } from './documentPersistence';

export interface CloseDocumentOptions {
  discardUnsavedChanges?: boolean;
  expectedSnapshot?: string;
}

export function assertDocumentCanClose(
  workspace: Workspace,
  options: CloseDocumentOptions,
) {
  // Even explicit discard must not authorize content newer than the caller read.
  if (
    options.expectedSnapshot !== undefined &&
    snapshotDocument(workspace) !== options.expectedSnapshot
  ) {
    throw new Error('REVISION_CONFLICT');
  }
  if (
    (workspace.hasUnsavedChanges || workspace.isRecovered) &&
    !options.discardUnsavedChanges
  ) {
    throw new Error('UNSAVED_CHANGES');
  }
}
