import { Command } from '../CommandService';

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

    this.args.collection.splice(this.args.replaceAtIndex, 1, this.args.element);
  }

  public undo() {
    if (this.replacedElement) {
      this.args.collection.splice(
        this.args.replaceAtIndex,
        1,
        this.replacedElement,
      );

      this.replacedElement = undefined;
    }
  }

  public redo() {
    if (!this.replacedElement) {
      this.execute();
    }
  }
}
