import { describe, expect, it, vi } from 'vitest';

vi.mock('ckeditor5', () => ({
  Command: class Command {
    public editor: unknown;

    constructor(editor: unknown) {
      this.editor = editor;
    }

    set(name: string, value: unknown) {
      (this as Record<string, unknown>)[name] = value;
    }
  },
}));

import { ALIGNMENT_OVERRIDE_MIXED_VALUE } from '@/utils/alignmentOverride';

import {
  ALIGNMENT_OVERRIDE,
  AlignmentOverrideCommand,
} from './alignmentoverridecommand';

type BlockMock = {
  allowed?: boolean;
  getAttribute: () => unknown;
};

function createEditor(selectedBlocks: BlockMock[]) {
  const setAttribute = vi.fn();
  const removeAttribute = vi.fn();
  const editor = {
    model: {
      document: {
        selection: {
          getSelectedBlocks: () => selectedBlocks,
        },
      },
      schema: {
        checkAttribute: (block: BlockMock, attributeName: string) =>
          attributeName === ALIGNMENT_OVERRIDE && block.allowed !== false,
      },
      change: (callback: (writer: unknown) => void) =>
        callback({ setAttribute, removeAttribute }),
    },
  };

  return { editor, setAttribute, removeAttribute };
}

describe('AlignmentOverrideCommand', () => {
  it('reads a uniform explicit override from the selected blocks', () => {
    const { editor } = createEditor([
      { allowed: true, getAttribute: () => 'left' },
      { allowed: true, getAttribute: () => 'left' },
    ]);
    const command = new AlignmentOverrideCommand(editor as never);

    command.refresh();

    expect(command.value).toBe('left');
  });

  it('reports mixed explicit alignment overrides without a uniform value', () => {
    const { editor } = createEditor([
      { allowed: true, getAttribute: () => 'left' },
      { allowed: true, getAttribute: () => 'right' },
    ]);
    const command = new AlignmentOverrideCommand(editor as never);

    command.refresh();

    expect(command.value).toBe(ALIGNMENT_OVERRIDE_MIXED_VALUE);
  });

  it('does not report a uniform value when some selected blocks are inherited', () => {
    const { editor } = createEditor([
      { allowed: true, getAttribute: () => 'left' },
      { allowed: true, getAttribute: () => undefined },
    ]);
    const command = new AlignmentOverrideCommand(editor as never);

    command.refresh();

    expect(command.value).toBe(ALIGNMENT_OVERRIDE_MIXED_VALUE);
  });

  it('disables the command when the first selected block cannot carry alignment', () => {
    const editor = {
      model: {
        document: {
          selection: {
            getSelectedBlocks: () => [
              { allowed: false, getAttribute: () => undefined },
            ],
          },
        },
        schema: {
          checkAttribute: (block: BlockMock, attributeName: string) =>
            attributeName === ALIGNMENT_OVERRIDE && block.allowed !== false,
        },
        change: vi.fn(),
      },
    };
    const command = new AlignmentOverrideCommand(editor as never);

    command.refresh();

    expect(command.isEnabled).toBe(false);
  });

  it('sets the explicit override on every selected block', () => {
    const block1 = { allowed: true, getAttribute: () => undefined };
    const block2 = { allowed: true, getAttribute: () => undefined };
    const blocks = [block1, block2];
    const { editor, setAttribute } = createEditor(blocks);
    const command = new AlignmentOverrideCommand(editor as never);

    command.execute({ value: 'center' });

    expect(setAttribute).toHaveBeenNthCalledWith(
      1,
      ALIGNMENT_OVERRIDE,
      'center',
      blocks[0],
    );
    expect(setAttribute).toHaveBeenNthCalledWith(
      2,
      ALIGNMENT_OVERRIDE,
      'center',
      blocks[1],
    );
  });

  it('clears the explicit override from every selected block when no value is provided', () => {
    const block1 = { allowed: true, getAttribute: () => undefined };
    const block2 = { allowed: true, getAttribute: () => undefined };
    const blocks = [block1, block2];
    const { editor, removeAttribute } = createEditor(blocks);
    const command = new AlignmentOverrideCommand(editor as never);

    command.execute();

    expect(removeAttribute).toHaveBeenNthCalledWith(
      1,
      ALIGNMENT_OVERRIDE,
      blocks[0],
    );
    expect(removeAttribute).toHaveBeenNthCalledWith(
      2,
      ALIGNMENT_OVERRIDE,
      blocks[1],
    );
  });

  it('skips selected blocks that cannot carry alignment overrides', () => {
    const enabledBlock = { allowed: true, getAttribute: () => undefined };
    const disabledBlock = { allowed: false, getAttribute: () => undefined };
    const { editor, setAttribute, removeAttribute } = createEditor([
      enabledBlock,
      disabledBlock,
    ]);
    const command = new AlignmentOverrideCommand(editor as never);

    command.execute({ value: 'justify' });

    expect(setAttribute).toHaveBeenCalledTimes(1);
    expect(setAttribute).toHaveBeenCalledWith(
      ALIGNMENT_OVERRIDE,
      'justify',
      enabledBlock,
    );
    expect(removeAttribute).not.toHaveBeenCalled();
  });
});
