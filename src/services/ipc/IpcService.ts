import type {
  ClipboardReplyArgs,
  DiscardRecoverySnapshotReplyArgs,
  DiscardRecoverySnapshotsReplyArgs,
  ExportPageAsImageArgs,
  ExportPageAsImageReplyArgs,
  ExportWorkspaceAsHtmlArgs,
  ExportWorkspaceAsImageArgs,
  ExportWorkspaceAsLatexArgs,
  ExportWorkspaceAsMusicXmlArgs,
  ExportWorkspaceAsPdfArgs,
  ExportWorkspaceReplyArgs,
  ListRecoveryCandidatesReplyArgs,
  OpenWorkspaceFromArgvArgs,
  PrintWorkspaceArgs,
  RecoverySnapshotArgs,
  SaveRecoverySnapshotReplyArgs,
  SaveWorkspaceArgs,
  SaveWorkspaceAsArgs,
  SaveWorkspaceAsReplyArgs,
  SaveWorkspaceReplyArgs,
  ShowMessageBoxArgs,
  ShowMessageBoxReplyArgs,
} from '@/ipc/ipcChannels';
import { IpcRendererChannels } from '@/ipc/ipcChannels';
import type { Score as SavedScore } from '@/models/save/v1/Score';
import type { Workspace } from '@/models/Workspace';
import { unwrapAutomationOutcome } from '@/services/automation/errors';
import type {
  OpenScoreFileResult,
  PdfExportOptions,
  ReadScoreFileResult,
  WorkspaceFile,
  WriteScoreFileArgs,
} from '@/services/documents/fileTypes';
import type { PdfSnapshot } from '@/services/documents/pdfSnapshot';
import { Unit } from '@/utils/Unit';

import { SaveService } from '../SaveService';
import type { IIpcService } from './IIpcService';

export class IpcService implements IIpcService {
  public async automationReadScore(
    filePath: string,
    workspaces: WorkspaceFile[],
  ): Promise<OpenScoreFileResult> {
    return unwrapAutomationOutcome(
      await window.ipcRenderer.invoke(
        IpcRendererChannels.AutomationReadScore,
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
        args,
      ),
    );
  }
  public async automationExportPdf(args: PdfExportOptions): Promise<void> {
    unwrapAutomationOutcome(
      await window.ipcRenderer.invoke(
        IpcRendererChannels.AutomationExportPdf,
        args,
      ),
    );
  }

  public async saveWorkspace(
    workspace: Workspace,
    data?: SavedScore,
  ): Promise<SaveWorkspaceReplyArgs> {
    return await window.ipcRenderer.invoke(IpcRendererChannels.SaveWorkspace, {
      filePath: workspace.filePath,
      sourceFormat: workspace.sourceFormat,
      tempFileName: workspace.tempFileName,
      data: data ?? SaveService.SaveScoreToJson(workspace.score),
    } as SaveWorkspaceArgs);
  }

  public async saveWorkspaceAs(
    workspace: Workspace,
    data?: SavedScore,
  ): Promise<SaveWorkspaceAsReplyArgs> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.SaveWorkspaceAs,
      {
        filePath: workspace.filePath,
        tempFileName: workspace.tempFileName,
        data: data ?? SaveService.SaveScoreToJson(workspace.score),
      } as SaveWorkspaceAsArgs,
    );
  }

  public async exportWorkspaceAsPdf(
    workspace: Workspace,
    snapshot: PdfSnapshot,
  ): Promise<ExportWorkspaceReplyArgs> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ExportWorkspaceAsPdf,
      {
        snapshot,
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
  ): Promise<ExportPageAsImageReplyArgs> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ExportPageAsImage,
      {
        filePath,
        data,
      } as ExportPageAsImageArgs,
    );
  }

  public async exportWorkspaceAsHtml(
    workspace: Workspace,
    data: string,
  ): Promise<ExportWorkspaceReplyArgs> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ExportWorkspaceAsHtml,
      {
        filePath: workspace.filePath,
        tempFileName: workspace.tempFileName,
        data,
      } as ExportWorkspaceAsHtmlArgs,
    );
  }

  public async exportWorkspaceAsMusicXml(
    workspace: Workspace,
    data: string,
    compressed: boolean,
    openFolder: boolean,
  ): Promise<ExportWorkspaceReplyArgs> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ExportWorkspaceAsMusicXml,
      {
        filePath: workspace.filePath,
        tempFileName: workspace.tempFileName,
        data,
        compressed,
        openFolder,
      } as ExportWorkspaceAsMusicXmlArgs,
    );
  }

  public async exportWorkspaceAsLatex(
    workspace: Workspace,
    data: string,
  ): Promise<ExportWorkspaceReplyArgs> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ExportWorkspaceAsLatex,
      {
        filePath: workspace.filePath,
        tempFileName: workspace.tempFileName,
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

  public async listRecoveryCandidates(): Promise<ListRecoveryCandidatesReplyArgs> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ListRecoveryCandidates,
    );
  }

  public async saveRecoverySnapshot(
    snapshot: RecoverySnapshotArgs,
  ): Promise<SaveRecoverySnapshotReplyArgs> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.SaveRecoverySnapshot,
      snapshot,
    );
  }

  public async discardRecoverySnapshot(
    workspaceId: string,
  ): Promise<DiscardRecoverySnapshotReplyArgs> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.DiscardRecoverySnapshot,
      workspaceId,
    );
  }

  public async discardRecoverySnapshots(
    recoveryIds: string[],
  ): Promise<DiscardRecoverySnapshotsReplyArgs> {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.DiscardRecoverySnapshots,
      recoveryIds,
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

  public async showItemInFolder(path: string) {
    return await window.ipcRenderer.invoke(
      IpcRendererChannels.ShowItemInFolder,
      path,
    );
  }

  public isShowItemInFolderSupported(): boolean {
    return true;
  }

  public isShowMessageBoxSupported(): boolean {
    return true;
  }

  public async exitApplication(): Promise<void> {
    return await window.ipcRenderer.invoke(IpcRendererChannels.ExitApplication);
  }

  public async cancelExit(): Promise<void> {
    return await window.ipcRenderer.invoke(IpcRendererChannels.CancelExit);
  }

  public async paste(): Promise<ClipboardReplyArgs> {
    return await window.ipcRenderer.invoke(IpcRendererChannels.Paste);
  }
}
