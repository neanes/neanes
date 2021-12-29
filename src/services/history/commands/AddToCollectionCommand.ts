import { Command } from '../CommandService';

export interface AddToCollectionCommandArgs<T> {
  collection: T[];
  element: T;
  insertAtIndex?: number;
}

export class AddToCollectionCommand<T> implements Command {
  constructor(private args: AddToCollectionCommandArgs<T>) {}

  public execute() {
    if (this.args.insertAtIndex !== undefined) {
      this.args.collection.splice(
        this.args.insertAtIndex,
        0,
        this.args.element,
      );
    } else {
      this.args.collection.push(this.args.element);
    }
  }

  public undo() {
    const index = this.args.collection.indexOf(this.args.element);
    this.args.collection.splice(index, 1);
  }

  public redo() {
    this.execute();
  }
}
