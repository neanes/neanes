import { Command } from 'ckeditor5';

export default class InsertNeumeCommand extends Command {
  execute(char: string) {
    const editor = this.editor;
    editor.model.change((writer) => {
      const attributes = Object.fromEntries(
        editor.model.document.selection.getAttributes(),
      );
      const textNode = writer.createText(char, attributes);
      editor.model.insertContent(textNode);
      editor.focus();
    });
  }
}
