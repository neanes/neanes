import type { Command } from '../CommandService';

export interface UpdatePropertiesCommandArgs<T> {
  target: T;
  newValues: Partial<T>;
}

export class UpdatePropertiesCommand<T> implements Command {
  private previousValues?: Partial<T>;

  constructor(private args: UpdatePropertiesCommandArgs<T>) {}

  public execute() {
    this.previousValues = this.updateProperties(this.args.newValues);
    return Object.keys(this.previousValues).length > 0;
  }

  public undo() {
    if (this.previousValues) {
      const changed = this.updateProperties(this.previousValues);
      this.previousValues = undefined;
      return Object.keys(changed).length > 0;
    }
    return false;
  }

  public redo() {
    if (!this.previousValues) {
      return this.execute();
    }
    return false;
  }

  private updateProperties(newValues: Partial<T>) {
    const previousValues: Partial<T> = {};

    for (const key of Object.keys(newValues)) {
      if (Object.is((this.args.target as any)[key], (newValues as any)[key])) {
        continue;
      }
      // Save the previous values for undo
      (previousValues as any)[key] = (this.args.target as any)[key];

      // Update the value on the object
      (this.args.target as any)[key] = (newValues as any)[key];
    }

    return previousValues;
  }
}
