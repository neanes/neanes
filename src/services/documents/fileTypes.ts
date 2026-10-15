import type { PageSize } from '@/models/PageSetup';
import type { Score } from '@/models/save/v1/Score';

export type ScoreFileFormat = 'byz' | 'byzx';

export interface ReadScoreFileResult {
  sourceFormat: ScoreFileFormat;
  data: string;
  filePath: string;
  sourceMtimeMs: number;
  sourceSize: number;
}

export interface WorkspaceFile {
  documentId: string;
  filePath: string;
}

export type OpenScoreFileResult = ReadScoreFileResult | { documentId: string };

export interface WriteScoreFileArgs {
  filePath: string;
  data: Score;
  overwrite: boolean;
  // Main compares the source and destination identities before applying these checks.
  expectedSource: {
    filePath: string;
    mtimeMs: number;
    size: number;
    format?: ScoreFileFormat;
  } | null;
}

export interface PdfExportOptions {
  filePath: string;
  overwrite: boolean;
  pageSize: PageSize;
  pageWidthInches: number;
  pageHeightInches: number;
  landscape: boolean;
}
