import type {
  Batch,
  Editor,
  ModelApplyOperationEvent,
  UndoRedoBaseCommandRevertEvent,
} from 'ckeditor5';
import { toRaw } from 'vue';

import type { Command } from '@/services/history/CommandService';

const COMMITTED_UNDO = 'NeanesCommittedRichText';
const histories = new Set<RichTextHistory>();

type Selection = {
  ranges: { start: number[]; end: number[] }[];
  backward: boolean;
};

type Boundary = {
  parent?: Boundary;
  next?: Boundary;
  selection?: Selection;
};

type Checkpoint = {
  boundary: Boundary;
  html: string;
  selection: Selection;
};

function captureSelection(editor: Editor): Selection {
  const selection = editor.model.document.selection;
  return {
    ranges: Array.from(selection.getRanges(), (range) => ({
      start: [...range.start.path],
      end: [...range.end.path],
    })),
    backward: selection.isBackward,
  };
}

// Keep CKEditor's native batches behind the score's commit boundary. Score
// commands replay those batches without exposing committed edits to local Undo.
export class RichTextHistory {
  public isReplaying = false;
  private current: Boundary = {};
  private committed = this.current;
  private committedHtml: string;
  private batches = new WeakMap<Batch, Boundary>();

  constructor(
    private readonly editor: Editor,
    public owner: object,
    private readonly key: string,
    private readonly replay: (callback: () => void) => void,
  ) {
    this.committedHtml = editor.getData();
    editor.commands.get('undo')!.clearStack();
    editor.commands.get('redo')!.clearStack();
    editor.model.on<ModelApplyOperationEvent>(
      'applyOperation',
      (_event, [operation]) => {
        const batch = operation.batch!;
        if (
          !operation.isDocumentOperation ||
          !batch.isLocal ||
          !batch.isUndoable ||
          batch.isUndo ||
          this.batches.has(batch)
        ) {
          return;
        }
        const next = {
          parent: this.current,
          selection: captureSelection(editor),
        };
        this.current.next = next;
        this.current = next;
        this.batches.set(batch, next);
        this.refreshUndo();
      },
      { priority: 'high' },
    );
    editor.commands
      .get('undo')!
      .on<UndoRedoBaseCommandRevertEvent>(
        'revert',
        (_event, batch, reversed) => {
          const boundary = this.batches.get(batch)!;
          this.batches.set(reversed, boundary);
          this.current = boundary.parent!;
          this.refreshUndo();
        },
      );
    editor.commands
      .get('redo')!
      .on<UndoRedoBaseCommandRevertEvent>(
        'revert',
        (_event, batch, reversed) => {
          this.current = this.batches.get(batch)!;
          this.batches.set(reversed, this.current);
          this.refreshUndo();
        },
      );
    editor.on('destroy', () => histories.delete(this));
    histories.add(this);
    this.refreshUndo();
  }

  public acknowledge(html: string, replaced: boolean) {
    if (replaced) {
      this.current = {};
      this.batches = new WeakMap();
    }
    this.committed = this.current;
    this.committedHtml = html;
    // Subsequent input must not extend a batch that score history now owns.
    for (const name of ['insertText', 'delete', 'deleteForward'] as const) {
      const { buffer } = this.editor.commands.get(name)!;
      buffer.input(buffer.limit);
    }
    this.refreshUndo();
  }

  private refreshUndo() {
    const undo = this.editor.commands.get('undo')!;
    if (this.current === this.committed) {
      undo.forceDisabled(COMMITTED_UNDO);
    } else {
      undo.clearForceDisabled(COMMITTED_UNDO);
    }
  }

  private capture() {
    let first = this.current;
    while (first.parent !== undefined && first.parent !== this.committed) {
      first = first.parent;
    }
    return {
      before: {
        boundary: this.committed,
        html: this.committedHtml,
        selection: first.selection!,
      },
      after: {
        boundary: this.current,
        html: this.editor.getData(),
        selection: captureSelection(this.editor),
      },
    };
  }

  private restore(checkpoint: Checkpoint) {
    const editor = this.editor;
    let ancestor: Boundary | undefined = this.current;
    while (ancestor !== undefined && ancestor !== checkpoint.boundary) {
      ancestor = ancestor.parent;
    }
    let descendant: Boundary | undefined = this.current;
    while (descendant !== undefined && descendant !== checkpoint.boundary) {
      descendant = descendant.next;
    }
    this.isReplaying = true;
    try {
      this.replay(() => {
        if (ancestor !== undefined || descendant !== undefined) {
          const direction = ancestor !== undefined ? 'undo' : 'redo';
          const command = editor.commands.get(direction)!;
          while (this.current !== checkpoint.boundary) {
            command.clearForceDisabled(COMMITTED_UNDO);
            command.refresh();
            editor.execute(direction);
          }
        } else {
          // An external content replacement invalidated the native checkpoints.
          editor.data.set(checkpoint.html);
          this.current = {};
          this.batches = new WeakMap();
        }
      });
      editor.model.change((writer) => {
        const root = editor.model.document.getRoot()!;
        writer.setSelection(
          checkpoint.selection.ranges.map(({ start, end }) =>
            writer.createRange(
              writer.createPositionFromPath(root, start),
              writer.createPositionFromPath(root, end),
            ),
          ),
          { backward: checkpoint.selection.backward },
        );
      });
      this.acknowledge(checkpoint.html, false);
    } finally {
      this.isReplaying = false;
    }
  }

  public static wrap(owner: object, values: object, command: Command): Command {
    const checkpoints = Array.from(histories)
      .filter(
        (history) =>
          toRaw(history.owner) === toRaw(owner) &&
          history.current !== history.committed &&
          history.editor.getData() ===
            (values as Record<string, unknown>)[history.key],
      )
      .map((history) => ({
        history: new WeakRef(history),
        ...history.capture(),
      }));
    if (checkpoints.length === 0) {
      return command;
    }
    return {
      execute() {
        const changed = command.execute();
        if (changed) {
          for (const { history, after } of checkpoints) {
            history.deref()?.acknowledge(after.html, false);
          }
        }
        return changed;
      },
      undo() {
        const changed = command.undo();
        if (changed) {
          for (const { history, before } of checkpoints) {
            const live = history.deref();
            if (live !== undefined && histories.has(live)) {
              live.restore(before);
            }
          }
        }
        return changed;
      },
      redo() {
        const changed = command.redo();
        if (changed) {
          for (const { history, after } of checkpoints) {
            const live = history.deref();
            if (live !== undefined && histories.has(live)) {
              live.restore(after);
            }
          }
        }
        return changed;
      },
    };
  }
}
