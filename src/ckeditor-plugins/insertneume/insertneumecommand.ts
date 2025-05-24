import { Command } from 'ckeditor5';

export default class InsertNeumeCommand extends Command {
  execute(char: string) {
    const editor = this.editor;
    editor.model.change((writer) => {
      editor.model.insertContent(writer.createText(char));
    });
  }
}
