import {
  ClipboardPipeline,
  Command,
  type ModelWriter,
  Plugin,
  toWidget,
  type ViewDowncastWriter,
  type ViewElement,
  Widget,
} from 'ckeditor5';

import { NEUME_ELEMENT } from '@/ckeditor-plugins/insertneume/insertneumeediting';
import type { RichTextFootnoteMarker } from '@/models/Element';
import {
  FOOTNOTE_ATTRIBUTE,
  FOOTNOTE_CLASS,
  FOOTNOTE_ELEMENT,
} from '@/services/RichTextFootnotes';

const FOOTNOTE_WRAP = 'neanesFootnoteWrap';
const graphemes = new Intl.Segmenter('und', { granularity: 'grapheme' });
const trailingInvisibleText = /[\t\p{Zs}\p{Default_Ignorable_Code_Point}]+$/u;

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
  private markers: Readonly<Record<string, RichTextFootnoteMarker>> = {};
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
      // A data marker is empty. A container would serialize a block filler
      // and make opening and blurring an untouched editor look like an edit.
      view: (element, { writer }) =>
        writer.createEmptyElement('span', {
          class: FOOTNOTE_CLASS,
          [FOOTNOTE_ATTRIBUTE]: element.getAttribute('footnoteId'),
        }),
    });
    editor.conversion.for('editingDowncast').elementToElement({
      model: FOOTNOTE_ELEMENT,
      view: (element, { writer }) => {
        const id = String(element.getAttribute('footnoteId'));
        const view = writer.createContainerElement('span', {
          class: FOOTNOTE_CLASS,
          dir: 'auto',
          [FOOTNOTE_ATTRIBUTE]: id,
        });
        this.renderMarker(writer, view, id);
        return toWidget(view, writer);
      },
    });
    this.registerWrapConversion();
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
  private registerWrapConversion() {
    const editor = this.editor;
    editor.conversion.for('editingDowncast').add((dispatcher) => {
      dispatcher.on(
        `addMarker:${FOOTNOTE_WRAP}`,
        (
          event,
          { markerName, markerRange, item },
          { consumable, mapper, writer },
        ) => {
          if (item || !consumable.consume(markerRange, event.name)) {
            return;
          }
          const wrapper = writer.createAttributeElement(
            'span',
            { class: 'neanes-footnote-nowrap' },
            { id: markerName, priority: 1 },
          );
          const range = writer.wrap(mapper.toViewRange(markerRange), wrapper);
          for (const element of range.getItems()) {
            if (element.is('attributeElement') && element.isSimilar(wrapper)) {
              mapper.bindElementToMarker(element, markerName);
            }
          }
        },
      );
      dispatcher.on(
        `removeMarker:${FOOTNOTE_WRAP}`,
        (_event, { markerName }, { mapper, writer }) => {
          for (const wrapper of mapper.markerNameToElements(markerName) ?? []) {
            mapper.unbindElementFromMarkerName(wrapper, markerName);
            writer.unwrap(writer.createRangeOn(wrapper), wrapper);
          }
          writer.clearClonedElementsGroup(markerName);
        },
      );
    });
    editor.model.document.registerPostFixer((writer) =>
      this.updateWrapRanges(writer),
    );
  }
  private updateWrapRanges(writer: ModelWriter) {
    const { model } = this.editor;
    if (model.document.differ.getChanges().length === 0) {
      return false;
    }

    // These ranges only drive the editing view. CKEditor tracks their positions
    // when text moves, and the post-fixer rechecks the word boundaries.
    const existing = new Set(model.markers.getMarkersGroup(FOOTNOTE_WRAP));
    const wrappedIds = new Set<string>();
    let changed = false;
    for (const root of model.document.getRoots()) {
      for (const item of writer.createRangeIn(root).getItems()) {
        if (!item.is('element', FOOTNOTE_ELEMENT)) {
          continue;
        }
        const id = item.getAttribute('footnoteId');
        if (typeof id !== 'string' || id === '' || wrappedIds.has(id)) {
          continue;
        }
        let precedingText = '';
        let previous = item.previousSibling;
        while (previous?.is('$text')) {
          precedingText = previous.data + precedingText;
          previous = previous.previousSibling;
        }
        const text = precedingText.replace(trailingInvisibleText, '');
        const grapheme = graphemes.segment(text).containing(text.length - 1);
        // Keep the last visible grapheme and any trailing controls with the
        // marker while leaving earlier line breaks to the browser.
        let start;
        if (grapheme) {
          start = writer
            .createPositionBefore(item)
            .getShiftedBy(grapheme.index - precedingText.length);
        } else if (
          previous?.is('element', NEUME_ELEMENT) &&
          previous.getAttribute('alignRight') !== true
        ) {
          start = writer.createPositionBefore(previous);
        } else {
          continue;
        }
        let last = item;
        for (let node = last.nextSibling; node; node = node.nextSibling) {
          if (node.is('element', FOOTNOTE_ELEMENT)) {
            last = node;
          } else if (
            !node.is('$text') ||
            node.data.replace(trailingInvisibleText, '') !== ''
          ) {
            break;
          }
        }
        const range = writer.createRange(
          start,
          writer.createPositionAfter(last),
        );
        // A malformed document can repeat an ID. Only the first eligible
        // reference owns its wrap marker so the post-fixer converges.
        wrappedIds.add(id);
        const name = `${FOOTNOTE_WRAP}:${id}`;
        const marker = model.markers.get(name);
        if (marker) {
          existing.delete(marker);
          if (marker.getRange().isEqual(range)) {
            continue;
          }
          writer.updateMarker(marker, { range });
        } else {
          writer.addMarker(name, {
            range,
            usingOperation: false,
            affectsData: false,
          });
        }
        changed = true;
      }
    }
    for (const marker of existing) {
      writer.removeMarker(marker);
      changed = true;
    }
    return changed;
  }
  public enableInsertion(insert: () => void) {
    const command = this.editor.commands.get(
      'insertFootnote',
    ) as InsertFootnoteCommand;
    command.insert = insert;
    command.refresh();
  }
  private renderMarker(
    writer: ViewDowncastWriter,
    view: ViewElement,
    id: string,
  ) {
    const marker = this.markers[id];
    if (marker === undefined) {
      writer.removeStyle('width', view);
    } else {
      writer.setStyle('width', `${marker.width}px`, view);
    }
    writer.insert(
      writer.createPositionAt(view, 0),
      writer.createText(marker?.label ?? '?'),
    );
  }
  public setMarkers(markers: Readonly<Record<string, RichTextFootnoteMarker>>) {
    const previous = this.markers;
    this.markers = markers;
    const editor = this.editor;
    editor.editing.view.change((writer) => {
      for (const root of editor.model.document.getRoots()) {
        for (const item of editor.model.createRangeIn(root).getItems()) {
          if (!item.is('element', FOOTNOTE_ELEMENT)) {
            continue;
          }
          const id = String(item.getAttribute('footnoteId'));
          if (
            previous[id]?.label === markers[id]?.label &&
            previous[id]?.width === markers[id]?.width
          ) {
            continue;
          }
          const view = editor.editing.mapper.toViewElement(item) as ViewElement;
          writer.remove(writer.createRangeIn(view));
          this.renderMarker(writer, view, id);
        }
      }
    });
  }
}
