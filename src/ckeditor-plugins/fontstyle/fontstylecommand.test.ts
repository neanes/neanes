import { describe, expect, it, vi } from 'vitest';

vi.mock('ckeditor5', () => ({
  Command: class Command {
    public editor: unknown;

    constructor(editor: unknown) {
      this.editor = editor;
    }
  },
  ModelDocumentSelection: {
    _getStoreAttributeKey: (key: string) => `selection:${key}`,
  },
}));

import { FontStyleCommand, FontStyleToggleCommand } from './fontstylecommand';

function createEditor({
  fontFamily,
  fontStyle,
  defaultFontFamily = 'Source Serif',
  neumeDefaultFontFamily = 'Neanes',
}: {
  fontFamily?: string;
  fontStyle?: string;
  defaultFontFamily?: string;
  neumeDefaultFontFamily?: string;
}) {
  const execute = vi.fn();

  return {
    execute,
    config: {
      get: (key: string) => {
        if (key === 'insertNeume.defaultFontFamily') {
          return defaultFontFamily;
        }

        if (key === 'insertNeume.neumeDefaultFontFamily') {
          return neumeDefaultFontFamily;
        }

        return undefined;
      },
    },
    model: {
      document: {
        selection: {
          getAttribute: (name: string) => {
            if (name === 'fontFamily') {
              return fontFamily;
            }

            if (name === 'fontStyle') {
              return fontStyle;
            }

            return undefined;
          },
        },
      },
      schema: {
        checkAttributeInSelection: () => true,
      },
      change: (callback: () => void) => callback(),
    },
  };
}

describe('FontStyleToggleCommand', () => {
  it('uses Regular for default-family text without an explicit style', () => {
    const editor = createEditor({});
    const command = new FontStyleToggleCommand(editor as never, 'italic');

    command.refresh();

    expect(command.value).toBe(false);
  });

  it('toggles a basic axis without materializing the default family', () => {
    const editor = createEditor({});
    const command = new FontStyleToggleCommand(editor as never, 'bold');

    command.refresh();
    command.execute();

    expect(editor.execute).toHaveBeenCalledWith('fontStyle', {
      value: 'Bold',
    });
    expect(editor.execute).not.toHaveBeenCalledWith(
      'fontFamily',
      expect.anything(),
    );
  });

  it('materializes the default family for a non-basic toggle target', () => {
    const editor = createEditor({ fontStyle: 'Caption' });
    const command = new FontStyleToggleCommand(editor as never, 'bold');

    command.refresh();
    command.execute();

    expect(editor.execute).toHaveBeenNthCalledWith(1, 'fontFamily', {
      value: 'Source Serif,Neanes',
    });
    expect(editor.execute).toHaveBeenNthCalledWith(2, 'fontStyle', {
      value: 'Caption Bold',
    });
  });

  it('treats explicit-family text without fontStyle as Regular', () => {
    const editor = createEditor({ fontFamily: 'GFS Didot,Neanes' });
    const command = new FontStyleToggleCommand(editor as never, 'italic');

    command.refresh();

    expect(command.value).toBe(false);
  });
});

function createStyleCommandEditor(
  ranges: Array<{ isCollapsed: boolean; start?: { parent: unknown } }>,
) {
  const setAttribute = vi.fn();
  const removeAttribute = vi.fn();
  const writer = { setAttribute, removeAttribute };

  const editor = {
    model: {
      document: {
        selection: {
          isCollapsed: false,
          getRanges: () => ranges,
        },
      },
      schema: {
        getValidRanges: (input: unknown) => input,
      },
      change: (callback: (writer: unknown) => void) => callback(writer),
    },
  };

  return { editor, setAttribute, removeAttribute };
}

describe('FontStyleCommand', () => {
  it('sets the style across a non-empty range', () => {
    const range = { isCollapsed: false };
    const { editor, setAttribute } = createStyleCommandEditor([range]);
    const command = new FontStyleCommand(editor as never);

    command.execute({ value: 'Bold' });

    expect(setAttribute).toHaveBeenCalledWith('fontStyle', 'Bold', range);
  });

  it('pins the style on an empty range parent via the selection store key', () => {
    const parent = { name: 'paragraph' };
    const range = { isCollapsed: true, start: { parent } };
    const { editor, setAttribute } = createStyleCommandEditor([range]);
    const command = new FontStyleCommand(editor as never);

    command.execute({ value: 'Bold' });

    expect(setAttribute).toHaveBeenCalledWith(
      'selection:fontStyle',
      'Bold',
      parent,
    );
  });

  it('clears the style on an empty range parent when no value is given', () => {
    const parent = { name: 'paragraph' };
    const range = { isCollapsed: true, start: { parent } };
    const { editor, removeAttribute } = createStyleCommandEditor([range]);
    const command = new FontStyleCommand(editor as never);

    command.execute({});

    expect(removeAttribute).toHaveBeenCalledWith('selection:fontStyle', parent);
  });
});
