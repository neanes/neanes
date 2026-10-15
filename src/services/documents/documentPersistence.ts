import type { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';

import type { ScoreFileFormat } from './fileTypes';

export interface DocumentSaveResult {
  sourceFormat?: ScoreFileFormat | null;
  success: boolean;
  filePath?: string;
  sourceMtimeMs?: number | null;
  sourceSize?: number | null;
}

export function snapshotDocument(workspace: Workspace) {
  return JSON.stringify({
    filePath: workspace.filePath,
    sourceFormat: workspace.sourceFormat,
    score: SaveService.SaveScoreToJson(workspace.score),
  });
}

// Save metadata applies to the written file. Only the exact saved content is clean.
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
  workspace.sourceFormat = result.sourceFormat ?? workspace.sourceFormat;
  workspace.sourceMtimeMs = result.sourceMtimeMs ?? null;
  workspace.sourceSize = result.sourceSize ?? null;
  if (unchanged) {
    workspace.hasUnsavedChanges = false;
    workspace.isRecovered = false;
  }
  return unchanged;
}
