import {
  ExportWorkspaceAsImageReplyArgs,
  OpenContextMenuForTabArgs,
  OpenWorkspaceFromArgvArgs,
  SaveWorkspaceAsReplyArgs,
  SaveWorkspaceReplyArgs,
  ShowMessageBoxArgs,
  ShowMessageBoxReplyArgs,
} from '@/ipc/ipcChannels';
import { Workspace } from '@/models/Workspace';

export interface IIpcService {
  saveWorkspace(workspace: Workspace): Promise<SaveWorkspaceReplyArgs>;

  saveWorkspaceAs(workspace: Workspace): Promise<SaveWorkspaceAsReplyArgs>;

  exportWorkspaceAsPdf(workspace: Workspace): Promise<void>;

  exportWorkspaceAsHtml(workspace: Workspace, data: string): Promise<void>;

  exportWorkspaceAsMusicXml(
    workspace: Workspace,
    data: string,
    compressed: boolean,
    openFolder: boolean,
  ): Promise<void>;

  exportWorkspaceAsLatex(workspace: Workspace, data: string): Promise<void>;

  exportWorkspaceAsImage(
    workspace: Workspace,
    imageFormat: 'png' | 'svg',
  ): Promise<ExportWorkspaceAsImageReplyArgs>;

  exportPageAsImage(fileName: string, data: string): Promise<boolean>;

  printWorkspace(workspace: Workspace): Promise<void>;

  openWorkspaceFromArgv(): Promise<OpenWorkspaceFromArgvArgs>;

  showMessageBox(args: ShowMessageBoxArgs): Promise<ShowMessageBoxReplyArgs>;

  openContextMenuForTab(args: OpenContextMenuForTabArgs): void;

  showItemInFolder(path: string): Promise<void>;

  isShowMessageBoxSupported(): boolean;

  exitApplication(): Promise<void>;

  cancelExit(): Promise<void>;

  paste(): Promise<void>;
}
