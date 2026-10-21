// Runtime content state, independent of undo history and derived layout caches.
export class ContentChangeTracker {
  private _revision = 0;
  private _stateId = 0;
  private nextStateId = 1;
  private savedStateId: number | null = 0;

  public get revision() {
    return this._revision;
  }

  public get stateId() {
    return this._stateId;
  }

  public get hasUnsavedChanges() {
    return this._stateId !== this.savedStateId;
  }

  // Explicit assignments establish a loaded/recovered document's baseline.
  public set hasUnsavedChanges(value: boolean) {
    this.savedStateId = value ? null : this._stateId;
  }

  public markChanged() {
    this._revision++;
    this._stateId = this.nextStateId++;
  }

  public restoreState(expectedStateId: number, restoredStateId: number) {
    if (this._stateId === expectedStateId) {
      this._revision++;
      this._stateId = restoredStateId;
    } else {
      // A noHistory edit or partial failure changed the command's starting
      // state. Replaying it cannot prove restoration of an older state.
      this.markChanged();
    }
  }

  public markSaved(stateId: number) {
    this.savedStateId = stateId;
  }

  // Loading/replacing a score invalidates pending work but establishes its own
  // dirty-state baseline (for example, a clean file or a recovered draft).
  public invalidate() {
    const dirty = this.hasUnsavedChanges;
    this.markChanged();
    this.hasUnsavedChanges = dirty;
  }
}
