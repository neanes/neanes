import type { Workspace } from '@/models/Workspace';
import type { DocumentService } from '@/services/documents/DocumentService';
import { ElementDiscovery } from '@/services/documents/elementDiscovery';
import { getParagraphStyles } from '@/services/documents/paragraphStyles';
import type { IIpcService } from '@/services/ipc/IIpcService';

import { getElementCatalog } from './elementSchemas';
import { AutomationError, automationError } from './errors';
import { ISOLATED_SESSION_LIMITS } from './isolatedSessions';
import type { AutomationRequest } from './protocol';

// Adapts MCP tool requests to shared document operations.
export class McpDocumentAdapter {
  private discoveries = new Map<string, ElementDiscovery>();
  private states = new Map<
    string,
    { snapshot: string; discoverySnapshot: string; revision: number }
  >();

  constructor(
    private documents: DocumentService,
    private ipc: IIpcService,
    private renderPdf: (
      workspace: Workspace,
      filePath: string,
      overwrite: boolean,
    ) => Promise<void>,
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
        mode: 'interactive',
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
    if (request.tool === 'get_elements') {
      const summary = this.summary(workspace);
      if (
        request.arguments.expectedRevision !== undefined &&
        request.arguments.expectedRevision !== summary.revision
      ) {
        throw new AutomationError({
          code: 'REVISION_CONFLICT',
          message:
            'Read the document again before continuing element discovery.',
          details: {
            documentId: workspace.id,
            expectedRevision: request.arguments.expectedRevision,
            actualRevision: summary.revision,
          },
        });
      }
      return {
        ...summary,
        ...this.discovery(workspace).read(workspace.score, request.arguments),
      };
    }
    if (request.tool === 'get_document') {
      const data = this.documents.serialize(workspace);
      const { offset, limit } = request.arguments;
      return {
        ...this.summary(workspace),
        score: {
          ...data,
          staff: {
            ...data.staff,
            elements: data.staff.elements.slice(offset, offset + limit),
          },
        },
        offset,
        nextOffset:
          offset + limit < data.staff.elements.length ? offset + limit : null,
      };
    }
    if (request.tool === 'get_paragraph_styles') {
      return {
        ...this.summary(workspace),
        ...getParagraphStyles(workspace.score.paragraphStyles),
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
    if (request.tool === 'edit_elements') {
      const discovery = this.discovery(workspace);
      const plan = await this.documents.planElementEdits(
        workspace,
        discovery,
        request.arguments.actions,
      );
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
        edit = this.documents.editElements(workspace, plan);
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
        created: edit.created.map(({ clientId, element }) => ({
          clientId,
          elementRef: discovery.reference(element),
          elementType: element.elementType,
        })),
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
      this.documents.editParagraphStyles(workspace, request.arguments.changes);
      await this.documents.settle(workspace);
      return {
        ...this.summary(workspace),
        ...getParagraphStyles(workspace.score.paragraphStyles),
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
