import { Command } from '../CommandService';

export interface RemoveFromCollectionCommandArgs<T> {
  collection: T[];
  element: T;
}

export class RemoveFromCollectionCommand<T> implements Command {
  private index?: number;

  constructor(private args: RemoveFromCollectionCommandArgs<T>) {}

  public execute() {
    this.index = this.args.collection.indexOf(this.args.element);

    this.args.collection.splice(this.index, 1);
  }

  public undo() {
    if (this.index) {
      this.args.collection.splice(this.index, 0, this.args.element);
    }
  }

  public redo() {
    if (!this.index) {
      this.execute();
    }
  }
}
