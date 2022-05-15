import {
  FileMenuOpenScoreArgs,
  SaveWorkspaceAsReplyArgs,
  SaveWorkspaceReplyArgs,
  ShowMessageBoxArgs,
  ShowMessageBoxReplyArgs,
} from '@/ipc/ipcChannels';
import { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';
import { IIpcService } from './IIpcService';

export class BrowserIpcService implements IIpcService {
  public async saveWorkspace(
    workspace: Workspace,
  ): Promise<SaveWorkspaceReplyArgs> {
    this.doSave(workspace);
    return Promise.resolve({ success: true });
  }

  public async saveWorkspaceAs(
    workspace: Workspace,
  ): Promise<SaveWorkspaceAsReplyArgs> {
    this.doSave(workspace);
    return Promise.resolve({
      success: true,
      filePath:
        workspace.filePath != null
          ? workspace.filePath
          : `${workspace.tempFileName}.byzx`,
    });
  }

  public async exportWorkspaceAsPdf(workspace: Workspace) {
    throw 'exportWorkspaceAsPdf is not available in the browser.';
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
    // TODO read from indexedDB
    return [];
  }

  public async showMessageBox(
    args: ShowMessageBoxArgs,
  ): Promise<ShowMessageBoxReplyArgs> {
    return Promise.resolve({ response: 0, checkboxChecked: false });
  }

  public isShowMessageBoxSupported() {
    return false;
  }

  public async exitApplication(): Promise<void> {
    return Promise.resolve();
  }

  private doSave(workspace: Workspace) {
    const contentType = 'application/json';

    var score = SaveService.SaveScoreToJson(workspace.score);
    const data = JSON.stringify(score, null, 2);

    var a = document.createElement('a');
    var file = new Blob([data], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download =
      workspace.filePath != null
        ? workspace.filePath
        : `${workspace.tempFileName}.byzx`;
    a.click();
  }
}
