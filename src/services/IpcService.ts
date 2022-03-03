import {
  ExportWorkspaceAsPdfArgs,
  FileMenuOpenScoreArgs,
  IpcRendererChannels,
  PrintWorkspaceArgs,
  SaveWorkspaceArgs,
  SaveWorkspaceAsArgs,
  SaveWorkspaceAsReplyArgs,
  SaveWorkspaceReplyArgs,
  ShowMessageBoxArgs,
} from '@/ipc/ipcChannels';
import { Workspace } from '@/models/Workspace';
import { SaveService } from './SaveService';

export class IpcService {
  public static async saveWorkspace(
    workspace: Workspace,
  ): Promise<SaveWorkspaceReplyArgs> {
    return await window.ipcRenderer.invoke(IpcRendererChannels.SaveWorkspace, {
      filePath: workspace.filePath,
      tempFileName: workspace.tempFileName,
      data: SaveService.SaveScoreToJson(workspace.score),
    } as SaveWorkspaceArgs);
  }

  public static async saveWorkspaceAs(
    workspace: Workspace,
  ): Promise<SaveWorkspaceAsReplyArgs> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.SaveWorkspaceAs,
      {
        filePath: workspace.filePath,
        tempFileName: workspace.tempFileName,
        data: SaveService.SaveScoreToJson(workspace.score),
      } as SaveWorkspaceAsArgs,
    );
  }

  public static async exportWorkspaceAsPdf(workspace: Workspace) {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ExportWorkspaceAsPdf,
      {
        filePath: workspace.filePath,
        tempFileName: workspace.tempFileName,
        landscape: workspace.score.pageSetup.landscape,
        pageSize: workspace.score.pageSetup.pageSize,
      } as ExportWorkspaceAsPdfArgs,
    );
  }

  public static async printWorkspace(workspace: Workspace) {
    return await window.ipcRenderer.invoke(IpcRendererChannels.PrintWorkspace, {
      landscape: workspace.score.pageSetup.landscape,
      pageSize: workspace.score.pageSetup.pageSize,
    } as PrintWorkspaceArgs);
  }

  public static async openWorkspaceFromArgv(): Promise<
    FileMenuOpenScoreArgs[]
  > {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.OpenWorkspaceFromArgv,
    );
  }

  public static async showMessageBox(
    args: ShowMessageBoxArgs,
  ): Promise<Electron.MessageBoxReturnValue> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ShowMessageBox,
      args,
    );
  }

  public static async exitApplication() {
    return await window.ipcRenderer.invoke(IpcRendererChannels.ExitApplication);
  }
}
