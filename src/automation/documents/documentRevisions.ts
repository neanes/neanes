import type { Workspace } from '@/models/Workspace';

// Content revisions count intervening edits, including edit/undo between reads.
// A save-as changes API-visible file context without making the score dirty.
export class DocumentRevisions {
  private states = new Map<
    string,
    {
      contentRevision: number;
      filePath: string | null;
      revision: number;
    }
  >();
  read(workspace: Workspace) {
    let state = this.states.get(workspace.id);
    if (state === undefined) {
      state = {
        contentRevision: workspace.contentRevision,
        filePath: workspace.filePath,
        revision: workspace.contentRevision,
      };
      this.states.set(workspace.id, state);
    } else {
      const edits = workspace.contentRevision - state.contentRevision;
      state.revision += edits < 0 ? 1 : edits;
      if (workspace.filePath !== state.filePath) {
        state.revision++;
      }
      state.contentRevision = workspace.contentRevision;
      state.filePath = workspace.filePath;
    }
    return state.revision;
  }
  retain(ids: Set<string>) {
    for (const id of this.states.keys()) {
      if (!ids.has(id)) {
        this.states.delete(id);
      }
    }
  }
  delete(id: string) {
    this.states.delete(id);
  }
}
