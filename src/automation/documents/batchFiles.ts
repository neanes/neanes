import type { Workspace } from '@/models/Workspace';
import type { DocumentService } from '@/services/documents/DocumentService';
import { SaveService } from '@/services/SaveService';

import type {
  BatchEdits,
  BatchFileResult,
  BatchQuery,
  BatchResult,
} from '../contracts/batch';
import { automationError } from '../contracts/errors';
import type { AutomationIpcClient } from '../ipc/AutomationIpcClient';
import { planParagraphStyleEdits } from './paragraphStyleEdits';

// Request-owned private documents only. No interactive or caller-owned drafts.
export function applyBatchEdits(
  documents: DocumentService,
  workspace: Workspace,
  edits: BatchEdits,
) {
  if (edits.paragraphStyles) {
    documents.replaceParagraphStyles(
      workspace,
      planParagraphStyleEdits(
        workspace.score.paragraphStyles,
        edits.paragraphStyles,
      ),
    );
  }
  if (edits.pageSetup) {
    documents.updatePageSetup(workspace, edits.pageSetup, 'page');
  }
  if (edits.headerFooter) {
    documents.updatePageSetup(workspace, edits.headerFooter, 'headerFooter');
  }
  if (edits.documentProperties) {
    documents.replaceDocumentProperties(workspace, {
      ...workspace.score.documentProperties,
      ...edits.documentProperties,
    });
  }
}

function normalizedContent(data: string) {
  return JSON.stringify(
    SaveService.SaveScoreToJson(
      SaveService.LoadScoreFromJson(JSON.parse(data)),
    ),
  );
}

export async function batchUpdateFiles(
  query: BatchQuery,
  documents: DocumentService,
  ipc: AutomationIpcClient,
  renderPdf: (
    workspace: Workspace,
    filePath: string,
    overwrite: boolean,
  ) => Promise<void>,
): Promise<BatchResult> {
  await ipc.planBatch(query);
  const results: BatchFileResult[] = [];
  const started = Date.now();
  let stopReason: BatchResult['stopReason'] = 'complete';
  let nextIndex = query.startIndex;
  for (; nextIndex < query.files.length; nextIndex++) {
    if (results.length > 0 && Date.now() - started >= 20_000) {
      stopReason = 'timeBudget';
      break;
    }
    if (JSON.stringify(results).length >= 16_000) {
      stopReason = 'responseBudget';
      break;
    }
    const file = query.files[nextIndex];
    const result: BatchFileResult = {
      index: nextIndex,
      filePath: file.filePath,
      status: 'failed',
    };
    let workspace: Workspace | undefined;
    let cleanupFailed = false;
    try {
      await ipc.authorizeRequest();
      const opened = await ipc.automationReadScore(file.filePath, []);
      if ('documentId' in opened) {
        throw new Error('INTERNAL_ERROR: A batch cannot reuse a document.');
      }
      workspace = documents.open(opened).workspace;
      await documents.settle(workspace);
      const before = JSON.stringify(documents.serialize(workspace));
      if (query.edits) {
        applyBatchEdits(documents, workspace, query.edits);
      }
      if (file.edits) {
        applyBatchEdits(documents, workspace, file.edits);
      }
      await documents.settle(workspace);
      result.changed =
        JSON.stringify(documents.serialize(workspace)) !== before;
      result.status = query.dryRun
        ? 'dryRun'
        : result.changed
          ? 'completed'
          : 'unchanged';
      if (!query.dryRun) {
        let savedContent: string | undefined;
        if (
          query.save === 'copy' ||
          (query.save === 'inPlace' && result.changed)
        ) {
          const saved = await documents.save(workspace, async (data) => {
            savedContent = JSON.stringify(data);
            return {
              success: true,
              ...(await ipc.automationWriteScore({
                filePath:
                  query.save === 'copy'
                    ? file.outputFilePath!
                    : opened.filePath,
                data,
                overwrite: query.overwrite,
                expectedSource: {
                  filePath: opened.filePath,
                  format: opened.sourceFormat,
                  mtimeMs: opened.sourceMtimeMs,
                  size: opened.sourceSize,
                },
              })),
            };
          });
          result.savedFilePath = saved.filePath;
          result.status = 'completed';
          if (!saved.savedContentUnchanged) {
            throw new Error(
              'REVISION_CONFLICT: Saved content changed unexpectedly.',
            );
          }
        }
        if (query.verifySaved) {
          const saved = await ipc.automationReadScore(
            query.save === 'copy' ? file.outputFilePath! : file.filePath,
            [],
          );
          if ('documentId' in saved) {
            throw new Error(
              'INTERNAL_ERROR: Verification cannot reuse a document.',
            );
          }
          // Skipped saves verify the original disk snapshot, not refreshed layout measurements.
          const expected = savedContent ?? opened.data;
          if (normalizedContent(saved.data) !== normalizedContent(expected)) {
            throw new Error('SAVED_FILE_VERIFICATION_FAILED');
          }
          result.verified = true;
        }
        if (file.pdfFilePath) {
          await documents.exportPdf(workspace, (current) =>
            renderPdf(current, file.pdfFilePath!, query.overwrite),
          );
          result.pdfFilePath = file.pdfFilePath;
          result.status = 'completed';
        }
      }
    } catch (error) {
      const failure = automationError(error);
      result.status = 'failed';
      result.error = {
        code: failure.code,
        message: failure.message.slice(0, 240),
      };
    } finally {
      if (workspace) {
        try {
          await documents.close(workspace, { discardUnsavedChanges: true });
        } catch (error) {
          cleanupFailed = true;
          const failure = automationError(error);
          result.status = 'failed';
          result.error ??= {
            code: failure.code,
            message: failure.message.slice(0, 240),
          };
        }
      }
    }
    results.push(result);
    if (
      result.error?.code === 'EXPORT_CANCELLED' ||
      result.error?.code === 'AGENT_ACCESS_DISABLED' ||
      result.error?.code === 'AUTOMATION_REQUEST_REQUIRED' ||
      result.error?.code === 'AUTOMATION_TIMEOUT' ||
      result.error?.code === 'EDITOR_DISCONNECTED'
    ) {
      stopReason = 'cancelled';
      nextIndex++;
      break;
    }
    if (
      cleanupFailed ||
      (result.status === 'failed' && query.onError === 'stop')
    ) {
      stopReason = 'error';
      nextIndex++;
      break;
    }
  }
  return {
    results,
    nextIndex: nextIndex < query.files.length ? nextIndex : null,
    stopReason,
  };
}
