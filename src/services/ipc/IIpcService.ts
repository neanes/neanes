import type {
  ClipboardReplyArgs,
  ExportPageAsImageReplyArgs,
  ExportWorkspaceAsImageReplyArgs,
  ExportWorkspaceReplyArgs,
  OpenWorkspaceFromArgvArgs,
  SaveWorkspaceAsReplyArgs,
  SaveWorkspaceReplyArgs,
  ShowMessageBoxArgs,
  ShowMessageBoxReplyArgs,
} from '@/ipc/ipcChannels';
import type { Workspace } from '@/models/Workspace';

export interface IIpcService {
  saveWorkspace(workspace: Workspace): Promise<SaveWorkspaceReplyArgs>;

  saveWorkspaceAs(workspace: Workspace): Promise<SaveWorkspaceAsReplyArgs>;

  exportWorkspaceAsPdf(workspace: Workspace): Promise<ExportWorkspaceReplyArgs>;

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

  showMessageBox(args: ShowMessageBoxArgs): Promise<ShowMessageBoxReplyArgs>;

  showItemInFolder(path: string): Promise<void>;

  isShowItemInFolderSupported(): boolean;

  isShowMessageBoxSupported(): boolean;

  exitApplication(): Promise<void>;

  cancelExit(): Promise<void>;

  paste(): Promise<ClipboardReplyArgs>;
}
