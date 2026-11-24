import { describe, expect, it } from 'vitest';
import { reactive, toRaw } from 'vue';

import { AddToCollectionCommand } from './commands/AddToCollectionCommand';
import { CompositeCommand } from './commands/CompositeCommand';
import { RemoveFromCollectionCommand } from './commands/RemoveFromCollectionCommand';
import { ReplaceElementInCollectionCommand } from './commands/ReplaceElementInCollectionCommand';
import { UpdatePropertiesCommand } from './commands/UpdatePropertiesCommand';
import type { Command, HistoryState } from './CommandService';
import { CommandService } from './CommandService';

describe('history subscriptions', () => {
  it('publishes current availability immediately and follows history transitions', () => {
    const history = new CommandService();
    const target = { title: '' };
    history.execute(
      new UpdatePropertiesCommand({ target, newValues: { title: 'First' } }),
    );
    const states: HistoryState[] = [];
    history.subscribe((state) => states.push(state));
    history.undo();
    history.redo();
    history.clearHistory();

    expect(states).toEqual([
      { canUndo: true, canRedo: false },
      { canUndo: false, canRedo: true },
      { canUndo: true, canRedo: false },
      { canUndo: false, canRedo: false },
    ]);
    expect(target.title).toBe('First');
  });

  it('publishes a batch once and drops redo availability after branching', () => {
    const history = new CommandService();
    const target = { title: '', author: '' };
    const states: HistoryState[] = [];
    history.subscribe((state) => states.push(state));
    history.executeAsBatch([
      new UpdatePropertiesCommand({ target, newValues: { title: 'First' } }),
      new UpdatePropertiesCommand({ target, newValues: { author: 'Author' } }),
    ]);
    history.undo();
    expect(target).toEqual({ title: '', author: '' });
    history.execute(
      new UpdatePropertiesCommand({ target, newValues: { title: 'Branch' } }),
    );
    history.redo();

    expect(states).toEqual([
      { canUndo: false, canRedo: false },
      { canUndo: true, canRedo: false },
      { canUndo: false, canRedo: true },
      { canUndo: true, canRedo: false },
    ]);
    expect(target.title).toBe('Branch');
  });

  it('does not publish for empty operations or edits without history', () => {
    const history = new CommandService();
    const target = { title: '' };
    const states: HistoryState[] = [];
    history.subscribe((state) => states.push(state));
    history.undo();
    history.redo();
    history.executeAsBatch([]);
    history.execute(
      new UpdatePropertiesCommand({ target, newValues: { title: '' } }),
    );
    history.execute(
      new UpdatePropertiesCommand({
        target,
        newValues: { title: 'Unrecorded' },
      }),
      true,
    );

    expect(states).toEqual([{ canUndo: false, canRedo: false }]);
    expect(target.title).toBe('Unrecorded');
  });

  it('isolates background histories and supports switching and disposing subscriptions', () => {
    const first = reactive(new CommandService());
    const second = new CommandService();
    const target = { title: '' };
    const states: HistoryState[] = [];
    const publish = (state: HistoryState) => states.push(state);
    const unsubscribeFirst = first.subscribe(publish);
    second.execute(
      new UpdatePropertiesCommand({
        target,
        newValues: { title: 'Background' },
      }),
    );
    expect(states).toEqual([{ canUndo: false, canRedo: false }]);

    // Raw automation edits must reach a subscription made through Vue's proxy.
    toRaw(first).execute(
      new UpdatePropertiesCommand({ target, newValues: { title: 'Selected' } }),
    );
    expect(states.at(-1)).toEqual({ canUndo: true, canRedo: false });
    unsubscribeFirst();
    const unsubscribeSecond = second.subscribe(publish);
    const countAfterSwitch = states.length;
    first.undo();
    expect(states).toHaveLength(countAfterSwitch);
    second.undo();
    expect(states.at(-1)).toEqual({ canUndo: false, canRedo: true });

    unsubscribeSecond();
    unsubscribeSecond();
    const countAfterDispose = states.length;
    second.redo();
    toRaw(first).redo();
    expect(states).toHaveLength(countAfterDispose);
  });
});

describe('change subscriptions', () => {
  it('reports the objects each executed, undone and redone command changes', () => {
    const history = new CommandService();
    const target = { title: '' };
    const collection: object[] = [];
    const element = {};
    const changes: Array<readonly object[] | null> = [];
    history.subscribeChanges((affected) => changes.push(affected));

    history.execute(
      new UpdatePropertiesCommand({ target, newValues: { title: 'First' } }),
    );
    history.execute(
      new AddToCollectionCommand({ collection, elements: [element] }),
    );
    history.execute(
      new CompositeCommand([
        new RemoveFromCollectionCommand({ collection, element }),
        new ReplaceElementInCollectionCommand({
          collection: [target],
          element,
          replaceAtIndex: 0,
        }),
      ]),
    );
    history.undo();

    expect(changes).toEqual([
      [target],
      [collection, element],
      [collection, element, expect.anything(), element, target],
      [collection, element, expect.anything(), element],
    ]);
  });

  it('reports unknown changes as null', () => {
    const history = new CommandService();
    const changes: Array<readonly object[] | null> = [];
    history.subscribeChanges((affected) => changes.push(affected));
    const unknown: Command = {
      execute: () => true,
      undo: () => true,
      redo: () => true,
    };

    history.execute(unknown);
    history.execute(new CompositeCommand([unknown]));
    history.undo();

    expect(changes).toEqual([null, null, null]);
  });
});
