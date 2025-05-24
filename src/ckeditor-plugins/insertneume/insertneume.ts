import './insertneume.css';

import { ButtonView, ContextualBalloon, Plugin } from 'ckeditor5';

import InsertNeumeCommand from './insertneumecommand';
import InsertNeumeView from './insertneumeview';

export default class InsertNeume extends Plugin {
  static get pluginName() {
    return 'InsertNeume';
  }

  init() {
    const editor = this.editor;

    editor.commands.add('insertNeume', new InsertNeumeCommand(editor));

    editor.ui.componentFactory.add('insertNeume', (locale) => {
      const view = new ButtonView(locale);
      view.set({
        label: 'Neumes',
        withText: true,
        //icon: specialCharIcon,
        tooltip: true,
      });

      const balloon = editor.plugins.get(ContextualBalloon);

      view.on('execute', () => {
        const gridView = new InsertNeumeView(
          locale,
          this._getCharList(),
          (char) => {
            editor.execute('insertNeume', char);
            balloon.remove(gridView);
            gridView.destroy();
          },
        );

        balloon.add({
          view: gridView,
          position: {
            target: view.element!,
          },
        });
      });

      return view;
    });
  }

  _getCharList(): string[] {
    const start = 0xe000;
    const end = 0xefff;
    const chars: string[] = [];
    for (let i = start; i <= end; i++) {
      chars.push(String.fromCharCode(i));
    }
    return chars;
  }
}
