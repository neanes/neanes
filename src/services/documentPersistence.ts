import type { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';

export interface DocumentSaveResult {
  success: boolean;
  filePath?: string;
  sourceMtimeMs?: number | null;
  sourceSize?: number | null;
}

export function snapshotDocument(workspace: Workspace) {
  return JSON.stringify({
    filePath: workspace.filePath,
    score: SaveService.SaveScoreToJson(workspace.score),
  });
}

// File metadata describes the completed write, but newer edits stay unsaved.
export function applyDocumentSave(
  workspace: Workspace,
  result: DocumentSaveResult,
  snapshot: string,
) {
  if (!result.success) {
    return false;
  }
  const unchanged = snapshotDocument(workspace) === snapshot;
  workspace.filePath = result.filePath ?? workspace.filePath;
  workspace.sourceMtimeMs = result.sourceMtimeMs ?? null;
  workspace.sourceSize = result.sourceSize ?? null;
  workspace.hasUnsavedChanges = !unchanged;
  if (unchanged) {
    workspace.isRecovered = false;
  }
  return unchanged;
}
