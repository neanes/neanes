import type { Command } from '../CommandService';

export interface RemoveFromCollectionCommandArgs<T> {
  collection: T[];
  element: T;
}

export class RemoveFromCollectionCommand<T> implements Command {
  private index?: number | null;

  constructor(private args: RemoveFromCollectionCommandArgs<T>) {}

  public execute() {
    this.index = this.args.collection.indexOf(this.args.element);

    if (this.index < 0) {
      this.index = null;
      return;
    }

    this.args.collection.splice(this.index, 1);
  }

  public undo() {
    if (typeof this.index === 'number') {
      this.args.collection.splice(this.index, 0, this.args.element);
      this.index = undefined;
    }
  }

  public redo() {
    if (this.index === undefined) {
      this.execute();
    }
  }
}
