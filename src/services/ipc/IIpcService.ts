import type {
  ClipboardReplyArgs,
  DiscardRecoverySnapshotReplyArgs,
  DiscardRecoverySnapshotsReplyArgs,
  ExportPageAsImageReplyArgs,
  ExportWorkspaceAsImageReplyArgs,
  ExportWorkspaceReplyArgs,
  ListRecoveryCandidatesReplyArgs,
  OpenWorkspaceFromArgvArgs,
  RecoverySnapshotArgs,
  SaveRecoverySnapshotReplyArgs,
  SaveWorkspaceAsReplyArgs,
  SaveWorkspaceReplyArgs,
  ShowMessageBoxArgs,
  ShowMessageBoxReplyArgs,
} from '@/ipc/ipcChannels';
import type { Score as SavedScore } from '@/models/save/v1/Score';
import type { Workspace } from '@/models/Workspace';
import type {
  OpenScoreFileResult,
  PdfExportOptions,
  ReadScoreFileResult,
  WorkspaceFile,
  WriteScoreFileArgs,
} from '@/services/documents/fileTypes';
import type { PdfSnapshot } from '@/services/documents/pdfSnapshot';

export interface IIpcService {
  automationReadScore(
    filePath: string,
    workspaces: WorkspaceFile[],
  ): Promise<OpenScoreFileResult>;
  automationWriteScore(
    args: WriteScoreFileArgs,
  ): Promise<Omit<ReadScoreFileResult, 'data'>>;
  automationExportPdf(args: PdfExportOptions): Promise<void>;

  saveWorkspace(
    workspace: Workspace,
    data?: SavedScore,
  ): Promise<SaveWorkspaceReplyArgs>;

  saveWorkspaceAs(
    workspace: Workspace,
    data?: SavedScore,
  ): Promise<SaveWorkspaceAsReplyArgs>;

  exportWorkspaceAsPdf(
    workspace: Workspace,
    snapshot: PdfSnapshot,
  ): Promise<ExportWorkspaceReplyArgs>;

  exportWorkspaceAsHtml(
    workspace: Workspace,
    data: string,
  ): Promise<ExportWorkspaceReplyArgs>;

  exportWorkspaceAsMusicXml(
    workspace: Workspace,
    data: string,
    compressed: boolean,
    openFolder: boolean,
  ): Promise<ExportWorkspaceReplyArgs>;

  exportWorkspaceAsLatex(
    workspace: Workspace,
    data: string,
  ): Promise<ExportWorkspaceReplyArgs>;

  exportWorkspaceAsImage(
    workspace: Workspace,
    imageFormat: 'png' | 'svg',
  ): Promise<ExportWorkspaceAsImageReplyArgs>;

  exportPageAsImage(
    fileName: string,
    data: string,
  ): Promise<ExportPageAsImageReplyArgs>;

  printWorkspace(workspace: Workspace): Promise<void>;

  openWorkspaceFromArgv(): Promise<OpenWorkspaceFromArgvArgs>;

  listRecoveryCandidates(): Promise<ListRecoveryCandidatesReplyArgs>;

  saveRecoverySnapshot(
    snapshot: RecoverySnapshotArgs,
  ): Promise<SaveRecoverySnapshotReplyArgs>;

  discardRecoverySnapshot(
    workspaceId: string,
  ): Promise<DiscardRecoverySnapshotReplyArgs>;

  discardRecoverySnapshots(
    recoveryIds: string[],
  ): Promise<DiscardRecoverySnapshotsReplyArgs>;

  showMessageBox(args: ShowMessageBoxArgs): Promise<ShowMessageBoxReplyArgs>;

  showItemInFolder(path: string): Promise<void>;

  isShowItemInFolderSupported(): boolean;

  isShowMessageBoxSupported(): boolean;

  exitApplication(): Promise<void>;

  cancelExit(): Promise<void>;

  paste(): Promise<ClipboardReplyArgs>;
}
