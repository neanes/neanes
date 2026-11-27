import type { Command } from '../CommandService';

export interface ReplaceElementInCollectionCommandArgs<T> {
  collection: T[];
  element: T;
  replaceAtIndex: number;
}

export class ReplaceElementInCollectionCommand<T> implements Command {
  private replacedElement?: T;
  private applied = false;

  constructor(private args: ReplaceElementInCollectionCommandArgs<T>) {}

  public affectedObjects() {
    return [
      this.args.collection,
      this.args.element,
      ...(this.replacedElement === undefined ? [] : [this.replacedElement]),
    ] as object[];
  }

  public execute() {
    this.replacedElement = this.args.collection[this.args.replaceAtIndex];

    if (this.replacedElement === this.args.element) {
      this.replacedElement = undefined;
      return false;
    }

    this.args.collection.splice(this.args.replaceAtIndex, 1, this.args.element);
    this.applied = true;
    return true;
  }

  public undo() {
    if (this.applied && this.replacedElement !== undefined) {
      this.args.collection.splice(
        this.args.replaceAtIndex,
        1,
        this.replacedElement,
      );

      this.applied = false;
      return true;
    }
    return false;
  }

  public redo() {
    if (!this.applied) {
      return this.execute();
    }
    return false;
  }
}
