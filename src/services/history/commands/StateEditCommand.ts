import type { Command } from '../CommandService';

export interface StateEdit<State extends object> {
  capture(): State;
  apply(): void;
  restore(state: State): void;
  equals(left: State, right: State): boolean;
}

// The editing layer defines the state boundary; history only replays it.
export class StateEditCommand<State extends object> implements Command {
  private before?: State;
  private after?: State;
  private applied = false;

  constructor(private readonly edit: StateEdit<State>) {}

  public execute() {
    this.before = this.edit.capture();
    this.edit.apply();
    this.after = this.edit.capture();
    this.applied = true;
    return !this.edit.equals(this.before, this.after);
  }

  public undo() {
    if (!this.applied || this.before === undefined) {
      return false;
    }
    const changed = this.restore(this.before);
    this.applied = false;
    return changed;
  }

  public redo() {
    if (this.applied) {
      return false;
    }
    if (this.after === undefined) {
      return this.execute();
    }
    const changed = this.restore(this.after);
    this.applied = true;
    return changed;
  }

  private restore(state: State) {
    if (this.edit.equals(this.edit.capture(), state)) {
      return false;
    }
    this.edit.restore(state);
    return true;
  }
}
