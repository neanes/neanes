import type { Command } from '../CommandService';

// A property edit can combine independent state contracts into one undo step.
export class CompositeCommand implements Command {
  private applied: Command[] = [];

  constructor(private readonly commands: Command[]) {}

  public execute() {
    this.applied = this.commands.filter((command) => command.execute());
    return this.applied.length > 0;
  }

  public undo() {
    let changed = false;
    for (const command of this.applied.toReversed()) {
      changed = command.undo() || changed;
    }
    return changed;
  }

  public redo() {
    let changed = false;
    for (const command of this.applied) {
      changed = command.redo() || changed;
    }
    return changed;
  }
}
