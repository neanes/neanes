import './richtextselection.css';

import { type Editor, Plugin } from 'ckeditor5';

const NEANES_RICH_TEXT_SELECTION_MARKER = 'neanesRichTextSelection';

/**
 * Renders a "fake" visual selection over the model selection so the user can
 * still see what a toolbar action will affect while DOM focus has moved to a
 * Reka dropdown/popover/input. Once the editing view loses DOM focus, CKEditor
 * stops painting the real selection, so this marker stands in for it. Mirrors
 * the link, emoji, and bookmark features.
 *
 * The marker is added with `usingOperation: false, affectsData: false`, so it
 * never touches saved data or the undo stack and never moves the model
 * selection. Show/hide is driven externally by `beginSelectionGuard` /
 * `endSelectionGuard` in `useRichTextSelectionGuard`.
 */
export default class NeanesFakeSelectionEditing extends Plugin {
  public static get pluginName() {
    return 'NeanesFakeSelectionEditing' as const;
  }

  public init() {
    const editor = this.editor;

    // Expanded selection -> highlight the range.
    editor.conversion.for('editingDowncast').markerToHighlight({
      model: NEANES_RICH_TEXT_SELECTION_MARKER,
      view: { classes: ['ck-fake-neanes-selection'] },
    });

    // Collapsed selection -> a caret element so the insertion point stays
    // visible while focus is elsewhere.
    editor.conversion.for('editingDowncast').markerToElement({
      model: NEANES_RICH_TEXT_SELECTION_MARKER,
      view: (data, { writer }) => {
        if (!data.markerRange.isCollapsed) {
          return null;
        }

        const markerElement = writer.createUIElement('span');

        writer.addClass(
          ['ck-fake-neanes-selection', 'ck-fake-neanes-selection_collapsed'],
          markerElement,
        );

        return markerElement;
      },
    });
  }
}

/**
 * Show (or move) the fake visual-selection marker over the editor's current
 * model selection.
 */
export function showRichTextSelection(editor: Editor) {
  const model = editor.model;

  model.change((writer) => {
    const range = model.document.selection.getFirstRange()!;

    if (model.markers.has(NEANES_RICH_TEXT_SELECTION_MARKER)) {
      writer.updateMarker(NEANES_RICH_TEXT_SELECTION_MARKER, { range });
      return;
    }

    // When the selection is collapsed at the end of a block, anchor the marker
    // on the last non-content position so it has somewhere to render (mirrors
    // CKEditor's link UI).
    if (range.start.isAtEnd) {
      const startPosition = range.start.getLastMatchingPosition(
        ({ item }) => !model.schema.isContent(item),
        { boundaries: range },
      );

      writer.addMarker(NEANES_RICH_TEXT_SELECTION_MARKER, {
        usingOperation: false,
        affectsData: false,
        range: writer.createRange(startPosition, range.end),
      });
    } else {
      writer.addMarker(NEANES_RICH_TEXT_SELECTION_MARKER, {
        usingOperation: false,
        affectsData: false,
        range,
      });
    }
  });
}

/** Remove the fake visual-selection marker if present. */
export function hideRichTextSelection(editor: Editor) {
  const model = editor.model;

  if (!model.markers.has(NEANES_RICH_TEXT_SELECTION_MARKER)) {
    return;
  }

  model.change((writer) => {
    writer.removeMarker(NEANES_RICH_TEXT_SELECTION_MARKER);
  });
}
