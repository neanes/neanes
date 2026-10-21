// Runtime content state, independent of undo history and derived layout caches.
export class ContentChangeTracker {
  private _revision = 0;
  public hasUnsavedChanges = false;

  public get revision() {
    return this._revision;
  }

  public markChanged() {
    this.invalidate();
    this.hasUnsavedChanges = true;
  }

  // Loading/replacing a score invalidates pending work but establishes its own
  // dirty-state baseline (for example, a clean file or a recovered draft).
  public invalidate() {
    this._revision++;
  }
}
