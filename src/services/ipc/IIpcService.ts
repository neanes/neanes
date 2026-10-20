import type {
  ClipboardReplyArgs,
  DiscardRecoverySnapshotReplyArgs,
  DiscardRecoverySnapshotsReplyArgs,
  ExportPageAsImageReplyArgs,
  ExportSnapshotAsPngArgs,
  ExportSnapshotAsPngReplyArgs,
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
import type { Workspace } from '@/models/Workspace';
import type { ScoreRenderSnapshot } from '@/services/rendering/scoreRenderSnapshot';

export interface IIpcService {
  saveWorkspace(workspace: Workspace): Promise<SaveWorkspaceReplyArgs>;

  saveWorkspaceAs(workspace: Workspace): Promise<SaveWorkspaceAsReplyArgs>;

  exportWorkspaceAsPdf(
    workspace: Workspace,
    snapshot: ScoreRenderSnapshot,
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

  exportSnapshotAsPng(
    args: ExportSnapshotAsPngArgs,
  ): Promise<ExportSnapshotAsPngReplyArgs>;

  printWorkspace(
    workspace: Workspace,
    snapshot: ScoreRenderSnapshot,
  ): Promise<void>;

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
