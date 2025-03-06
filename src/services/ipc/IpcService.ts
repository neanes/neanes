import {
  ExportPageAsImageArgs,
  ExportWorkspaceAsHtmlArgs,
  ExportWorkspaceAsImageArgs,
  ExportWorkspaceAsLatexArgs,
  ExportWorkspaceAsMusicXmlArgs,
  ExportWorkspaceAsPdfArgs,
  IpcRendererChannels,
  OpenContextMenuForTabArgs,
  OpenWorkspaceFromArgvArgs,
  PrintWorkspaceArgs,
  SaveWorkspaceArgs,
  SaveWorkspaceAsArgs,
  SaveWorkspaceAsReplyArgs,
  SaveWorkspaceReplyArgs,
  ShowMessageBoxArgs,
  ShowMessageBoxReplyArgs,
} from '@/ipc/ipcChannels';
import { Workspace } from '@/models/Workspace';
import { getFileNameFromPath } from '@/utils/getFileNameFromPath';
import { Unit } from '@/utils/Unit';

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
        pageWidthInches: Unit.toInch(workspace.score.pageSetup.pageWidthCustom),
        pageHeightInches: Unit.toInch(
          workspace.score.pageSetup.pageHeightCustom,
        ),
      } as ExportWorkspaceAsPdfArgs,
    );
  }

  public async exportWorkspaceAsImage(
    workspace: Workspace,
    imageFormat: 'png' | 'svg',
  ) {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ExportWorkspaceAsImage,
      {
        filePath: workspace.filePath,
        tempFileName: workspace.tempFileName,
        imageFormat,
      } as ExportWorkspaceAsImageArgs,
    );
  }

  public async exportPageAsImage(
    filePath: string,
    data: string,
  ): Promise<boolean> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ExportPageAsImage,
      {
        filePath,
        data,
      } as ExportPageAsImageArgs,
    );
  }

  public async exportWorkspaceAsHtml(workspace: Workspace, data: string) {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ExportWorkspaceAsHtml,
      {
        filePathFull: workspace.filePath,
        filePath:
          workspace.filePath != null
            ? `${getFileNameFromPath(workspace.filePath)}.html`
            : null,
        tempFileName: `${workspace.tempFileName}.html`,
        data,
      } as ExportWorkspaceAsHtmlArgs,
    );
  }

  public async exportWorkspaceAsMusicXml(
    workspace: Workspace,
    data: string,
    compressed: boolean,
    openFolder: boolean,
  ) {
    const extension = compressed ? 'mxl' : 'musicxml';

    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ExportWorkspaceAsMusicXml,
      {
        filePath:
          workspace.filePath != null
            ? `${getFileNameFromPath(workspace.filePath)}.${extension}`
            : null,
        tempFileName: `${workspace.tempFileName}.${extension}`,
        data,
        compressed,
        openFolder,
      } as ExportWorkspaceAsMusicXmlArgs,
    );
  }

  public async exportWorkspaceAsLatex(workspace: Workspace, data: string) {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ExportWorkspaceAsLatex,
      {
        filePathFull: workspace.filePath,
        filePath:
          workspace.filePath != null
            ? `${getFileNameFromPath(workspace.filePath)}.byztex`
            : null,
        tempFileName: `${workspace.tempFileName}.byztex`,
        data,
      } as ExportWorkspaceAsLatexArgs,
    );
  }

  public async printWorkspace(workspace: Workspace) {
    return await window.ipcRenderer.invoke(IpcRendererChannels.PrintWorkspace, {
      landscape: workspace.score.pageSetup.landscape,
      pageSize: workspace.score.pageSetup.pageSize,
      pageWidthInches: Unit.toInch(workspace.score.pageSetup.pageWidthCustom),
      pageHeightInches: Unit.toInch(workspace.score.pageSetup.pageHeightCustom),
    } as PrintWorkspaceArgs);
  }

  public async openWorkspaceFromArgv(): Promise<OpenWorkspaceFromArgvArgs> {
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

  public openContextMenuForTab(args: OpenContextMenuForTabArgs): void {
    window.ipcRenderer.send(IpcRendererChannels.OpenContextMenuForTab, args);
  }

  public async showItemInFolder(path: string) {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ShowItemInFolder,
      path,
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

  public async cancelExit(): Promise<void> {
    return await window.ipcRenderer.invoke(IpcRendererChannels.CancelExit);
  }
}
