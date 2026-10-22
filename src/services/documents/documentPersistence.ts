import type { Workspace } from '@/models/Workspace';

// Strict concurrency token, distinct from the saved-content identity used by saves.
export function snapshotDocument(workspace: Workspace) {
  return JSON.stringify({
    revision: workspace.contentRevision,
    filePath: workspace.filePath,
    sourceFormat: workspace.sourceFormat,
  });
}
