import {
  ClipboardPipeline,
  Command,
  Plugin,
  toWidget,
  type ViewElement,
  Widget,
} from 'ckeditor5';

import {
  FOOTNOTE_ATTRIBUTE,
  FOOTNOTE_CLASS,
  FOOTNOTE_ELEMENT,
} from '@/services/RichTextFootnotes';

class InsertFootnoteCommand extends Command {
  public insert: (() => void) | undefined;
  override refresh() {
    this.isEnabled =
      this.insert !== undefined &&
      this.editor.model.schema.checkChild(
        this.editor.model.document.selection.focus!,
        FOOTNOTE_ELEMENT,
      );
  }
  override execute() {
    this.insert?.();
  }
}

export class Footnotes extends Plugin {
  static get pluginName() {
    return 'NeanesFootnotes' as const;
  }
  static get requires() {
    return [Widget] as const;
  }
  public clipboard?: {
    copy(id: string): string;
    paste?: (payload: string) => string;
    reject(): void;
  };
  private markers: Readonly<Record<string, string>> = {};
  init() {
    const editor = this.editor;
    editor.model.schema.register(FOOTNOTE_ELEMENT, {
      isInline: true,
      isObject: true,
      allowWhere: '$text',
      allowAttributes: ['footnoteId'],
      allowAttributesOf: '$text',
    });
    editor.conversion.for('upcast').elementToElement({
      view: {
        name: 'span',
        classes: FOOTNOTE_CLASS,
        attributes: [FOOTNOTE_ATTRIBUTE],
      },
      model: (element, { writer }) =>
        writer.createElement(FOOTNOTE_ELEMENT, {
          footnoteId: element.getAttribute(FOOTNOTE_ATTRIBUTE),
        }),
    });
    editor.conversion.for('dataDowncast').elementToElement({
      model: FOOTNOTE_ELEMENT,
      view: (element, { writer }) =>
        writer.createContainerElement('span', {
          class: FOOTNOTE_CLASS,
          [FOOTNOTE_ATTRIBUTE]: element.getAttribute('footnoteId'),
        }),
    });
    editor.conversion.for('editingDowncast').elementToElement({
      model: FOOTNOTE_ELEMENT,
      view: (element, { writer }) =>
        toWidget(
          writer.createContainerElement(
            'span',
            {
              class: FOOTNOTE_CLASS,
              [FOOTNOTE_ATTRIBUTE]: element.getAttribute('footnoteId'),
            },
            writer.createText(
              this.label(String(element.getAttribute('footnoteId'))),
            ),
          ),
          writer,
        ),
    });
    const clipboard = editor.plugins.get(ClipboardPipeline);
    editor.editing.view.document.on('clipboardOutput', (_event, data) => {
      editor.editing.view.change((writer) => {
        for (const item of writer.createRangeIn(data.content).getItems()) {
          if (item.is('element', 'span') && item.hasClass(FOOTNOTE_CLASS)) {
            const payload = this.clipboard?.copy(
              String(item.getAttribute(FOOTNOTE_ATTRIBUTE)),
            );
            if (payload !== undefined) {
              writer.setAttribute('data-neanes-footnote-body', payload, item);
            }
          }
        }
      });
    });
    clipboard.on('inputTransformation', (event, data) => {
      const markers = [
        ...this.editor.editing.view.createRangeIn(data.content).getItems(),
      ].filter(
        (item): item is ViewElement =>
          item.is('element', 'span') && item.hasClass(FOOTNOTE_CLASS),
      );
      if (markers.length === 0) {
        return;
      }
      if (
        this.clipboard?.paste === undefined ||
        markers.some(
          (marker) => !marker.hasAttribute('data-neanes-footnote-body'),
        )
      ) {
        event.stop();
        this.clipboard?.reject();
        return;
      }
      try {
        editor.editing.view.change((writer) => {
          for (const marker of markers) {
            const id = this.clipboard!.paste!(
              String(marker.getAttribute('data-neanes-footnote-body')),
            );
            writer.setAttribute(FOOTNOTE_ATTRIBUTE, id, marker);
            writer.removeAttribute('data-neanes-footnote-body', marker);
          }
        });
      } catch {
        event.stop();
        this.clipboard.reject();
      }
    });
    editor.commands.add('insertFootnote', new InsertFootnoteCommand(editor));
  }
  public enableInsertion(insert: () => void) {
    const command = this.editor.commands.get(
      'insertFootnote',
    ) as InsertFootnoteCommand;
    command.insert = insert;
    command.refresh();
  }
  private label(id: string) {
    return this.markers[id] ?? '?';
  }
  public setMarkers(markers: Readonly<Record<string, string>>) {
    this.markers = markers;
    const editor = this.editor;
    editor.editing.view.change((writer) => {
      for (const root of editor.model.document.getRoots()) {
        for (const item of editor.model.createRangeIn(root).getItems()) {
          if (!item.is('element', FOOTNOTE_ELEMENT)) {
            continue;
          }
          const view = editor.editing.mapper.toViewElement(item) as ViewElement;
          writer.remove(writer.createRangeIn(view));
          writer.insert(
            writer.createPositionAt(view, 0),
            writer.createText(
              this.label(String(item.getAttribute('footnoteId'))),
            ),
          );
        }
      }
    });
  }
}
