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
import { needsFootnoteSlotSettlement } from '@/services/rendering/workspaceLayoutSettlement';
import {
  activeRichTextContentKeys,
  FOOTNOTE_ELEMENT,
  richTextFootnoteIds,
} from '@/services/RichTextFootnotes';
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
  function hasPendingFootnotePaste(
    owner: RichTextBoxElement,
    updates: Partial<RichTextBoxElement>,
  ) {
    if (!pendingRichTextStyles.has(owner)) {
      return false;
    }
    const staged = pendingRichTextFootnotes.get(owner)!;
    return activeRichTextContentKeys(owner).some((key) =>
      richTextFootnoteIds(updates[key] ?? owner[key]).some((id) =>
        staged.some((body) => body.id === id),
      ),
    );
  }

  function clearPendingFootnotes(owner: RichTextBoxElement) {
    pendingRichTextFootnotes.delete(owner);
    pendingRichTextStyles.delete(owner);
  }

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
      pendingRichTextFootnotes.set(owner, [
        ...(pendingRichTextFootnotes.get(owner) ?? []),
        body,
      ]);
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
      const updates = { [key]: html };
      if (
        pendingRichTextStyles.has(owner) &&
        needsFootnoteSlotSettlement(workspace.value.score)
      ) {
        return;
      }
      updateRichTextBox(owner, updates);
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
      // Publishing the old HTML during a deferred paste can echo it back
      // into CKEditor after insertion and overwrite the staged marker.
      if (!needsFootnoteSlotSettlement(workspace.value.score)) {
        flush(workspace.value);
      }
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
      const stagedStyles = pendingRichTextStyles.get(owner) ?? [];
      const currentStyles = [
        ...workspace.value.score.paragraphStyles,
        ...stagedStyles,
      ];
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
      pendingRichTextStyles.set(owner, [
        ...stagedStyles,
        ...importedParagraphStyles,
      ]);
      pendingRichTextFootnotes.set(owner, [
        ...(pendingRichTextFootnotes.get(owner) ?? []),
        copy,
      ]);
      return copy.id;
    },
    reject(owner) {
      if (
        owner instanceof RichTextBoxElement &&
        !needsFootnoteSlotSettlement(workspace.value.score)
      ) {
        clearPendingFootnotes(owner);
      }
      rejectPaste();
    },
  };

  provide(richTextFootnoteControllerKey, controller);
  function commitRichTextFootnotes(
    element: RichTextBoxElement,
    newValues: Partial<RichTextBoxElement>,
  ) {
    const stagedStyles = pendingRichTextStyles.get(element) ?? [];
    const staged = pendingRichTextFootnotes.get(element) ?? [];
    let added: Footnote[] = [];
    let remaining: Footnote[] = [];
    if (staged.length > 0) {
      const next = Object.assign(new RichTextBoxElement(), element, newValues);
      const referenced = new Set(elementFootnoteIds(next));
      added = staged.filter((body) => referenced.has(body.id));
      remaining = staged.filter((body) => !referenced.has(body.id));
    }
    const commands = planRichTextFootnoteUpdate(
      workspace.value.score,
      element,
      newValues,
      added,
    );
    const score = workspace.value.score;
    const importedStyles = stagedStyles.filter(
      (style) => !score.paragraphStyles.some(({ id }) => id === style.id),
    );
    if (importedStyles.length > 0 && added.length > 0) {
      commands.unshift(
        new CommandFactory<Score>().create('update-properties', {
          target: score,
          newValues: {
            paragraphStyles: [...score.paragraphStyles, ...importedStyles],
          },
        }),
      );
    }
    workspace.value.commandService.executeAsBatch(commands);
    // CKEditor can still redo a paste after blur commits unrelated edits.
    if (remaining.length > 0) {
      pendingRichTextFootnotes.set(element, remaining);
    } else {
      clearPendingFootnotes(element);
    }
  }
  return { commitRichTextFootnotes, hasPendingFootnotePaste };
}
