import { v4 as uuid } from 'uuid';

import type { Workspace } from '@/models/Workspace';
import { assertDocumentCanClose } from '@/services/documents/documentLifecycle';

import {
  PRIVATE_DOCUMENT_LIMIT,
  type PrivateDocumentHooks,
  PrivateDocumentStore,
} from './privateDocumentStore';

export const ISOLATED_SESSION_LIMITS = {
  maxSessions: 4,
  maxDocuments: PRIVATE_DOCUMENT_LIMIT,
  idleTimeoutMs: 15 * 60_000,
};

// Session IDs are bearer capabilities under the server's existing authentication.
// Each explicit lease survives HTTP disconnects; expiry discards unsaved drafts.
export class IsolatedSessions {
  private sessions = new Map<
    string,
    { store: PrivateDocumentStore; touched: number }
  >();

  constructor(private hooks: PrivateDocumentHooks) {}

  expire(now = Date.now()) {
    for (const [id, session] of this.sessions) {
      if (now - session.touched >= ISOLATED_SESSION_LIMITS.idleTimeoutMs) {
        session.store.clear();
        this.sessions.delete(id);
      }
    }
  }

  owns(workspace: Workspace) {
    return [...this.sessions.values()].some((session) =>
      session.store.owns(workspace),
    );
  }

  create(now = Date.now()) {
    this.expire(now);
    if (this.sessions.size >= ISOLATED_SESSION_LIMITS.maxSessions) {
      throw new Error('SESSION_LIMIT_REACHED');
    }
    const store = new PrivateDocumentStore(this.hooks);
    const sessionId = uuid();
    this.sessions.set(sessionId, { store, touched: now });
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
    return session.store.documents;
  }

  close(sessionId: string, discardUnsavedChanges: boolean) {
    const documents = this.get(sessionId);
    // Validate the entire session before dropping any document.
    for (const workspace of documents.list()) {
      assertDocumentCanClose(workspace, { discardUnsavedChanges });
    }
    this.sessions.get(sessionId)!.store.clear();
    this.sessions.delete(sessionId);
    return { sessionId };
  }

  hasUnsavedDrafts() {
    return [...this.sessions.values()].some(({ store }) =>
      store.hasUnsavedDrafts(),
    );
  }

  clear() {
    for (const session of this.sessions.values()) {
      session.store.clear();
    }
    this.sessions.clear();
  }
}
