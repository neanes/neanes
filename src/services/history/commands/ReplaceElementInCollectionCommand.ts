import type { Command } from '../CommandService';

export interface ReplaceElementInCollectionCommandArgs<T> {
  collection: T[];
  element: T;
  replaceAtIndex: number;
}

export class ReplaceElementInCollectionCommand<T> implements Command {
  private replacedElement?: T;

  constructor(private args: ReplaceElementInCollectionCommandArgs<T>) {}

  public execute() {
    this.replacedElement = this.args.collection[this.args.replaceAtIndex];

    if (this.replacedElement === this.args.element) {
      this.replacedElement = undefined;
      return false;
    }

    this.args.collection.splice(this.args.replaceAtIndex, 1, this.args.element);
    return true;
  }

  public undo() {
    if (this.replacedElement) {
      this.args.collection.splice(
        this.args.replaceAtIndex,
        1,
        this.replacedElement,
      );

      this.replacedElement = undefined;
      return true;
    }
    return false;
  }

  public redo() {
    if (!this.replacedElement) {
      return this.execute();
    }
    return false;
  }
}
