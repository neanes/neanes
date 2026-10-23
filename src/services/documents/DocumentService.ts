import type { ParagraphStyle } from '@/models/ParagraphStyle';
import type { Score as SavedScore } from '@/models/save/v1/Score';
import type { DocumentProperties, Score } from '@/models/Score';
import { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';

import { type DocumentSaveResult, saveDocument } from '../documentPersistence';
import {
  assertDocumentCanClose,
  type CloseDocumentOptions,
} from './documentLifecycle';
import { snapshotDocument } from './documentPersistence';
import { replaceDocumentProperties } from './documentProperties';
import { updatePageSetup } from './pageSetup';
import type { HeaderFooterChanges, PageSetupChanges } from './pageSetupSchema';
import { replaceParagraphStyles } from './paragraphStyles';

export interface DocumentEditor {
  workspaces(): Workspace[];
  selectedWorkspace(): Workspace | null;
  createScore(): Score;
  addWorkspace(workspace: Workspace): void;
  selectWorkspace(workspace: Workspace): void;
  prepare(workspace: Workspace): void;
  changed(workspace: Workspace): void;
  elementsChanged(workspace: Workspace): void;
  ensureFonts(families: string[]): Promise<void>;
  changeStyles(workspace: Workspace, operation: () => void): void;
  settle(workspace: Workspace): Promise<void>;
  fonts(): string[];
  saved(workspace: Workspace): Promise<void>;
  recover?(workspace: Workspace): Promise<void>;
  close(workspace: Workspace): Promise<boolean>;
}

export interface DocumentFileData {
  data: string;
  filePath: string;
  sourceMtimeMs?: number | null;
  sourceSize?: number | null;
}

// Application operations shared by the interactive editor and external adapters.
// Rendering, dialogs, and persistence are supplied by the calling surface.
export class DocumentService {
  constructor(private editor: DocumentEditor) {}

  list() {
    return this.editor.workspaces();
  }
  selected() {
    return this.editor.selectedWorkspace();
  }
  fonts() {
    return this.editor.fonts();
  }
  prepare(workspace: Workspace) {
    this.editor.prepare(workspace);
  }
  async settle(workspace: Workspace) {
    await this.editor.settle(workspace);
    this.prepare(workspace);
  }

  serialize(workspace: Workspace) {
    return SaveService.SaveScoreToJson(workspace.score);
  }

  snapshot(workspace: Workspace) {
    return snapshotDocument(workspace);
  }

  create(options: { title?: string; markUnsaved?: boolean } = {}) {
    const workspace = new Workspace();
    workspace.score = this.editor.createScore();
    if (options.title !== undefined) {
      workspace.score.documentProperties.title = options.title;
    }
    workspace.hasUnsavedChanges = options.markUnsaved ?? false;
    this.editor.addWorkspace(workspace);
    this.editor.selectWorkspace(workspace);
    this.editor.changed(workspace);
    return workspace;
  }

  open(file: DocumentFileData | { documentId: string }) {
    let workspace: Workspace;
    let created = false;
    if ('documentId' in file) {
      const existing = this.list().find(
        (workspace) => workspace.id === file.documentId,
      );
      if (existing == null) {
        throw new Error('DOCUMENT_NOT_FOUND');
      }
      workspace = existing;
    } else {
      const existing = this.list().find(
        (workspace) => workspace.filePath === file.filePath,
      );
      if (existing != null) {
        workspace = existing;
      } else {
        workspace = new Workspace();
        try {
          workspace.score = SaveService.LoadScoreFromJson(
            JSON.parse(file.data),
          );
        } catch (error) {
          throw new Error('INVALID_SCORE', { cause: error });
        }
        workspace.filePath = file.filePath;
        workspace.sourceMtimeMs = file.sourceMtimeMs ?? null;
        workspace.sourceSize = file.sourceSize ?? null;
        this.editor.addWorkspace(workspace);
        created = true;
      }
    }
    this.editor.selectWorkspace(workspace);
    return { workspace, created };
  }

  async close(workspace: Workspace, options: CloseDocumentOptions = {}) {
    if (!this.list().some((item) => item.id === workspace.id)) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }
    this.prepare(workspace);
    assertDocumentCanClose(workspace, options);
    return this.editor.close(workspace);
  }

  replaceDocumentProperties(
    workspace: Workspace,
    properties: DocumentProperties,
  ) {
    this.prepare(workspace);
    replaceDocumentProperties(workspace, properties);
    this.editor.changed(workspace);
  }

  updatePageSetup(
    workspace: Workspace,
    changes: PageSetupChanges | HeaderFooterChanges,
    kind: 'page' | 'headerFooter',
  ) {
    this.prepare(workspace);
    const applied = updatePageSetup(workspace, changes, kind);
    if (applied) {
      this.editor.elementsChanged(workspace);
      this.editor.changed(workspace);
    }
    return applied;
  }

  replaceParagraphStyles(workspace: Workspace, styles: ParagraphStyle[]) {
    this.prepare(workspace);
    this.editor.changeStyles(workspace, () =>
      replaceParagraphStyles(workspace, styles),
    );
    this.editor.changed(workspace);
  }

  async ensureFonts(families: string[]) {
    await this.editor.ensureFonts(families);
  }

  changeElements(workspace: Workspace, operation: () => boolean) {
    const applied = operation();
    if (applied) {
      this.editor.elementsChanged(workspace);
      this.editor.changed(workspace);
    }
    return applied;
  }

  async save<T extends DocumentSaveResult>(
    workspace: Workspace,
    persist: (data: SavedScore) => Promise<T>,
  ): Promise<T & { savedContentUnchanged: boolean }> {
    await this.settle(workspace);
    return saveDocument(workspace, () => persist(this.serialize(workspace)), {
      prepare: (workspace) => this.prepare(workspace),
      saved: (workspace) => this.editor.saved(workspace),
      recover: (workspace) =>
        this.editor.recover?.(workspace) ?? Promise.resolve(),
    });
  }

  async exportPdf<T>(
    workspace: Workspace,
    render: (workspace: Workspace) => Promise<T>,
  ): Promise<T> {
    this.prepare(workspace);
    return render(workspace);
  }
}
