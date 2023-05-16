import { Command } from '../CommandService';

export interface UpdatePropertiesCommandArgs<T> {
  target: T;
  newValues: Partial<T>;
}

export class UpdatePropertiesCommand<T> implements Command {
  private previousValues?: Partial<T>;

  constructor(private args: UpdatePropertiesCommandArgs<T>) {}

  public execute() {
    this.previousValues = this.updateProperties(this.args.newValues);
  }

  public undo() {
    if (this.previousValues) {
      this.updateProperties(this.previousValues);
      this.previousValues = undefined;
    }
  }

  public redo() {
    if (!this.previousValues) {
      this.execute();
    }
  }

  private updateProperties(newValues: Partial<T>) {
    const previousValues: Partial<T> = {};

    for (const key of Object.keys(newValues)) {
      // Save the previous values for undo
      (previousValues as any)[key] = (this.args.target as any)[key];

      // Update the value on the object
      (this.args.target as any)[key] = (newValues as any)[key];
    }

    return previousValues;
  }
}
