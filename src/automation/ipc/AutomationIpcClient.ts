import { IpcRendererChannels } from '@/ipc/ipcChannels';
import type {
  OpenScoreFileResult,
  PdfExportOptions,
  ReadScoreFileResult,
  WorkspaceFile,
  WriteScoreFileArgs,
} from '@/services/documents/fileTypes';

import { unwrapAutomationOutcome } from '../contracts/errors';

export class AutomationIpcClient {
  requestId = '';
  async authorizeRequest() {
    unwrapAutomationOutcome(
      await window.ipcRenderer.invoke(
        IpcRendererChannels.AutomationAuthorizeRequest,
        this.requestId,
      ),
    );
  }
  public async automationReadScore(
    filePath: string,
    workspaces: WorkspaceFile[],
  ): Promise<OpenScoreFileResult> {
    return unwrapAutomationOutcome(
      await window.ipcRenderer.invoke(
        IpcRendererChannels.AutomationReadScore,
        this.requestId,
        filePath,
        workspaces,
      ),
    );
  }
  public async automationWriteScore(
    args: WriteScoreFileArgs,
  ): Promise<Omit<ReadScoreFileResult, 'data'>> {
    return unwrapAutomationOutcome(
      await window.ipcRenderer.invoke(
        IpcRendererChannels.AutomationWriteScore,
        this.requestId,
        args,
      ),
    );
  }
  public async automationExportPdf(args: PdfExportOptions): Promise<void> {
    unwrapAutomationOutcome(
      await window.ipcRenderer.invoke(
        IpcRendererChannels.AutomationExportPdf,
        this.requestId,
        args,
      ),
    );
  }
}
