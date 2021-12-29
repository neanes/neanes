import { Command } from '../CommandService';

export interface AddToCollectionCommandArgs<T> {
  collection: T[];
  element: T;
  insertAtIndex?: number;
}

export class AddToCollectionCommand<T> implements Command {
  private added: boolean = false;

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

    this.added = true;
  }

  public undo() {
    if (this.added) {
      const index = this.args.collection.indexOf(this.args.element);
      this.args.collection.splice(index, 1);
      this.added = false;
    }
  }

  public redo() {
    if (!this.added) {
      this.execute();
    }
  }
}
