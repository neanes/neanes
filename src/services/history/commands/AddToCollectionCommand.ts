import type { Command } from '../CommandService';

export interface AddToCollectionCommandArgs<T> {
  collection: T[];
  elements: T[];
  insertAtIndex?: number;
}

export class AddToCollectionCommand<T> implements Command {
  private added: boolean = false;

  constructor(private args: AddToCollectionCommandArgs<T>) {}

  public execute() {
    if (this.args.elements.length === 0) {
      return false;
    }
    if (this.args.insertAtIndex !== undefined) {
      this.args.collection.splice(
        this.args.insertAtIndex,
        0,
        ...this.args.elements,
      );
    } else {
      this.args.collection.push(...this.args.elements);
    }

    this.added = true;
    return true;
  }

  public undo() {
    if (this.added && this.args.elements.length > 0) {
      const index = this.args.collection.indexOf(this.args.elements[0]);
      this.args.collection.splice(index, this.args.elements.length);
      this.added = false;
      return true;
    }
    return false;
  }

  public redo() {
    if (!this.added) {
      return this.execute();
    }
    return false;
  }
}
