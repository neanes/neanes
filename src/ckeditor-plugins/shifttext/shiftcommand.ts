import { Command, Editor } from 'ckeditor5';

import findShiftRange from './findShiftRange';

const SHIFT = 'shift';

export default class ShiftCommand extends Command {
  top: number = 0;
  left: number = 0;

  constructor(editor: Editor) {
    super(editor);
  }

  refresh() {
    const model = this.editor.model;
    const doc = model.document;

    const value = doc.selection.getAttribute(SHIFT) as
      | {
          top: number;
          left: number;
        }
      | undefined;

    this.value = value;
    this.top = value?.top ?? 0;
    this.left = value?.left ?? 0;

    this.isEnabled = model.schema.checkAttributeInSelection(
      doc.selection,
      SHIFT,
    );
  }

  execute(value: { top: number; left: number }) {
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change((writer) => {
      // If selection is collapsed then update selected shift or insert new one at the place of caret.
      if (selection.isCollapsed) {
        const position = selection.getFirstPosition();

        // When selection is inside text with `shift` attribute.
        if (selection.hasAttribute(SHIFT)) {
          // Then update `shift` value.
          const shiftRange = findShiftRange(
            position,
            selection.getAttribute(SHIFT),
            model,
          );

          writer.setAttribute(SHIFT, value, shiftRange);

          // Create new range wrapping changed shift.
          writer.setSelection(shiftRange);
        }
        // If not then insert text node with `shift` attribute in place of caret.
        // However, since selection in collapsed, attribute value will be used as data for text node.
        // So, if `href` is empty, do not create text node.
        else if (value !== null) {
          writer.setSelectionAttribute(SHIFT, value);
        }
      } else {
        // If selection has non-collapsed ranges, we change attribute on nodes inside those ranges
        // omitting nodes where `shift` attribute is disallowed.
        const ranges = model.schema.getValidRanges(
          selection.getRanges(),
          SHIFT,
        );

        for (const range of ranges) {
          writer.setAttribute(SHIFT, value, range);
        }
      }
    });
  }
}
