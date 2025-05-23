import { Command, Editor } from 'ckeditor5';

export default class UnshiftCommand extends Command {
  constructor(editor: Editor) {
    super(editor);
  }

  refresh() {
    this.isEnabled = this.editor.model.document.selection.hasAttribute('shift');
  }

  execute() {
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change((writer) => {
      if (selection.isCollapsed) {
        writer.removeSelectionAttribute('shift');
      } else {
        const ranges = model.schema.getValidRanges(
          selection.getRanges(),
          'shift',
        );

        for (const range of ranges) {
          writer.removeAttribute('shift', range);
        }
      }
    });
  }
}
