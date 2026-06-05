import JSZip from 'jszip';

import type {
  ExportWorkspaceAsImageReplyArgs,
  OpenWorkspaceFromArgvArgs,
  SaveWorkspaceAsReplyArgs,
  SaveWorkspaceReplyArgs,
  ShowMessageBoxReplyArgs,
} from '@/ipc/ipcChannels';
import type { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';
import { getFileNameFromPath } from '@/utils/getFileNameFromPath';

import type { IIpcService } from './IIpcService';

function getExportDownloadFileName(
  sourceFilePath: string | null,
  tempFileName: string,
  extension: string,
) {
  const baseName =
    sourceFilePath != null ? getFileNameFromPath(sourceFilePath) : tempFileName;

  return `${baseName}.${extension}`;
}

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

  public async exportWorkspaceAsPdf() {
    throw 'exportWorkspaceAsPdf is not available in the browser.';
  }

  public async exportWorkspaceAsHtml(workspace: Workspace, data: string) {
    const file = new Blob([data], { type: 'application/json' });

    const downloadFileName = getExportDownloadFileName(
      workspace.filePath,
      workspace.tempFileName,
      'html',
    );

    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = downloadFileName;
    a.click();
  }

  public async exportWorkspaceAsMusicXml(
    workspace: Workspace,
    data: string,
    compressed: boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    openFolder: boolean,
  ) {
    const type = compressed
      ? 'application/vnd.recordare.musicxml'
      : 'application/vnd.recordare.musicxml+xml';

    const extension = compressed ? 'mxl' : 'musicxml';

    const file = new Blob([data], { type });

    const downloadFileName = getExportDownloadFileName(
      workspace.filePath,
      workspace.tempFileName,
      extension,
    );

    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = downloadFileName;
    a.click();
  }

  public async exportWorkspaceAsLatex(workspace: Workspace, data: string) {
    const file = new Blob([data], { type: 'application/json' });

    const downloadFileName = getExportDownloadFileName(
      workspace.filePath,
      workspace.tempFileName,
      'byztex',
    );

    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = downloadFileName;
    a.click();
  }

  public async exportWorkspaceAsImage(
    workspace: Workspace,
    imageFormat: 'png' | 'svg',
  ): Promise<ExportWorkspaceAsImageReplyArgs> {
    const fileName =
      workspace.filePath != null
        ? getFileNameFromPath(workspace.filePath)
        : workspace.tempFileName;

    return Promise.resolve({
      success: true,
      filePath: `${fileName}.${imageFormat}`,
    });
  }

  public async exportPageAsImage(
    fileName: string,
    data: string,
  ): Promise<boolean> {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const type = extension === 'svg' ? 'image/svg+xml' : 'image/png';
    const file =
      extension === 'svg'
        ? new Blob([data], { type })
        : await fetch(`data:${type};base64,${data}`).then((x) => x.blob());

    this.downloadFile(fileName, file);

    return Promise.resolve(true);
  }

  public async printWorkspace(): Promise<void> {
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

  public async openWorkspaceFromArgv(): Promise<OpenWorkspaceFromArgvArgs> {
    return { files: [] };
  }

  public async showMessageBox(): Promise<ShowMessageBoxReplyArgs> {
    return Promise.resolve({ response: 0, checkboxChecked: false });
  }

  public async showItemInFolder(): Promise<void> {
    return Promise.resolve();
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
    const score = SaveService.SaveScoreToJson(workspace.score);
    const data = JSON.stringify(score, null, 2);
    let file: Blob;

    // In the browser, we cannot know what file extension the user chose,
    // so we always save in .byz, unless the user has already opened
    // .byzx file from the computer.
    if (workspace.filePath == null || workspace.filePath.endsWith('.byz')) {
      const zip = new JSZip();

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

  private downloadFile(downloadFileName: string, file: Blob) {
    const a = document.createElement('a');
    const url = URL.createObjectURL(file);

    a.href = url;
    a.download = downloadFileName;
    a.click();

    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  public async paste(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();

      const selection = window.getSelection();

      if (!selection?.rangeCount) {
        return;
      }

      const range = selection.getRangeAt(0);
      range.deleteContents(); // remove any selected text
      range.insertNode(document.createTextNode(text));

      // Move the caret to the end of the inserted text
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (error) {
      console.error('Failed to paste text from clipboard:', error);
    }
  }
}
