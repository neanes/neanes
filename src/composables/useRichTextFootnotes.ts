import type { Editor } from 'ckeditor5';
import { type InjectionKey, provide, type Ref } from 'vue';

import type { RichTextBoxContentKey } from '@/models/Element';
import type { ScoreElement } from '@/models/Element';
import { RichTextBoxElement } from '@/models/Element';
import type { Footnote } from '@/models/Footnote';
import { cloneInitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
import {
  createDefaultParagraphStyles,
  type ParagraphStyle,
} from '@/models/ParagraphStyle';
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
import { needsFootnoteSettlement } from '@/services/rendering/workspaceLayoutSettlement';
import {
  activeRichTextContentKeys,
  FOOTNOTE_ELEMENT,
  richTextFootnoteIds,
} from '@/services/RichTextFootnotes';
import { SaveService } from '@/services/SaveService';
import { collectClipboardInitialMartyriaStylesFromElements } from '@/utils/clipboardInitialMartyriaStyles';
import {
  collectClipboardParagraphStyleIdsFromElements,
  collectClipboardParagraphStylesFromElements,
} from '@/utils/clipboardParagraphStyles';
import {
  type ClipboardStyles,
  getScoreStyleAdditions,
  importClipboardStyles,
  partitionStylesByUse,
  rewriteClipboardElementStyleReferences,
  type ScoreStyles,
} from '@/utils/clipboardStyles';

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
  /** The custom style a copied embedded mode key names, or null. */
  copyInitialMartyriaStyle(styleId: string): string | null;
  /**
   * The style a pasted embedded mode key names in this score: the copied
   * style, reused or imported, or null when it follows the score's default.
   */
  pasteInitialMartyriaStyle(
    owner: object,
    styleId: string,
    payload: string | undefined,
  ): string | null;
}

interface InitialMartyriaStyleClipboard {
  initialMartyriaStyles: ReturnType<
    typeof SaveService.SaveInitialMartyriaStyle
  >[];
  paragraphStyles: ReturnType<typeof SaveService.SaveParagraphStyle>[];
  paragraphStyleIds: string[];
}

// Clipboard styles load as file styles do, so a payload from another version
// or app cannot add a style this version does not support. Payloads copied
// before styles traveled with footnotes have none.
function loadClipboardInitialMartyriaStyles(
  saved: unknown,
  sourceParagraphStyles: ParagraphStyle[],
) {
  return Array.isArray(saved)
    ? SaveService.LoadInitialMartyriaStyles_v1(saved, sourceParagraphStyles)
    : [];
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
  // Styles imported by pasting footnotes or embedded mode keys into a box,
  // added to the score with the first update of the box that uses them.
  const pendingRichTextStyles = new WeakMap<RichTextBoxElement, ScoreStyles>();
  const pendingRichTextFootnotes = new WeakMap<
    RichTextBoxElement,
    Footnote[]
  >();
  // Boxes with a pasted footnote, as opposed to only an inserted one.
  const pendingFootnotePastes = new WeakSet<RichTextBoxElement>();
  function hasPendingFootnotePaste(
    owner: RichTextBoxElement,
    updates: Partial<RichTextBoxElement>,
  ) {
    if (!pendingFootnotePastes.has(owner)) {
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
    pendingFootnotePastes.delete(owner);
  }

  /*
   * Imports a paste's styles against the score and the styles already staged
   * for the box, and stages the ones the score lacks.
   */
  function importStylesForBox(
    owner: RichTextBoxElement,
    clipboard: ClipboardStyles,
  ) {
    const score = workspace.value.score;
    const staged = pendingRichTextStyles.get(owner);
    const result = importClipboardStyles(clipboard, {
      paragraphStyles: [
        ...score.paragraphStyles,
        ...(staged?.paragraphStyles ?? []),
      ],
      initialMartyriaStyles: [
        ...score.initialMartyriaStyles,
        ...(staged?.initialMartyriaStyles ?? []),
      ],
    });
    pendingRichTextStyles.set(owner, {
      paragraphStyles: [
        ...(staged?.paragraphStyles ?? []),
        ...result.imported.paragraphStyles,
      ],
      initialMartyriaStyles: [
        ...(staged?.initialMartyriaStyles ?? []),
        ...result.imported.initialMartyriaStyles,
      ],
    });
    return result;
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
        pendingFootnotePastes.has(owner) &&
        needsFootnoteSettlement(workspace.value.score)
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
        initialMartyriaStyles:
          collectClipboardInitialMartyriaStylesFromElements(
            body.staff.elements,
            workspace.value.score.initialMartyriaStyles,
          ).map((style) => SaveService.SaveInitialMartyriaStyle(style)),
      });
    },
    paste(owner, payload) {
      // Publishing the old HTML during a deferred paste can echo it back
      // into CKEditor after insertion and overwrite the staged marker.
      if (!needsFootnoteSettlement(workspace.value.score)) {
        flush(workspace.value);
      }
      const saved = JSON.parse(payload) as {
        body: ReturnType<typeof SaveService.SaveFootnote>;
        paragraphStyles: ReturnType<typeof SaveService.SaveParagraphStyle>[];
        initialMartyriaStyles?: unknown;
      };
      const sourceStyles = saved.paragraphStyles.map((style) =>
        SaveService.LoadParagraphStyle_v1(style),
      );
      // The payload carries every paragraph style of the source score.
      const clipboardInitialMartyriaStyles = loadClipboardInitialMartyriaStyles(
        saved.initialMartyriaStyles,
        sourceStyles,
      );
      const copy = cloneFootnote(
        SaveService.LoadFootnote_v1(
          saved.body,
          workspace.value.score.pageSetup,
          clipboardInitialMartyriaStyles,
        ),
      );
      if (
        copy.staff.elements.some(
          (element) => elementFootnoteIds(element).length > 0,
        )
      ) {
        throw new Error('NESTED_FOOTNOTES_UNSUPPORTED');
      }
      const importedStyles = importStylesForBox(owner, {
        paragraphStyles: collectClipboardParagraphStylesFromElements(
          copy.staff.elements,
          clipboardInitialMartyriaStyles,
          sourceStyles,
        ),
        paragraphStyleIds: collectClipboardParagraphStyleIdsFromElements(
          copy.staff.elements,
          clipboardInitialMartyriaStyles,
        ),
        initialMartyriaStyles: clipboardInitialMartyriaStyles,
      });
      copy.staff.elements.forEach((element) =>
        rewriteClipboardElementStyleReferences(element, importedStyles),
      );
      pendingFootnotePastes.add(owner);
      pendingRichTextFootnotes.set(owner, [
        ...(pendingRichTextFootnotes.get(owner) ?? []),
        copy,
      ]);
      return copy.id;
    },
    reject(owner) {
      if (
        owner instanceof RichTextBoxElement &&
        !needsFootnoteSettlement(workspace.value.score)
      ) {
        clearPendingFootnotes(owner);
      }
      rejectPaste();
    },
    copyInitialMartyriaStyle(styleId) {
      const score = workspace.value.score;
      const style = score.initialMartyriaStyles.find(
        (candidate) => candidate.id === styleId,
      );
      if (style === undefined) {
        return null;
      }
      const initialMartyriaStyles = [cloneInitialMartyriaStyle(style)];
      const clipboard: InitialMartyriaStyleClipboard = {
        initialMartyriaStyles: initialMartyriaStyles.map((initialStyle) =>
          SaveService.SaveInitialMartyriaStyle(initialStyle),
        ),
        paragraphStyles: collectClipboardParagraphStylesFromElements(
          [],
          initialMartyriaStyles,
          score.paragraphStyles,
        ).map((paragraphStyle) =>
          SaveService.SaveParagraphStyle(paragraphStyle),
        ),
        paragraphStyleIds: collectClipboardParagraphStyleIdsFromElements(
          [],
          initialMartyriaStyles,
        ),
      };
      return JSON.stringify(clipboard);
    },
    pasteInitialMartyriaStyle(owner, styleId, payload) {
      const score = workspace.value.score;
      const staged =
        owner instanceof RichTextBoxElement
          ? pendingRichTextStyles.get(owner)
          : undefined;
      const existing = [
        ...score.initialMartyriaStyles,
        ...(staged?.initialMartyriaStyles ?? []),
      ].some(({ id }) => id === styleId)
        ? styleId
        : null;
      if (payload === undefined || !(owner instanceof RichTextBoxElement)) {
        return existing;
      }
      try {
        const clipboard = JSON.parse(payload) as InitialMartyriaStyleClipboard;
        const clipboardParagraphStyles = clipboard.paragraphStyles.map(
          (style) => SaveService.LoadParagraphStyle_v1(style),
        );
        // The payload carries only the source's custom paragraph styles; the
        // built-in ones exist in every score.
        const { initialMartyriaStyleIdRemap } = importStylesForBox(owner, {
          paragraphStyles: clipboardParagraphStyles,
          paragraphStyleIds: clipboard.paragraphStyleIds,
          initialMartyriaStyles: loadClipboardInitialMartyriaStyles(
            clipboard.initialMartyriaStyles,
            [...createDefaultParagraphStyles(), ...clipboardParagraphStyles],
          ),
        });
        return initialMartyriaStyleIdRemap.get(styleId) ?? existing;
      } catch {
        return existing;
      }
    },
  };

  provide(richTextFootnoteControllerKey, controller);
  function commitRichTextFootnotes(
    element: RichTextBoxElement,
    newValues: Partial<RichTextBoxElement>,
  ) {
    const staged = pendingRichTextFootnotes.get(element) ?? [];
    const next = Object.assign(new RichTextBoxElement(), element, newValues);
    let added: Footnote[] = [];
    let remaining: Footnote[] = [];
    if (staged.length > 0) {
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
    // A staged style goes in once the box uses it: through a pasted footnote
    // it now holds, or an embedded mode key. The rest stay staged, since
    // CKEditor can still redo the paste that brought them.
    const stagedStyles = pendingRichTextStyles.get(element);
    if (stagedStyles !== undefined) {
      const { used, unused } = partitionStylesByUse(
        [next, ...added.flatMap((body) => body.staff.elements)],
        stagedStyles,
      );
      const scoreValues = getScoreStyleAdditions(workspace.value.score, used);
      if (scoreValues != null) {
        commands.unshift(
          new CommandFactory<Score>().create('update-properties', {
            target: workspace.value.score,
            newValues: scoreValues,
          }),
        );
      }
      if (
        unused.paragraphStyles.length === 0 &&
        unused.initialMartyriaStyles.length === 0
      ) {
        pendingRichTextStyles.delete(element);
      } else {
        pendingRichTextStyles.set(element, unused);
      }
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
