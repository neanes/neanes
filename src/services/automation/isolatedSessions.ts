import { v4 as uuid } from 'uuid';

import type { Score } from '@/models/Score';
import { Workspace } from '@/models/Workspace';
import { assertDocumentCanClose } from '@/services/documents/documentLifecycle';
import { DocumentService } from '@/services/documents/DocumentService';

export const ISOLATED_SESSION_LIMITS = {
  maxSessions: 4,
  maxDocuments: 16,
  idleTimeoutMs: 15 * 60_000,
};

// Session IDs are bearer capabilities under the server's existing authentication.
// Each explicit lease survives HTTP disconnects; expiry discards unsaved drafts.
export class IsolatedSessions {
  private sessions = new Map<
    string,
    { documents: DocumentService; workspaces: Workspace[]; touched: number }
  >();

  constructor(
    private hooks: {
      createScore(): Score;
      prepare(workspace: Workspace): void;
      dispose(workspace: Workspace): void;
      fonts(): string[];
      ensureFonts(families: string[]): Promise<void>;
      settle(workspace: Workspace): Promise<void>;
    },
  ) {}

  expire(now = Date.now()) {
    for (const [id, session] of this.sessions) {
      if (now - session.touched >= ISOLATED_SESSION_LIMITS.idleTimeoutMs) {
        for (const workspace of session.workspaces) {
          this.hooks.dispose(workspace);
        }
        this.sessions.delete(id);
      }
    }
  }

  owns(workspace: Workspace) {
    return [...this.sessions.values()].some((session) =>
      session.workspaces.includes(workspace),
    );
  }

  create(now = Date.now()) {
    this.expire(now);
    if (this.sessions.size >= ISOLATED_SESSION_LIMITS.maxSessions) {
      throw new Error('SESSION_LIMIT_REACHED');
    }
    const workspaces: Workspace[] = [];
    const documents = new DocumentService({
      workspaces: () => workspaces,
      selectedWorkspace: () => null,
      createScore: () => this.hooks.createScore(),
      createWorkspace: () => new Workspace(false),
      fonts: () => this.hooks.fonts(),
      addWorkspace(workspace) {
        if (workspaces.length >= ISOLATED_SESSION_LIMITS.maxDocuments) {
          throw new Error('DOCUMENT_LIMIT_REACHED');
        }
        workspace.tempFileName = workspace.id;
        workspaces.push(workspace);
      },
      selectWorkspace() {},
      prepare: (workspace) => this.hooks.prepare(workspace),
      changed() {},
      elementsChanged() {},
      ensureFonts: (families) => this.hooks.ensureFonts(families),
      changeStyles(_workspace, operation) {
        operation();
      },
      settle: (workspace) => this.hooks.settle(workspace),
      async saved() {},
      close: async (workspace) => {
        this.hooks.dispose(workspace);
        workspaces.splice(workspaces.indexOf(workspace), 1);
        return true;
      },
    });
    const sessionId = uuid();
    this.sessions.set(sessionId, { documents, workspaces, touched: now });
    return {
      sessionId,
      idleTimeoutMs: ISOLATED_SESSION_LIMITS.idleTimeoutMs,
      maxDocuments: ISOLATED_SESSION_LIMITS.maxDocuments,
    };
  }

  get(sessionId: string, now = Date.now()) {
    this.expire(now);
    const session = this.sessions.get(sessionId);
    if (session == null) {
      throw new Error('SESSION_NOT_FOUND');
    }
    session.touched = now;
    return session.documents;
  }

  close(sessionId: string, discardUnsavedChanges: boolean) {
    const documents = this.get(sessionId);
    // Validate the entire session before dropping any document.
    for (const workspace of documents.list()) {
      assertDocumentCanClose(workspace, { discardUnsavedChanges });
    }
    for (const workspace of documents.list()) {
      this.hooks.dispose(workspace);
    }
    this.sessions.delete(sessionId);
    return { sessionId };
  }

  clear() {
    for (const session of this.sessions.values()) {
      for (const workspace of session.workspaces) {
        this.hooks.dispose(workspace);
      }
    }
    this.sessions.clear();
  }
}
