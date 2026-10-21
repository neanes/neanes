import { EventBus } from '@/eventBus';
import { IpcRendererChannels } from '@/ipc/ipcChannels';
import { ContentChangeTracker } from '@/services/ContentChangeTracker';

import type { AddToCollectionCommandArgs } from './commands/AddToCollectionCommand';
import { AddToCollectionCommand } from './commands/AddToCollectionCommand';
import type { RemoveFromCollectionCommandArgs } from './commands/RemoveFromCollectionCommand';
import { RemoveFromCollectionCommand } from './commands/RemoveFromCollectionCommand';
import type { ReplaceElementInCollectionCommandArgs } from './commands/ReplaceElementInCollectionCommand';
import { ReplaceElementInCollectionCommand } from './commands/ReplaceElementInCollectionCommand';
import type { UpdatePropertiesCommandArgs } from './commands/UpdatePropertiesCommand';
import { UpdatePropertiesCommand } from './commands/UpdatePropertiesCommand';

export interface Command {
  // Report actual content changes so empty operations do not advance revisions.
  execute(): boolean;
  undo(): boolean;
  redo(): boolean;

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

  constructor(private contentChanges = new ContentChangeTracker()) {
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
    if (!this.applyChange(() => command.execute())) {
      return;
    }

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
    const applied: Command[] = [];
    this.applyChange(() => {
      for (const command of batch) {
        command.batchId = this.nextBatchId;
        if (command.execute()) {
          applied.push(command);
        }
      }
      return applied.length > 0;
    });

    // Remove everything after the current index
    // and push the new commands
    if (!noHistory && applied.length > 0) {
      this.commandHistory = this.commandHistory.slice(0, this.index + 1);
      applied.forEach((x) => this.commandHistory.push(x));
      this.index += applied.length;
      this.notify();
    }

    this.nextBatchId++;
  }

  public undo() {
    if (this.index >= 0) {
      const batchId = this.commandHistory[this.index].batchId;

      this.applyChange(() => {
        let changed = false;
        do {
          changed = this.commandHistory[this.index].undo() || changed;
          this.index--;
        } while (
          this.index >= 0 &&
          batchId != null &&
          this.commandHistory[this.index].batchId === batchId
        );
        return changed;
      });

      this.notify();
    }
  }

  public redo() {
    if (this.index < this.commandHistory.length - 1) {
      const batchId = this.commandHistory[this.index + 1].batchId;

      this.applyChange(() => {
        let changed = false;
        do {
          this.index++;
          changed = this.commandHistory[this.index].redo() || changed;
        } while (
          this.index < this.commandHistory.length - 1 &&
          batchId != null &&
          this.commandHistory[this.index + 1].batchId === batchId
        );
        return changed;
      });

      this.notify();
    }
  }

  public clearHistory() {
    this.commandHistory.splice(0, this.commandHistory.length);
    this.index = -1;

    this.notify();
  }

  private applyChange(operation: () => boolean) {
    // A throwing operation may already have applied part of a change.
    let changed = true;
    try {
      changed = operation();
      return changed;
    } finally {
      if (changed) {
        this.contentChanges.markChanged();
      }
    }
  }
}
