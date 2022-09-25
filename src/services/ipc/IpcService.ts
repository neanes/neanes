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
  ShowMessageBoxReplyArgs,
} from '@/ipc/ipcChannels';
import { Workspace } from '@/models/Workspace';
import { SaveService } from '../SaveService';
import { IIpcService } from './IIpcService';

export class IpcService implements IIpcService {
  public async saveWorkspace(
    workspace: Workspace,
  ): Promise<SaveWorkspaceReplyArgs> {
    return await window.ipcRenderer.invoke(IpcRendererChannels.SaveWorkspace, {
      filePath: workspace.filePath,
      tempFileName: workspace.tempFileName,
      data: SaveService.SaveScoreToJson(workspace.score),
    } as SaveWorkspaceArgs);
  }

  public async saveWorkspaceAs(
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

  public async exportWorkspaceAsPdf(workspace: Workspace) {
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

  public async printWorkspace(workspace: Workspace) {
    return await window.ipcRenderer.invoke(IpcRendererChannels.PrintWorkspace, {
      landscape: workspace.score.pageSetup.landscape,
      pageSize: workspace.score.pageSetup.pageSize,
    } as PrintWorkspaceArgs);
  }

  public async openWorkspaceFromArgv(): Promise<FileMenuOpenScoreArgs[]> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.OpenWorkspaceFromArgv,
    );
  }

  public async showMessageBox(
    args: ShowMessageBoxArgs,
  ): Promise<ShowMessageBoxReplyArgs> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ShowMessageBox,
      args,
    );
  }

  public isShowMessageBoxSupported(): boolean {
    return true;
  }

  public async getSystemFonts(): Promise<string[]> {
    return await window.ipcRenderer.invoke(IpcRendererChannels.GetSystemFonts);
  }

  public async exitApplication(): Promise<void> {
    return await window.ipcRenderer.invoke(IpcRendererChannels.ExitApplication);
  }
}
