import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { DocumentService } from '@/services/documents/DocumentService';

export const PRIVATE_DOCUMENT_LIMIT = 16;

export interface PrivateDocumentHooks {
  createScore(): Score;
  prepare(workspace: Workspace): void;
  dispose(workspace: Workspace): void;
  fonts(): string[];
  ensureFonts(families: string[]): Promise<void>;
  settle(workspace: Workspace): Promise<void>;
}

// The caller controls document ownership, cleanup, and store lifetime.
export class PrivateDocumentStore {
  private workspaces: Workspace[] = [];
  readonly documents: DocumentService;

  constructor(private hooks: PrivateDocumentHooks) {
    const workspaces = this.workspaces;

    this.documents = new DocumentService({
      workspaces: () => workspaces,
      selectedWorkspace: () => null,
      createScore: () => hooks.createScore(),
      fonts: () => hooks.fonts(),
      addWorkspace(workspace) {
        if (workspaces.length >= PRIVATE_DOCUMENT_LIMIT) {
          throw new Error('DOCUMENT_LIMIT_REACHED');
        }
        workspace.tempFileName = workspace.id;
        workspaces.push(workspace);
      },
      selectWorkspace() {},
      prepare: (workspace) => hooks.prepare(workspace),
      changed() {},
      elementsChanged() {},
      ensureFonts: (families) => hooks.ensureFonts(families),
      changeStyles(_workspace, operation) {
        operation();
      },
      settle: (workspace) => hooks.settle(workspace),
      async saved() {},
      close: async (workspace) => {
        hooks.dispose(workspace);
        workspaces.splice(workspaces.indexOf(workspace), 1);
        return true;
      },
    });
  }

  owns(workspace: Workspace) {
    return this.workspaces.includes(workspace);
  }

  hasUnsavedDrafts() {
    return this.workspaces.some(
      (workspace) => workspace.hasUnsavedChanges || workspace.isRecovered,
    );
  }

  clear() {
    for (const workspace of this.workspaces) {
      this.hooks.dispose(workspace);
    }
    this.workspaces.length = 0;
  }
}
