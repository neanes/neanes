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
}

interface HistoryEntry {
  commands: Command[];
  beforeStateId: number;
  afterStateId: number;
}

interface CommandMap<T> {
  'update-properties': UpdatePropertiesCommandArgs<T>;
  'add-to-collection': AddToCollectionCommandArgs<T>;
  'replace-element-in-collection': ReplaceElementInCollectionCommandArgs<T>;
  'remove-from-collection': RemoveFromCollectionCommandArgs<T>;
}

export class CommandFactory<T> {
  constructor(
    private readonly createPropertyCommand: (
      args: UpdatePropertiesCommandArgs<T>,
    ) => Command = (args) => new UpdatePropertiesCommand(args),
  ) {}

  public create<K extends keyof CommandMap<T>>(
    key: K,
    args: CommandMap<T>[K],
  ): Command {
    switch (key) {
      case 'update-properties':
        return this.createPropertyCommand(
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
  private commandHistory: HistoryEntry[] = [];
  private index: number = -1;

  constructor(
    private contentChanges = new ContentChangeTracker(),
    private notificationsEnabled = true,
  ) {
    this.notify();
  }

  private get canUndo() {
    return this.index > -1;
  }

  private get canRedo() {
    return this.index < this.commandHistory.length - 1;
  }

  public notify() {
    if (!this.notificationsEnabled) {
      return;
    }
    EventBus.$emit(IpcRendererChannels.SetCanUndo, this.canUndo);
    EventBus.$emit(IpcRendererChannels.SetCanRedo, this.canRedo);
  }

  public execute(command: Command, noHistory: boolean = false) {
    this.executeAsBatch([command], noHistory);
  }

  public executeAsBatch(batch: Command[], noHistory: boolean = false) {
    const beforeStateId = this.contentChanges.stateId;
    const applied: Command[] = [];
    try {
      for (const command of batch) {
        if (command.execute()) {
          applied.push(command);
        }
      }
    } catch (error) {
      // The failing command or earlier commands may already have changed data.
      this.contentChanges.markChanged();
      throw error;
    }

    if (applied.length === 0) {
      return;
    }
    this.contentChanges.markChanged();

    // Remove everything after the current index
    // and push the new commands
    if (!noHistory) {
      this.commandHistory = this.commandHistory.slice(0, this.index + 1);
      this.commandHistory.push({
        commands: applied,
        beforeStateId,
        afterStateId: this.contentChanges.stateId,
      });
      this.index++;
      this.notify();
    }
  }

  public undo() {
    if (this.canUndo) {
      this.replay(this.commandHistory[this.index], 'undo');
      this.index--;
      this.notify();
    }
  }

  public redo() {
    if (this.canRedo) {
      this.replay(this.commandHistory[this.index + 1], 'redo');
      this.index++;
      this.notify();
    }
  }

  public clearHistory() {
    this.commandHistory.splice(0, this.commandHistory.length);
    this.index = -1;

    this.notify();
  }

  private replay(entry: HistoryEntry, direction: 'undo' | 'redo') {
    const commands =
      direction === 'undo' ? entry.commands.toReversed() : entry.commands;
    let changed = false;
    try {
      for (const command of commands) {
        changed = command[direction]() || changed;
      }
    } catch (error) {
      this.contentChanges.markChanged();
      throw error;
    }
    if (changed) {
      this.contentChanges.restoreState(
        direction === 'undo' ? entry.afterStateId : entry.beforeStateId,
        direction === 'undo' ? entry.beforeStateId : entry.afterStateId,
      );
    }
  }
}
