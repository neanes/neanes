import { ElementDiscovery } from '@/automation/documents/elementDiscovery';
import type { Page } from '@/models/Page';
import { Workspace } from '@/models/Workspace';
import type { DocumentService } from '@/services/documents/DocumentService';
import { cloneScoreForLayout } from '@/services/documents/layoutSnapshot';
import {
  readHeaderFooterSettings,
  readPageSetup,
} from '@/services/documents/pageSetup';
import { projectSettings } from '@/services/documents/pageSetupSchema';
import { paragraphStyleDefinition } from '@/services/documents/paragraphStyles';

import { getElementCatalog } from '../contracts/elementSchemas';
import {
  AutomationError,
  automationError,
  automationErrorCodes,
} from '../contracts/errors';
import { getModeKeyTemplates } from '../contracts/modeKeyTemplates';
import type { PreviewPageResult } from '../contracts/preview';
import type { AutomationRequest } from '../contracts/protocol';
import { getRichTextFormat } from '../contracts/richTextFormat';
import type { AutomationIpcClient } from '../ipc/AutomationIpcClient';
import { readStaffLyrics } from './contentRead';
import { DocumentRevisions } from './documentRevisions';
import {
  applyElementEdits,
  createdElementResult,
  planElementEdits,
} from './elementEdits';
import {
  discoverPages,
  fingerprintLayout,
  readPageElements,
  readPages,
} from './pageDiscovery';
import { planParagraphStyleEdits } from './paragraphStyleEdits';
import { getParagraphStyles } from './paragraphStyleRead';
import { PRIVATE_DOCUMENT_LIMIT } from './privateDocumentStore';
import { readSelection } from './selectionRead';

// Adapts MCP tool requests to shared document operations.
export class McpDocumentAdapter {
  private discoveries = new Map<string, ElementDiscovery>();
  private revisions = new DocumentRevisions();
  constructor(
    private documents: DocumentService,
    private ipc: AutomationIpcClient,
    private renderPdf: (
      workspace: Workspace,
      filePath: string,
      overwrite: boolean,
    ) => Promise<void>,
    private renderPages: (workspace: Workspace) => Promise<Page[]>,
    private previewPage: (
      workspace: Workspace,
      pageNumber: number,
      maxEdge: number,
    ) => Promise<PreviewPageResult>,
    private mode: 'interactive' | 'headless' = 'interactive',
  ) {}

  private async settleOpened(workspace: Workspace, created: boolean) {
    try {
      await this.documents.settle(workspace);
    } catch (error) {
      // A failed isolated open must not retain an unreachable draft or use capacity.
      if (created && this.documents.selected() == null) {
        await this.documents.close(workspace, { discardUnsavedChanges: true });
      }
      throw error;
    }
  }

  private async mutateAndSettle(
    workspace: Workspace,
    mutate: () => boolean | void,
    { includeSettlementChanges = false } = {},
  ) {
    const revision = this.revision(workspace);
    let applied: boolean | undefined;
    try {
      applied = mutate() ?? this.revision(workspace) !== revision;
      await this.documents.settle(workspace);
    } catch (error) {
      const failure = automationError(error);
      const currentRevision = this.revision(workspace);
      throw new AutomationError({
        ...failure,
        details: {
          ...failure.details,
          documentId: workspace.id,
          // Preserve the operation's commit result across settlement failures.
          editsApplied: includeSettlementChanges
            ? applied === true || currentRevision !== revision
            : (applied ?? currentRevision !== revision),
          revision: currentRevision,
        },
      });
    }
    return applied;
  }

  private discovery(workspace: Workspace) {
    let discovery = this.discoveries.get(workspace.id);
    if (discovery === undefined) {
      discovery = new ElementDiscovery();
      this.discoveries.set(workspace.id, discovery);
    }
    return discovery;
  }

  private revision(workspace: Workspace) {
    if (!this.documents.list().some((item) => item.id === workspace.id)) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }
    return this.revisions.read(workspace);
  }

  private summary(workspace: Workspace) {
    return {
      documentId: workspace.id,
      revision: this.revision(workspace),
      filePath: workspace.filePath,
      title: workspace.score.documentProperties.title,
      hasUnsavedChanges: workspace.hasUnsavedChanges,
      selected: workspace.id === this.documents.selected()?.id,
      elementCount: workspace.score.staff.elements.length,
    };
  }

  // After asynchronous rendering, the document may have been closed or edited.
  private reverify(workspace: Workspace, revision: number, message: string) {
    this.revision(workspace);
    this.documents.prepare(workspace);
    return this.checkedSummary(workspace, revision, message);
  }

  private forget(documentId: string) {
    this.discoveries.delete(documentId);
    this.revisions.delete(documentId);
  }

  private checkedSummary(
    workspace: Workspace,
    expectedRevision: number | undefined,
    message: string,
  ) {
    const summary = this.summary(workspace);
    if (
      expectedRevision !== undefined &&
      expectedRevision !== summary.revision
    ) {
      throw new AutomationError({
        code: 'REVISION_CONFLICT',
        message,
        details: {
          documentId: workspace.id,
          expectedRevision,
          actualRevision: summary.revision,
        },
      });
    }
    return summary;
  }

  async execute(
    request: Exclude<
      AutomationRequest,
      {
        tool: 'batch_update_files' | 'discover_score_files';
      }
    >,
  ): Promise<unknown> {
    const openIds = new Set(
      this.documents.list().map((workspace) => workspace.id),
    );
    this.revisions.retain(openIds);
    for (const id of this.discoveries.keys()) {
      if (!openIds.has(id)) {
        this.discoveries.delete(id);
      }
    }
    if (request.tool === 'get_rich_text_format') {
      return getRichTextFormat(request.arguments);
    }
    if (request.tool === 'get_mode_key_templates') {
      return getModeKeyTemplates(request.arguments);
    }
    if (request.tool === 'get_element_catalog') {
      return getElementCatalog(request.arguments);
    }
    if (request.tool === 'get_capabilities') {
      return {
        mode: this.mode,
        ...(request.arguments.includeErrorCodes
          ? { errorCodes: [...automationErrorCodes] }
          : {}),
        ...(this.mode === 'headless'
          ? {
              privateDocuments: {
                maxDocuments: PRIVATE_DOCUMENT_LIMIT,
                lifetime: 'worker',
              },
            }
          : {}),
        paragraphStyles: {
          actions: ['create', 'replace', 'update', 'delete'],
          dimensions: 'css-px',
          lineHeight: 'multiplier',
        },
        ...(request.arguments.includeFonts
          ? { fonts: this.documents.fonts() }
          : {}),
        formats: {
          open: ['byzx', 'byz'],
          save: ['byzx', 'byz'],
          export: ['pdf'],
        },
      };
    }
    if (request.tool === 'list_documents') {
      return this.documents.list().map((workspace) => {
        this.documents.prepare(workspace);
        return this.summary(workspace);
      });
    }
    if (request.tool === 'create_document') {
      const workspace = this.documents.create({
        title: request.arguments.title,
        markUnsaved: true,
      });
      await this.settleOpened(workspace, true);
      return this.summary(workspace);
    }
    if (request.tool === 'open_document') {
      const file = await this.ipc.automationReadScore(
        request.arguments.filePath,
        this.documents
          .list()
          .flatMap((workspace) =>
            workspace.filePath == null
              ? []
              : [{ documentId: workspace.id, filePath: workspace.filePath }],
          ),
      );
      const { workspace, created } = this.documents.open(file);
      await this.settleOpened(workspace, created);
      return { ...this.summary(workspace), created };
    }
    const workspace = this.documents
      .list()
      .find((workspace) => workspace.id === request.arguments.documentId);
    if (workspace == null) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }
    // Flush pending editor content before revision checks or detached snapshots.
    this.documents.prepare(workspace);
    if (
      request.tool === 'get_elements' ||
      request.tool === 'get_element' ||
      request.tool === 'find_elements' ||
      request.tool === 'edit_elements' ||
      request.tool === 'update_page_setup' ||
      request.tool === 'update_header_footer_settings' ||
      request.tool === 'edit_paragraph_styles' ||
      request.tool === 'save_document'
    ) {
      // Discovery exposes calculated notation properties. Geometry edits and
      // persistence retain source settlement; detached rendering settles its copy.
      await this.documents.settle(workspace);
    }
    if (
      request.tool === 'get_elements' ||
      request.tool === 'get_document_properties' ||
      request.tool === 'get_page_setup' ||
      request.tool === 'get_header_footer_settings' ||
      request.tool === 'find_elements' ||
      request.tool === 'find_text' ||
      request.tool === 'get_element' ||
      request.tool === 'get_element_content' ||
      request.tool === 'get_element_image' ||
      request.tool === 'get_staff_lyrics' ||
      request.tool === 'get_selection' ||
      request.tool === 'get_pages' ||
      request.tool === 'get_page_elements' ||
      request.tool === 'preview_page'
    ) {
      const summary = this.checkedSummary(
        workspace,
        request.arguments.expectedRevision,
        'Read the document again before continuing discovery.',
      );
      if (request.tool === 'get_element_image') {
        const image = await this.ipc.exportImage(
          this.discovery(workspace).readImage(
            workspace.score,
            request.arguments.elementRef,
          ),
        );
        const completed = this.reverify(
          workspace,
          summary.revision,
          'The document changed while exporting the image. Read it again.',
        );
        return { ...completed, ...image };
      }
      if (request.tool === 'preview_page') {
        const image = await this.previewPage(
          workspace,
          request.arguments.pageNumber,
          request.arguments.maxEdge,
        );
        const completed = this.reverify(
          workspace,
          summary.revision,
          'The document changed while rendering the preview. Read it again.',
        );
        return {
          ...completed,
          capturedRevision: summary.revision,
          pageNumber: request.arguments.pageNumber,
          mimeType: 'image/png',
          ...image,
        };
      }
      if (
        request.tool === 'get_pages' ||
        request.tool === 'get_page_elements'
      ) {
        const { score, sources } = cloneScoreForLayout(workspace.score);
        const copy = new Workspace();
        copy.score = score;
        copy.filePath = workspace.filePath;
        copy.tempFileName = workspace.tempFileName;
        let pages: Page[];
        try {
          pages = await this.renderPages(copy);
        } catch (error) {
          throw new AutomationError({
            code: 'LAYOUT_SETTLEMENT_FAILED',
            message: 'The page layout could not be settled.',
            details: {
              reason: error instanceof Error ? error.message : String(error),
            },
          });
        }
        // Interactive content or document ownership can change during rendering.
        const changedMessage =
          'The document changed while measuring pages. Read it again.';
        this.reverify(workspace, summary.revision, changedMessage);
        const layout = discoverPages(
          workspace.score,
          score,
          pages,
          sources,
          this.discovery(workspace),
        );
        const layoutId = await fingerprintLayout(layout);
        const current = this.reverify(
          workspace,
          summary.revision,
          changedMessage,
        );
        if (
          request.arguments.expectedLayoutId !== undefined &&
          request.arguments.expectedLayoutId !== layoutId
        ) {
          throw new AutomationError({
            code: 'LAYOUT_CONFLICT',
            message: 'The page layout changed. Restart page discovery.',
            details: {
              expectedLayoutId: request.arguments.expectedLayoutId,
              actualLayoutId: layoutId,
            },
          });
        }
        return {
          ...current,
          layoutId,
          pageCount: layout.pages.length,
          ...(request.tool === 'get_pages'
            ? readPages(layout, request.arguments)
            : readPageElements(layout, request.arguments)),
        };
      }
      if (request.tool === 'get_document_properties') {
        return {
          ...summary,
          properties: { ...workspace.score.documentProperties },
        };
      }
      if (
        request.tool === 'get_page_setup' ||
        request.tool === 'get_header_footer_settings'
      ) {
        return {
          ...summary,
          settings: projectSettings(
            request.tool === 'get_page_setup'
              ? readPageSetup(workspace.score.pageSetup)
              : readHeaderFooterSettings(workspace.score.pageSetup),
            request.arguments.properties,
          ),
        };
      }
      if (request.tool === 'get_staff_lyrics') {
        return {
          documentId: summary.documentId,
          revision: summary.revision,
          ...readStaffLyrics(workspace.score.staff.lyrics, request.arguments),
        };
      }
      if (request.tool === 'get_element_content') {
        return {
          documentId: summary.documentId,
          revision: summary.revision,
          ...this.discovery(workspace).readContent(
            workspace.score,
            request.arguments,
          ),
        };
      }
      if (request.tool === 'find_text') {
        return {
          ...summary,
          ...this.discovery(workspace).findText(
            workspace.score,
            request.arguments,
          ),
        };
      }
      if (request.tool === 'get_selection') {
        return {
          ...summary,
          ...readSelection(
            workspace,
            this.discovery(workspace),
            this.documents.selected()?.id ?? null,
          ),
        };
      }
      return {
        ...summary,
        ...(request.tool === 'get_elements'
          ? this.discovery(workspace).read(workspace.score, request.arguments)
          : request.tool === 'find_elements'
            ? this.discovery(workspace).find(workspace.score, request.arguments)
            : this.discovery(workspace).lookup(
                workspace.score,
                request.arguments,
              )),
      };
    }
    if (request.tool === 'get_paragraph_styles') {
      return {
        ...this.summary(workspace),
        ...getParagraphStyles(
          workspace.score.paragraphStyles,
          request.arguments,
        ),
      };
    }
    this.checkedSummary(
      workspace,
      request.arguments.expectedRevision,
      'Read the document again before changing, saving, or exporting it.',
    );
    if (
      request.tool === 'update_page_setup' ||
      request.tool === 'update_header_footer_settings'
    ) {
      if (
        request.tool === 'update_page_setup' &&
        request.arguments.changes.neumeDefaultFontFamily !== undefined
      ) {
        const family = request.arguments.changes.neumeDefaultFontFamily;
        await this.documents.ensureFonts([family]);
        if (this.revision(workspace) !== request.arguments.expectedRevision) {
          throw new Error(
            'REVISION_CONFLICT: The document changed while preparing fonts.',
          );
        }
      }
      await this.mutateAndSettle(
        workspace,
        () =>
          this.documents.updatePageSetup(
            workspace,
            request.arguments.changes,
            request.tool === 'update_page_setup' ? 'page' : 'headerFooter',
          ),
        { includeSettlementChanges: true },
      );
      return this.summary(workspace);
    }
    if (request.tool === 'edit_elements') {
      const discovery = this.discovery(workspace);
      const images = new Map<string, string>();
      for (const action of request.arguments.actions) {
        const properties =
          action.action === 'insert'
            ? action.elements.map((element) => element.properties)
            : action.action === 'update'
              ? [action.properties]
              : action.action === 'replace'
                ? [action.element.properties]
                : [];
        for (const values of properties) {
          if (
            typeof values.imagePath === 'string' &&
            !images.has(values.imagePath)
          ) {
            images.set(
              values.imagePath,
              await this.ipc.readImage(values.imagePath),
            );
          }
        }
      }
      this.checkedSummary(
        workspace,
        request.arguments.expectedRevision,
        'The document changed while loading image files. Read it again before editing.',
      );
      this.documents.prepare(workspace);
      const plan = planElementEdits(
        workspace,
        discovery,
        request.arguments.actions,
        this.documents.fonts(),
        images,
      );
      await this.documents.ensureFonts(plan.fontFamilies);
      this.checkedSummary(
        workspace,
        request.arguments.expectedRevision,
        'The document changed while preparing fonts. Read it again before editing.',
      );
      const applied = await this.mutateAndSettle(workspace, () =>
        this.documents.changeElements(workspace, () =>
          applyElementEdits(workspace, plan),
        ),
      );
      return {
        ...this.summary(workspace),
        applied,
        ...createdElementResult(
          plan.created,
          discovery,
          request.arguments.includeCreated,
        ),
      };
    }
    if (request.tool === 'close_document') {
      let cleanupSucceeded;
      try {
        cleanupSucceeded = await this.documents.close(workspace, {
          discardUnsavedChanges: request.arguments.discardUnsavedChanges,
          expectedSnapshot: this.documents.snapshot(workspace),
        });
      } catch (error) {
        if (this.documents.list().some((item) => item.id === workspace.id)) {
          if (automationError(error).code === 'UNSAVED_CHANGES') {
            throw new AutomationError({
              code: 'UNSAVED_CHANGES',
              message:
                'Save the document or explicitly permit discarding it before closing.',
              details: {
                documentId: workspace.id,
                hasUnsavedChanges: workspace.hasUnsavedChanges,
                isRecovered: workspace.isRecovered,
              },
            });
          }
          throw error;
        }
        this.forget(workspace.id);
        throw new AutomationError({
          code: 'RECOVERY_CLEANUP_FAILED',
          message: 'The document closed, but its recovery cleanup failed.',
          details: {
            documentId: workspace.id,
            closed: true,
            reason: automationError(error).message,
          },
        });
      }
      this.forget(workspace.id);
      if (!cleanupSucceeded) {
        throw new AutomationError({
          code: 'RECOVERY_CLEANUP_FAILED',
          message:
            'The document closed, but its recovery snapshot could not be discarded.',
          details: { documentId: workspace.id, closed: true },
        });
      }
      return {
        documentId: workspace.id,
        selectedDocumentId: this.documents.selected()?.id ?? null,
      };
    }
    if (request.tool === 'edit_paragraph_styles') {
      const before = new Map(
        workspace.score.paragraphStyles.map((style) => [
          style.id,
          JSON.stringify(paragraphStyleDefinition(style)),
        ]),
      );
      await this.mutateAndSettle(workspace, () =>
        this.documents.replaceParagraphStyles(
          workspace,
          planParagraphStyleEdits(
            workspace.score.paragraphStyles,
            request.arguments.changes,
          ),
        ),
      );
      const after = new Map(
        workspace.score.paragraphStyles.map((style) => [
          style.id,
          JSON.stringify(paragraphStyleDefinition(style)),
        ]),
      );
      return {
        ...this.summary(workspace),
        affectedStyleIds: [
          ...new Set([...before.keys(), ...after.keys()]),
        ].filter((id) => before.get(id) !== after.get(id)),
        ...(request.arguments.includeStyles
          ? getParagraphStyles(workspace.score.paragraphStyles)
          : {}),
      };
    }
    if (request.tool === 'replace_document_properties') {
      this.documents.replaceDocumentProperties(
        workspace,
        request.arguments.properties,
      );
      return {
        ...this.summary(workspace),
        properties: { ...workspace.score.documentProperties },
      };
    }
    if (request.tool === 'save_document') {
      const filePath = request.arguments.filePath ?? workspace.filePath;
      if (filePath == null) {
        throw new Error('FILE_PATH_REQUIRED');
      }
      let savedRevision = request.arguments.expectedRevision;
      const saved = await this.documents.save(workspace, async (data) => {
        savedRevision = this.revision(workspace);
        return {
          success: true,
          ...(await this.ipc.automationWriteScore({
            filePath,
            data,
            overwrite: request.arguments.overwrite,
            expectedSource:
              workspace.filePath != null &&
              workspace.sourceMtimeMs != null &&
              workspace.sourceSize != null
                ? {
                    filePath: workspace.filePath,
                    mtimeMs: workspace.sourceMtimeMs,
                    size: workspace.sourceSize,
                  }
                : null,
          })),
        };
      });
      return {
        ...this.summary(workspace),
        savedRevision,
        savedContentUnchanged: saved.savedContentUnchanged,
      };
    }
    // The PDF captures this revision. The completion summary may describe newer
    // edits; do not report a conflict after successfully writing the snapshot.
    await this.documents.exportPdf(workspace, (workspace) =>
      this.renderPdf(
        workspace,
        request.arguments.filePath,
        request.arguments.overwrite,
      ),
    );
    return {
      ...this.summary(workspace),
      exportedRevision: request.arguments.expectedRevision,
      outputFilePath: request.arguments.filePath,
      format: 'pdf',
    };
  }
}
