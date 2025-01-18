import { EventBus } from '@/eventBus';
import { IpcRendererChannels } from '@/ipc/ipcChannels';

import {
  AddToCollectionCommand,
  AddToCollectionCommandArgs,
} from './commands/AddToCollectionCommand';
import {
  RemoveFromCollectionCommand,
  RemoveFromCollectionCommandArgs,
} from './commands/RemoveFromCollectionCommand';
import {
  ReplaceElementInCollectionCommand,
  ReplaceElementInCollectionCommandArgs,
} from './commands/ReplaceElementInCollectionCommand';
import {
  UpdatePropertiesCommand,
  UpdatePropertiesCommandArgs,
} from './commands/UpdatePropertiesCommand';

export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;

  batchId?: number;
}

interface CommandMap<T> {
  'update-properties': UpdatePropertiesCommandArgs<T>;
  'add-to-collection': AddToCollectionCommandArgs<T>;
  'replace-element-in-collection': ReplaceElementInCollectionCommandArgs<T>;
  'remove-from-collection': RemoveFromCollectionCommandArgs<T>;
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
      case 'add-to-collection':
        return new AddToCollectionCommand(
          args as AddToCollectionCommandArgs<T>,
        );
      case 'replace-element-in-collection':
        return new ReplaceElementInCollectionCommand(
          args as ReplaceElementInCollectionCommandArgs<T>,
        );
      case 'remove-from-collection':
        return new RemoveFromCollectionCommand(
          args as RemoveFromCollectionCommandArgs<T>,
        );
      default:
        throw `Unknown command key: ${key}`;
    }
  }
}

export class CommandService {
  private commandHistory: Command[] = [];
  private index: number = -1;
  private nextBatchId: number = 1;

  constructor() {
    this.notify();
  }

  private get canUndo() {
    return this.index > -1;
  }

  private get canRedo() {
    return this.index < this.commandHistory.length - 1;
  }

  public notify() {
    EventBus.$emit(IpcRendererChannels.SetCanUndo, this.canUndo);
    EventBus.$emit(IpcRendererChannels.SetCanRedo, this.canRedo);
  }

  public execute(command: Command, noHistory: boolean = false) {
    command.execute();

    // Remove everything after the current index
    // and push the new command
    if (!noHistory) {
      this.commandHistory = this.commandHistory.slice(0, this.index + 1);
      this.commandHistory.push(command);
      this.index++;
      this.notify();
    }
  }

  public executeAsBatch(batch: Command[], noHistory: boolean = false) {
    for (const command of batch) {
      command.batchId = this.nextBatchId;
      this.execute(command, true);
    }

    // Remove everything after the current index
    // and push the new commands
    if (!noHistory) {
      this.commandHistory = this.commandHistory.slice(0, this.index + 1);
      batch.forEach((x) => this.commandHistory.push(x));
      this.index += batch.length;
      this.notify();
    }

    this.nextBatchId++;
  }

  public undo() {
    if (this.index >= 0) {
      const batchId = this.commandHistory[this.index].batchId;

      do {
        this.commandHistory[this.index].undo();
        this.index--;
      } while (
        this.index >= 0 &&
        batchId != null &&
        this.commandHistory[this.index].batchId === batchId
      );

      this.notify();
    }
  }

  public redo() {
    if (this.index < this.commandHistory.length - 1) {
      const batchId = this.commandHistory[this.index + 1].batchId;

      do {
        this.index++;
        this.commandHistory[this.index].redo();
      } while (
        this.index < this.commandHistory.length - 1 &&
        batchId != null &&
        this.commandHistory[this.index + 1].batchId === batchId
      );

      this.notify();
    }
  }

  public clearHistory() {
    this.commandHistory.splice(0, this.commandHistory.length);
    this.index = -1;

    this.notify();
  }
}
