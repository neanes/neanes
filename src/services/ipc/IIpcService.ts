import {
  FileMenuOpenScoreArgs,
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

  printWorkspace(workspace: Workspace): Promise<void>;

  openWorkspaceFromArgv(): Promise<FileMenuOpenScoreArgs[]>;

  showMessageBox(args: ShowMessageBoxArgs): Promise<ShowMessageBoxReplyArgs>;

  isShowMessageBoxSupported(): boolean;

  getSystemFonts(): Promise<string[]>;

  exitApplication(): Promise<void>;

  cancelExit(): Promise<void>;
}
