import {
  ExportWorkspaceAsImageReplyArgs,
  FileMenuOpenScoreArgs,
  SaveWorkspaceAsReplyArgs,
  SaveWorkspaceReplyArgs,
  ShowMessageBoxArgs,
  ShowMessageBoxReplyArgs,
} from '@/ipc/ipcChannels';
import { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';
import { getFileNameFromPath } from '@/utils/getFileNameFromPath';
import JSZip from 'jszip';
import { IIpcService } from './IIpcService';

export class BrowserIpcService implements IIpcService {
  public async saveWorkspace(
    workspace: Workspace,
  ): Promise<SaveWorkspaceReplyArgs> {
    // Note: in the browser, this is probably never going
    // to be called
    await this.doSave(workspace);
    return Promise.resolve({ success: true });
  }

  public async saveWorkspaceAs(
    workspace: Workspace,
  ): Promise<SaveWorkspaceAsReplyArgs> {
    const filePath = await this.doSave(workspace);
    return Promise.resolve({
      success: true,
      filePath: filePath,
    });
  }

  public async exportWorkspaceAsPdf(workspace: Workspace) {
    throw 'exportWorkspaceAsPdf is not available in the browser.';
  }

  public async exportWorkspaceAsHtml(workspace: Workspace, data: string) {
    const file = new Blob([data], { type: 'application/json' });

    const downloadFileName =
      workspace.filePath != null
        ? `${getFileNameFromPath(workspace.filePath)}.html`
        : `${workspace.tempFileName}.html`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = downloadFileName;
    a.click();
  }

  public async exportWorkspaceAsImage(
    workspace: Workspace,
    imageFormat: 'png' | 'svg',
  ): Promise<ExportWorkspaceAsImageReplyArgs> {
    throw 'exportWorkspaceAsPdf is not available in the browser.';
  }

  public async exportPageAsImage(
    filePath: string,
    data: string,
  ): Promise<boolean> {
    throw 'exportPageAsImage is not available in the browser.';
  }

  public async printWorkspace(workspace: Workspace): Promise<void> {
    return new Promise((resolve) => {
      window.addEventListener(
        'afterprint',
        () => {
          resolve();
        },
        { once: true },
      );
    });
  }

  public async openWorkspaceFromArgv(): Promise<FileMenuOpenScoreArgs[]> {
    return [];
  }

  public async showMessageBox(
    args: ShowMessageBoxArgs,
  ): Promise<ShowMessageBoxReplyArgs> {
    return Promise.resolve({ response: 0, checkboxChecked: false });
  }

  public async showItemInFolder(): Promise<void> {
    throw 'showItemInFolder is not available in the browser.';
  }

  public isShowMessageBoxSupported(): boolean {
    return false;
  }

  public async getSystemFonts(): Promise<string[]> {
    return Promise.resolve([]);
  }

  public async exitApplication(): Promise<void> {
    return Promise.resolve();
  }

  public async cancelExit(): Promise<void> {
    return Promise.resolve();
  }

  private async doSave(workspace: Workspace) {
    var score = SaveService.SaveScoreToJson(workspace.score);
    const data = JSON.stringify(score, null, 2);
    let file: Blob;

    // In the browser, we cannot know what file extension the user chose,
    // so we always save in .byz, unless the user has already opened
    // .byzx file from the computer.
    if (workspace.filePath == null || workspace.filePath.endsWith('.byz')) {
      var zip = new JSZip();

      const fileName =
        workspace.filePath != null
          ? getFileNameFromPath(workspace.filePath)
          : workspace.tempFileName;

      zip.file(`${fileName}.byzx`, data);
      file = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    } else {
      file = new Blob([data], { type: 'application/json' });
    }

    const downloadFileName =
      workspace.filePath != null
        ? workspace.filePath
        : `${workspace.tempFileName}.byz`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = downloadFileName;
    a.click();

    return downloadFileName;
  }
}
