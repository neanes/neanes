import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';

interface Settlement {
  score: Score;
  revision: number;
  successful: boolean;
}

// Only for worker-owned documents: all content edits use tracked commands.
// Rendering dependencies outside the score must explicitly invalidate this state.
export class WorkerSettlement {
  private states = new WeakMap<Workspace, Settlement>();

  has(workspace: Workspace) {
    const state = this.states.get(workspace);
    return (
      state?.successful === true &&
      state.score === workspace.score &&
      state.revision === workspace.contentRevision
    );
  }

  begin(workspace: Workspace) {
    const state: Settlement = {
      score: workspace.score,
      revision: workspace.contentRevision,
      successful: false,
    };
    this.states.set(workspace, state);
    // Call only after all font loading, measurement and layout passes succeed.
    return () => {
      if (
        this.states.get(workspace) === state &&
        state.score === workspace.score &&
        state.revision === workspace.contentRevision
      ) {
        state.successful = true;
      }
    };
  }

  dispose(workspace: Workspace) {
    this.states.delete(workspace);
  }

  invalidate() {
    this.states = new WeakMap();
  }
}
