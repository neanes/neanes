import type { Batch, Editor, ModelItem, ModelRange } from 'ckeditor5';
import { Delete, Plugin, TextTransformation } from 'ckeditor5';

import { quoteStyleForLanguage, smartQuote } from '@/utils/smartQuotes';

// Converts typed straight quotes with the rule plain text fields use, in place
// of CKEditor's pair-based quote transformations. A TextTransformation rule
// cannot do this: CKEditor requests undo-on-backspace after every match, even
// when the rule changes nothing, and deletions also count as typing.
export default class SmartQuotes extends Plugin {
  static get pluginName() {
    return 'SmartQuotes' as const;
  }

  static get requires() {
    return [Delete, TextTransformation] as const;
  }

  constructor(editor: Editor) {
    super(editor);
    // Required plugins initialize first, so TextTransformation reads its
    // config before init() runs here.
    editor.config.define('typing.transformations.remove', ['quotes']);
  }

  init() {
    const editor = this.editor;
    const model = editor.model;

    model.document.on('change:data', (_event, batch: Batch) => {
      if (!batch.isTyping || batch.isUndo || !batch.isLocal) {
        return;
      }

      const inserts = model.document.differ
        .getChanges()
        .filter((change) => change.type === 'insert');

      if (
        inserts.length !== 1 ||
        inserts[0].type !== 'insert' ||
        inserts[0].name !== '$text' ||
        inserts[0].length !== 1
      ) {
        return;
      }

      // Read on each keystroke so preference changes apply to open editors.
      const style = editor.config.get('smartQuotes')?.();

      if (style == null) {
        return;
      }

      const start = inserts[0].position;
      const typedRange = model.createRange(start, start.getShiftedBy(1));
      const typed = [...typedRange.getItems()][0] as ModelItem | undefined;

      if (typed === undefined || !typed.is('$textProxy')) {
        return;
      }

      const language = typed.getAttribute('language') as string | undefined;
      const quote = smartQuote(
        typed.data,
        textBefore(
          model.createRange(model.createPositionAt(start.parent, 0), start),
        ),
        quoteStyleForLanguage(language) ?? style,
      );

      if (quote === undefined) {
        return;
      }

      const attributes = typed.getAttributes();

      // A separate batch lets Backspace undo only the conversion.
      model.enqueueChange((writer) => {
        model.insertContent(writer.createText(quote, attributes), typedRange);
      });
      model.enqueueChange(() => {
        editor.plugins.get(Delete).requestUndoOnBackspace();
      });
    });
  }
}

// Text since the last inline object or soft break, like CKEditor's TextWatcher.
function textBefore(range: ModelRange) {
  let text = '';

  for (const item of range.getItems()) {
    text = item.is('$textProxy') ? text + item.data : '';
  }

  return text;
}
