import { describe, expect, it } from 'vitest';
import { reactive, toRaw } from 'vue';

import { CommandFactory, CommandService } from '../CommandService';
import { UpdatePropertiesCommand } from './UpdatePropertiesCommand';

describe('ordinary property updates', () => {
  it('restores optional property presence through undo and redo', () => {
    const target: { title?: string } = {};
    const command = new UpdatePropertiesCommand({
      target,
      newValues: { title: 'Added' },
    });
    expect(command.undo()).toBe(false);
    expect(command.execute()).toBe(true);
    expect(target.title).toBe('Added');
    expect(command.undo()).toBe(true);
    expect(Object.hasOwn(target, 'title')).toBe(false);
    expect(command.redo()).toBe(true);
    expect(target.title).toBe('Added');
    expect(command.redo()).toBe(false);
  });

  it('does not restore requested fields that were unchanged', () => {
    const target = { title: '', author: 'Original author' };
    const factory = new CommandFactory<typeof target>();
    const history = new CommandService();
    history.execute(
      factory.create('update-properties', {
        target,
        newValues: { title: 'Title', author: target.author },
      }),
    );
    history.execute(
      factory.create('update-properties', {
        target,
        newValues: { author: 'Later author' },
      }),
      true,
    );
    history.undo();
    expect(target).toEqual({ title: '', author: 'Later author' });
    history.redo();
    expect(target).toEqual({ title: 'Title', author: 'Later author' });
  });

  it('recognizes raw and reactive references without cloning children', () => {
    const original = { content: 'Original' };
    const replacement = { content: 'Replacement' };
    const target = reactive({ child: original });
    const unchanged = new UpdatePropertiesCommand({
      target,
      newValues: { child: original },
    });
    expect(unchanged.execute()).toBe(false);
    const history = reactive(new CommandService());
    const factory = new CommandFactory<typeof target>();
    history.execute(
      factory.create('update-properties', {
        target,
        newValues: { child: replacement },
      }),
    );
    history.undo();
    expect(toRaw(target.child)).toBe(original);
    history.redo();
    expect(toRaw(target.child)).toBe(replacement);
  });
});
