import type { ParagraphStyle } from '@/models/ParagraphStyle';
import type { Score as SavedScore } from '@/models/save/v1/Score';
import type { DocumentProperties, Score } from '@/models/Score';
import { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';

import {
  assertDocumentCanClose,
  type CloseDocumentOptions,
} from './documentLifecycle';
import {
  applyDocumentSave,
  type DocumentSaveResult,
  snapshotDocument,
} from './documentPersistence';
import { replaceDocumentProperties } from './documentProperties';
import type { ElementDiscovery } from './elementDiscovery';
import {
  applyElementEdits,
  type ElementEditPlan,
  planElementEdits,
} from './elementEdits';
import type { ElementEditAction } from './elementEditSchema';
import type { ScoreFileFormat } from './fileTypes';
import {
  planParagraphStyleEdits,
  replaceParagraphStyles,
} from './paragraphStyles';
import type { ParagraphStyleChange } from './paragraphStyleSchema';

export interface DocumentEditor {
  workspaces(): Workspace[];
  selectedWorkspace(): Workspace | null;
  createScore(): Score;
  createWorkspace?(): Workspace;
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
  close(workspace: Workspace): Promise<boolean>;
}

export interface DocumentFileData {
  data: string;
  filePath: string;
  sourceFormat?: ScoreFileFormat | null;
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
    const workspace = this.editor.createWorkspace?.() ?? new Workspace();
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
        workspace = this.editor.createWorkspace?.() ?? new Workspace();
        try {
          workspace.score = SaveService.LoadScoreFromJson(
            JSON.parse(file.data),
          );
        } catch (error) {
          throw new Error('INVALID_SCORE', { cause: error });
        }
        workspace.filePath = file.filePath;
        workspace.sourceFormat = file.sourceFormat ?? null;
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

  editParagraphStyles(workspace: Workspace, changes: ParagraphStyleChange[]) {
    const styles = planParagraphStyleEdits(
      workspace.score.paragraphStyles,
      changes,
    );
    this.replaceParagraphStyles(workspace, styles);
  }

  replaceParagraphStyles(workspace: Workspace, styles: ParagraphStyle[]) {
    this.prepare(workspace);
    for (const style of styles) {
      const family = style.overrides.fontFamily;
      const previous = workspace.score.paragraphStyles.find(
        (item) => item.id === style.id,
      );
      if (
        family !== undefined &&
        family !== previous?.overrides.fontFamily &&
        !this.fonts().includes(family)
      ) {
        throw new Error(`FONT_NOT_FOUND: ${family}`);
      }
    }
    this.editor.changeStyles(workspace, () =>
      replaceParagraphStyles(workspace, styles),
    );
    this.editor.changed(workspace);
  }

  async planElementEdits(
    workspace: Workspace,
    discovery: ElementDiscovery,
    actions: ElementEditAction[],
  ) {
    this.prepare(workspace);
    const plan = planElementEdits(workspace, discovery, actions, this.fonts());
    await this.editor.ensureFonts(plan.fontFamilies);
    return plan;
  }

  editElements(workspace: Workspace, plan: ElementEditPlan) {
    const applied = applyElementEdits(workspace, plan);
    if (applied) {
      this.editor.elementsChanged(workspace);
      this.editor.changed(workspace);
    }
    return { applied, created: plan.created };
  }

  async save<T extends DocumentSaveResult>(
    workspace: Workspace,
    persist: (data: SavedScore) => Promise<T>,
  ): Promise<T & { savedContentUnchanged: boolean }> {
    await this.settle(workspace);
    const snapshot = this.snapshot(workspace);
    const result = await persist(this.serialize(workspace));
    let savedContentUnchanged = false;
    if (result.success) {
      this.prepare(workspace);
      savedContentUnchanged = applyDocumentSave(workspace, result, snapshot);
      if (savedContentUnchanged) {
        const savedSnapshot = this.snapshot(workspace);
        await this.editor.saved(workspace);
        savedContentUnchanged = this.snapshot(workspace) === savedSnapshot;
      }
    }
    return { ...result, savedContentUnchanged };
  }

  async exportPdf<T>(
    workspace: Workspace,
    render: (workspace: Workspace) => Promise<T>,
  ): Promise<T> {
    this.prepare(workspace);
    return render(workspace);
  }
}
