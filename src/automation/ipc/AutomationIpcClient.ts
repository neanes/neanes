import { IpcRendererChannels } from '@/ipc/ipcChannels';
import type {
  OpenScoreFileResult,
  PdfExportOptions,
  ReadScoreFileResult,
  WorkspaceFile,
  WriteScoreFileArgs,
} from '@/services/documents/fileTypes';
import type { ScoreRenderSnapshot } from '@/services/rendering/scoreRenderSnapshot';

import type { BatchQuery } from '../contracts/batch';
import { unwrapAutomationOutcome } from '../contracts/errors';
import type { PreviewPageResult } from '../contracts/preview';

export class AutomationIpcClient {
  requestId = '';
  private async invoke<T>(
    channel: IpcRendererChannels,
    ...args: unknown[]
  ): Promise<T> {
    return unwrapAutomationOutcome(
      await window.ipcRenderer.invoke(channel, this.requestId, ...args),
    );
  }
  previewPage(
    snapshot: ScoreRenderSnapshot,
    pageNumber: number,
    maxEdge: number,
  ): Promise<PreviewPageResult> {
    return this.invoke(IpcRendererChannels.AutomationPreviewPage, {
      snapshot,
      pageNumber,
      maxEdge,
    });
  }
  async planBatch(query: BatchQuery): Promise<void> {
    await this.invoke(IpcRendererChannels.AutomationPlanBatch, query);
  }
  async authorizeRequest(): Promise<void> {
    await this.invoke(IpcRendererChannels.AutomationAuthorizeRequest);
  }
  automationReadScore(
    filePath: string,
    workspaces: WorkspaceFile[],
  ): Promise<OpenScoreFileResult> {
    return this.invoke(
      IpcRendererChannels.AutomationReadScore,
      filePath,
      workspaces,
    );
  }
  automationWriteScore(
    args: WriteScoreFileArgs,
  ): Promise<Omit<ReadScoreFileResult, 'data'>> {
    return this.invoke(IpcRendererChannels.AutomationWriteScore, args);
  }
  async automationExportPdf(args: PdfExportOptions): Promise<void> {
    await this.invoke(IpcRendererChannels.AutomationExportPdf, args);
  }
}
