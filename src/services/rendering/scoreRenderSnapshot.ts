import type { ScoreOverlaySettings } from '@/models/EditorPreferences';
import type { Score } from '@/models/save/v1/Score';
import type { SystemFontMetadata } from '@/services/FontCatalog';

// A detached save-format snapshot, never a live interactive workspace.
export interface ScoreRenderSnapshot {
  score: Score;
  filePath: string | null;
  fileName: string;
  title: string;
  editorLanguage: string;
  systemFonts: SystemFontMetadata[];
  overlays: ScoreOverlaySettings;
}

export interface PngRenderOptions {
  dpi: number;
  pageNumbers: number[] | null;
  transparentBackground: boolean;
}

export interface SnapshotRenderRequest {
  snapshot: ScoreRenderSnapshot;
  png?: PngRenderOptions;
}
