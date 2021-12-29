import {
  UpdatePropertiesCommandArgs,
  UpdatePropertiesCommand,
} from './commands/UpdatePropertiesCommand';

export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
}

interface CommandMap<T> {
  'update-properties': UpdatePropertiesCommandArgs<T>;
}

export class CommandFactory<T> {
  public create<K extends keyof CommandMap<T>>(
    key: K,
    args: CommandMap<T>[K],
  ): Command {
    switch (key) {
      case 'update-properties':
        return new UpdatePropertiesCommand(
          args as UpdatePropertiesCommandArgs<T>,
        );
      default:
        throw `Unknown command key: ${key}`;
    }
  }
}

export class CommandService {
  private commandHistory: Command[] = [];
  private index: number = -1;

  public execute(command: Command) {
    command!.execute();

    // Remove everything after the current index
    // and push the new command
    this.commandHistory = this.commandHistory.slice(0, this.index + 1);
    this.commandHistory.push(command!);
    this.index++;
  }

  public undo() {
    if (this.index >= 0) {
      this.commandHistory[this.index].undo();
      this.index--;
    }
  }

  public redo() {
    if (this.index < this.commandHistory.length - 1) {
      this.index++;
      this.commandHistory[this.index].redo();
    }
  }
}
