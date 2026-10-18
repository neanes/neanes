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
import { renderGeometry } from '@/services/documents/renderGeometry';

import { getElementCatalog } from '../contracts/elementSchemas';
import {
  AutomationError,
  automationError,
  automationErrorCodes,
} from '../contracts/errors';
import type { PreviewImage } from '../contracts/preview';
import type { AutomationRequest } from '../contracts/protocol';
import type { AutomationIpcClient } from '../ipc/AutomationIpcClient';
import { ISOLATED_SESSION_LIMITS } from '../sessions/isolatedSessions';
import { readStaffLyrics } from './contentRead';
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
import { readSelection } from './selectionRead';

// Adapts MCP tool requests to shared document operations.
export class McpDocumentAdapter {
  private discoveries = new Map<string, ElementDiscovery>();
  private states = new Map<
    string,
    { snapshot: string; discoverySnapshot: string; revision: number }
  >();

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
      expectedGeometry: string,
    ) => Promise<PreviewImage>,
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

  private discovery(workspace: Workspace) {
    let discovery = this.discoveries.get(workspace.id);
    if (discovery === undefined) {
      discovery = new ElementDiscovery();
      this.discoveries.set(workspace.id, discovery);
    }
    return discovery;
  }

  private revision(workspace: Workspace) {
    const snapshot = this.documents.snapshot(workspace);
    const discoverySnapshot = this.discovery(workspace).snapshot(
      workspace.score,
    );
    const state = this.states.get(workspace.id);
    if (state == null) {
      this.states.set(workspace.id, {
        snapshot,
        discoverySnapshot,
        revision: 0,
      });
      return 0;
    }
    if (
      snapshot !== state.snapshot ||
      discoverySnapshot !== state.discoverySnapshot
    ) {
      state.snapshot = snapshot;
      state.discoverySnapshot = discoverySnapshot;
      state.revision++;
    }
    return state.revision;
  }

  private summary(workspace: Workspace) {
    return {
      documentId: workspace.id,
      revision: this.revision(workspace),
      filePath: workspace.filePath,
      sourceFormat: workspace.sourceFormat,
      title: workspace.score.documentProperties.title,
      hasUnsavedChanges: workspace.hasUnsavedChanges,
      selected: workspace.id === this.documents.selected()?.id,
      elementCount: workspace.score.staff.elements.length,
    };
  }

  async execute(
    request: Exclude<
      AutomationRequest,
      { tool: 'create_session' | 'close_session' }
    >,
  ): Promise<unknown> {
    const openIds = new Set(
      this.documents.list().map((workspace) => workspace.id),
    );
    for (const id of this.states.keys()) {
      if (!openIds.has(id)) {
        this.states.delete(id);
        this.discoveries.delete(id);
      }
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
        isolatedSessions: ISOLATED_SESSION_LIMITS,
        paragraphStyles: {
          actions: ['create', 'replace', 'delete'],
          dimensions: 'css-px',
          lineHeight: 'multiplier',
        },
        fonts: this.documents.fonts(),
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
    await this.documents.settle(workspace);
    if (
      request.tool === 'get_elements' ||
      request.tool === 'get_document_properties' ||
      request.tool === 'get_page_setup' ||
      request.tool === 'get_header_footer_settings' ||
      request.tool === 'find_elements' ||
      request.tool === 'find_text' ||
      request.tool === 'get_element' ||
      request.tool === 'get_element_content' ||
      request.tool === 'get_staff_lyrics' ||
      request.tool === 'get_selection' ||
      request.tool === 'get_pages' ||
      request.tool === 'get_page_elements' ||
      request.tool === 'preview_page'
    ) {
      const summary = this.summary(workspace);
      if (
        request.arguments.expectedRevision !== undefined &&
        request.arguments.expectedRevision !== summary.revision
      ) {
        throw new AutomationError({
          code: 'REVISION_CONFLICT',
          message: 'Read the document again before continuing discovery.',
          details: {
            documentId: workspace.id,
            expectedRevision: request.arguments.expectedRevision,
            actualRevision: summary.revision,
          },
        });
      }
      if (
        request.tool === 'get_pages' ||
        request.tool === 'get_page_elements' ||
        request.tool === 'preview_page'
      ) {
        const { score, sources } = cloneScoreForLayout(workspace.score);
        const copy = new Workspace(false);
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
        if (!this.documents.list().some((item) => item.id === workspace.id)) {
          throw new Error('DOCUMENT_NOT_FOUND');
        }
        this.documents.prepare(workspace);
        const measuredRevision = this.revision(workspace);
        if (measuredRevision !== summary.revision) {
          throw new AutomationError({
            code: 'REVISION_CONFLICT',
            message:
              'The document changed while measuring pages. Read it again.',
            details: {
              documentId: workspace.id,
              expectedRevision: summary.revision,
              actualRevision: measuredRevision,
            },
          });
        }
        const layout = discoverPages(
          workspace.score,
          score,
          pages,
          sources,
          this.discovery(workspace),
        );
        const layoutId = await fingerprintLayout(layout);
        if (!this.documents.list().some((item) => item.id === workspace.id)) {
          throw new Error('DOCUMENT_NOT_FOUND');
        }
        this.documents.prepare(workspace);
        const current = this.summary(workspace);
        if (current.revision !== summary.revision) {
          throw new AutomationError({
            code: 'REVISION_CONFLICT',
            message:
              'The document changed while measuring pages. Read it again.',
            details: {
              documentId: workspace.id,
              expectedRevision: summary.revision,
              actualRevision: current.revision,
            },
          });
        }
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
        if (request.tool === 'preview_page') {
          if (layout.pages[request.arguments.pageNumber - 1] === undefined) {
            throw new Error('INVALID_PAGE_NUMBER');
          }
          const image = await this.previewPage(
            copy,
            request.arguments.pageNumber,
            request.arguments.maxEdge,
            renderGeometry(copy.score, pages),
          );
          if (!this.documents.list().includes(workspace)) {
            throw new Error('DOCUMENT_NOT_FOUND');
          }
          this.documents.prepare(workspace);
          const completed = this.summary(workspace);
          if (completed.revision !== summary.revision) {
            throw new AutomationError({
              code: 'REVISION_CONFLICT',
              message:
                'The document changed while rendering the preview. Read it again.',
              details: {
                expectedRevision: summary.revision,
                actualRevision: completed.revision,
              },
            });
          }
          return {
            ...completed,
            capturedRevision: summary.revision,
            layoutId,
            pageCount: layout.pages.length,
            pageNumber: request.arguments.pageNumber,
            mimeType: 'image/png',
            ...image,
          };
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
    if (this.revision(workspace) !== request.arguments.expectedRevision) {
      throw new AutomationError({
        code: 'REVISION_CONFLICT',
        message:
          'Read the document again before changing, saving, or exporting it.',
        details: {
          documentId: workspace.id,
          expectedRevision: request.arguments.expectedRevision,
          actualRevision: this.revision(workspace),
        },
      });
    }
    if (
      request.tool === 'update_page_setup' ||
      request.tool === 'update_header_footer_settings'
    ) {
      if (
        request.tool === 'update_page_setup' &&
        request.arguments.changes.neumeDefaultFontFamily !== undefined
      ) {
        const family = request.arguments.changes.neumeDefaultFontFamily;
        if (!this.documents.fonts().includes(family)) {
          throw new Error(`FONT_NOT_FOUND: ${family}`);
        }
        await this.documents.ensureFonts([family]);
        if (this.revision(workspace) !== request.arguments.expectedRevision) {
          throw new Error(
            'REVISION_CONFLICT: The document changed while preparing fonts.',
          );
        }
      }
      const revision = request.arguments.expectedRevision;
      let applied = false;
      try {
        applied = this.documents.updatePageSetup(
          workspace,
          request.arguments.changes,
          request.tool === 'update_page_setup' ? 'page' : 'headerFooter',
        );
        await this.documents.settle(workspace);
      } catch (error) {
        const failure = automationError(error);
        throw new AutomationError({
          ...failure,
          details: {
            ...failure.details,
            documentId: workspace.id,
            editsApplied: applied || this.revision(workspace) !== revision,
            revision: this.revision(workspace),
          },
        });
      }
      return this.summary(workspace);
    }
    if (request.tool === 'edit_elements') {
      const discovery = this.discovery(workspace);
      this.documents.prepare(workspace);
      const plan = planElementEdits(
        workspace,
        discovery,
        request.arguments.actions,
        this.documents.fonts(),
      );
      await this.documents.ensureFonts(plan.fontFamilies);
      const revision = this.revision(workspace);
      if (revision !== request.arguments.expectedRevision) {
        throw new AutomationError({
          code: 'REVISION_CONFLICT',
          message:
            'The document changed while preparing fonts. Read it again before editing.',
          details: {
            documentId: workspace.id,
            expectedRevision: request.arguments.expectedRevision,
            actualRevision: revision,
          },
        });
      }
      let edit;
      try {
        edit = {
          applied: this.documents.changeElements(workspace, () =>
            applyElementEdits(workspace, plan),
          ),
          created: plan.created,
        };
        await this.documents.settle(workspace);
      } catch (error) {
        const failure = automationError(error);
        throw new AutomationError({
          ...failure,
          details: {
            ...failure.details,
            documentId: workspace.id,
            editsApplied:
              edit?.applied ?? this.revision(workspace) !== revision,
            revision: this.revision(workspace),
          },
        });
      }
      return {
        ...this.summary(workspace),
        applied: edit.applied,
        ...createdElementResult(
          edit.created,
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
        this.states.delete(workspace.id);
        this.discoveries.delete(workspace.id);
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
      this.states.delete(workspace.id);
      this.discoveries.delete(workspace.id);
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
      this.documents.replaceParagraphStyles(
        workspace,
        planParagraphStyleEdits(
          workspace.score.paragraphStyles,
          request.arguments.changes,
        ),
      );
      await this.documents.settle(workspace);
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
      await this.documents.settle(workspace);
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
                    format: workspace.sourceFormat ?? undefined,
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
