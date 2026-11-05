import type { Editor } from 'ckeditor5';
import { type InjectionKey, provide, type Ref } from 'vue';

import type { RichTextBoxContentKey } from '@/models/Element';
import type { ScoreElement } from '@/models/Element';
import { RichTextBoxElement } from '@/models/Element';
import type { Footnote } from '@/models/Footnote';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import {
  cloneFootnote,
  createFootnote,
  elementFootnoteIds,
  orderedFootnotes,
  planRichTextFootnoteUpdate,
} from '@/services/FootnoteService';
import { CommandFactory } from '@/services/history/CommandService';
import { FOOTNOTE_ELEMENT } from '@/services/RichTextFootnotes';
import { SaveService } from '@/services/SaveService';
import {
  collectClipboardParagraphStyleIdsFromElements,
  collectClipboardParagraphStylesFromElements,
  resolveClipboardParagraphStyles,
  rewriteClipboardElementParagraphStyleIds,
} from '@/utils/clipboardParagraphStyles';

export interface RichTextFootnoteController {
  supports(owner: object): owner is RichTextBoxElement;
  insert(owner: RichTextBoxElement, editor: Editor): void;
  changed(
    owner: RichTextBoxElement,
    key: RichTextBoxContentKey,
    html: string,
  ): void;
  navigate(id: string): void;
  copy(id: string): string;
  paste(owner: RichTextBoxElement, payload: string): string;
  reject(owner?: object): void;
}

export const richTextFootnoteControllerKey: InjectionKey<RichTextFootnoteController> =
  Symbol('richTextFootnotes');

export function useRichTextFootnotes(
  workspace: Ref<Workspace>,
  flush: (workspace: Workspace) => void,
  openFootnote: (reference: ScoreElement, id?: string) => void,
  updateRichTextBox: (
    owner: RichTextBoxElement,
    values: Partial<RichTextBoxElement>,
  ) => void,
  rejectPaste: () => void,
) {
  const pendingRichTextStyles = new WeakMap<
    RichTextBoxElement,
    ParagraphStyle[]
  >();
  const pendingRichTextFootnotes = new WeakMap<
    RichTextBoxElement,
    Footnote[]
  >();
  const controller: RichTextFootnoteController = {
    supports(owner): owner is RichTextBoxElement {
      return (
        owner instanceof RichTextBoxElement &&
        workspace.value.score.staff.elements.includes(owner)
      );
    },
    insert(owner, editor: Editor) {
      flush(workspace.value);
      const body = createFootnote(owner);
      pendingRichTextFootnotes.set(owner, [body]);
      const attributes = Object.fromEntries(
        editor.model.document.selection.getAttributes(),
      );
      editor.model.change((writer) => {
        editor.model.insertContent(
          writer.createElement(FOOTNOTE_ELEMENT, {
            ...attributes,
            footnoteId: body.id,
          }),
        );
      });
      // Insertion is flushed before navigating to the newly created body.
      flush(workspace.value);
      openFootnote(owner, body.id);
    },
    changed(owner, key, html) {
      // Marker changes commit HTML and bodies together; ordinary typing stays local.
      updateRichTextBox(owner, { [key]: html });
    },
    navigate(id) {
      flush(workspace.value);
      const reference = orderedFootnotes(workspace.value.score).find(
        ({ footnote }) => footnote.id === id,
      )?.reference;
      if (reference !== undefined) {
        openFootnote(reference, id);
      }
    },
    copy(id) {
      flush(workspace.value);
      const body = workspace.value.score.footnotes.find(
        (candidate) => candidate.id === id,
      );
      if (body === undefined) {
        throw new Error('INVALID_FOOTNOTE_REFERENCE');
      }
      return JSON.stringify({
        body: SaveService.SaveFootnote(body),
        paragraphStyles: workspace.value.score.paragraphStyles.map((style) =>
          SaveService.SaveParagraphStyle(style),
        ),
      });
    },
    paste(owner, payload) {
      flush(workspace.value);
      const saved = JSON.parse(payload) as {
        body: ReturnType<typeof SaveService.SaveFootnote>;
        paragraphStyles: ReturnType<typeof SaveService.SaveParagraphStyle>[];
      };
      const sourceStyles = saved.paragraphStyles.map((style) =>
        SaveService.LoadParagraphStyle_v1(style),
      );
      const copy = cloneFootnote(
        SaveService.LoadFootnote_v1(
          saved.body,
          workspace.value.score.pageSetup,
        ),
      );
      if (
        copy.staff.elements.some(
          (element) => elementFootnoteIds(element).length > 0,
        )
      ) {
        throw new Error('NESTED_FOOTNOTES_UNSUPPORTED');
      }
      const currentStyles =
        pendingRichTextStyles.get(owner) ??
        workspace.value.score.paragraphStyles;
      const { importedParagraphStyles, styleIdRemap } =
        resolveClipboardParagraphStyles(
          collectClipboardParagraphStylesFromElements(
            copy.staff.elements,
            sourceStyles,
          ),
          currentStyles,
          collectClipboardParagraphStyleIdsFromElements(copy.staff.elements),
        );
      const paragraphStyles = [...currentStyles, ...importedParagraphStyles];
      copy.staff.elements.forEach((element) =>
        rewriteClipboardElementParagraphStyleIds(
          element,
          paragraphStyles,
          styleIdRemap,
        ),
      );
      pendingRichTextStyles.set(owner, paragraphStyles);
      pendingRichTextFootnotes.set(owner, [
        ...(pendingRichTextFootnotes.get(owner) ?? []),
        copy,
      ]);
      return copy.id;
    },
    reject(owner) {
      if (owner instanceof RichTextBoxElement) {
        pendingRichTextFootnotes.delete(owner);
        pendingRichTextStyles.delete(owner);
      }
      rejectPaste();
    },
  };

  provide(richTextFootnoteControllerKey, controller);
  function commitRichTextFootnotes(
    element: RichTextBoxElement,
    newValues: Partial<RichTextBoxElement>,
  ) {
    const commands = planRichTextFootnoteUpdate(
      workspace.value.score,
      element,
      newValues,
      pendingRichTextFootnotes.get(element) ?? [],
    );
    const paragraphStyles = pendingRichTextStyles.get(element);
    if (paragraphStyles !== undefined) {
      commands.unshift(
        new CommandFactory<Score>().create('update-properties', {
          target: workspace.value.score,
          newValues: { paragraphStyles },
        }),
      );
    }
    workspace.value.commandService.executeAsBatch(commands);
    pendingRichTextFootnotes.delete(element);
    pendingRichTextStyles.delete(element);
  }
  return { commitRichTextFootnotes };
}
