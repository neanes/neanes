import type { Editor } from 'ckeditor5';
import { type InjectionKey, provide, type Ref } from 'vue';

import type { RichTextBoxContentKey } from '@/models/Element';
import type { ScoreElement } from '@/models/Element';
import { RichTextBoxElement } from '@/models/Element';
import type { Footnote } from '@/models/Footnote';
import { isBuiltInInitialMartyriaStyleId } from '@/models/InitialMartyriaBuiltInStyles';
import {
  cloneInitialMartyriaStyle,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
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
import {
  collectClipboardInitialMartyriaStylesFromElements,
  resolveClipboardInitialMartyriaStyles,
  rewriteClipboardElementInitialMartyriaStyleId,
} from '@/utils/clipboardInitialMartyriaStyles';
import {
  collectClipboardParagraphStyleIdsFromElements,
  collectClipboardParagraphStylesFromElements,
  resolveClipboardParagraphStyles,
  rewriteClipboardElementParagraphStyleIds,
} from '@/utils/clipboardParagraphStyles';
import { getEmbeddedModeKeys } from '@/utils/richTextModeKeys';

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

interface StagedModeKeyStyles {
  initialMartyriaStyles: InitialMartyriaStyle[];
  paragraphStyles: ParagraphStyle[];
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

// Each style once, leaving out those the score already has.
function withoutExistingStyles<T extends { id: string }>(
  candidates: T[],
  existing: T[],
) {
  const ids = new Set(existing.map(({ id }) => id));
  return candidates.filter((style) => {
    if (ids.has(style.id)) {
      return false;
    }
    ids.add(style.id);
    return true;
  });
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
  const pendingRichTextInitialMartyriaStyles = new WeakMap<
    RichTextBoxElement,
    InitialMartyriaStyle[]
  >();
  // Styles imported by pasting embedded mode keys, added to the score with
  // the first update of the box that uses them.
  const pendingModeKeyStyles = new WeakMap<
    RichTextBoxElement,
    StagedModeKeyStyles
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
    pendingRichTextInitialMartyriaStyles.delete(owner);
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
      const stagedStyles = pendingRichTextStyles.get(owner) ?? [];
      const currentStyles = [
        ...workspace.value.score.paragraphStyles,
        ...stagedStyles,
      ];
      const { importedParagraphStyles, styleIdRemap } =
        resolveClipboardParagraphStyles(
          collectClipboardParagraphStylesFromElements(
            copy.staff.elements,
            clipboardInitialMartyriaStyles,
            sourceStyles,
          ),
          currentStyles,
          collectClipboardParagraphStyleIdsFromElements(
            copy.staff.elements,
            clipboardInitialMartyriaStyles,
          ),
        );
      const paragraphStyles = [...currentStyles, ...importedParagraphStyles];
      const stagedInitialMartyriaStyles =
        pendingRichTextInitialMartyriaStyles.get(owner) ?? [];
      const currentInitialMartyriaStyles = [
        ...workspace.value.score.initialMartyriaStyles,
        ...stagedInitialMartyriaStyles,
      ];
      const { importedInitialMartyriaStyles, initialMartyriaStyleIdRemap } =
        resolveClipboardInitialMartyriaStyles(
          clipboardInitialMartyriaStyles,
          currentInitialMartyriaStyles,
          paragraphStyles,
          styleIdRemap,
        );
      const initialMartyriaStyles = [
        ...currentInitialMartyriaStyles,
        ...importedInitialMartyriaStyles,
      ];
      copy.staff.elements.forEach((element) => {
        rewriteClipboardElementParagraphStyleIds(
          element,
          paragraphStyles,
          styleIdRemap,
        );
        rewriteClipboardElementInitialMartyriaStyleId(
          element,
          initialMartyriaStyles,
          initialMartyriaStyleIdRemap,
        );
      });
      pendingRichTextStyles.set(owner, [
        ...stagedStyles,
        ...importedParagraphStyles,
      ]);
      pendingRichTextInitialMartyriaStyles.set(owner, [
        ...stagedInitialMartyriaStyles,
        ...importedInitialMartyriaStyles,
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
      if (isBuiltInInitialMartyriaStyleId(styleId)) {
        return styleId;
      }
      const score = workspace.value.score;
      const staged =
        owner instanceof RichTextBoxElement
          ? pendingModeKeyStyles.get(owner)
          : undefined;
      const currentInitialMartyriaStyles = [
        ...score.initialMartyriaStyles,
        ...(staged?.initialMartyriaStyles ?? []),
      ];
      const existing = currentInitialMartyriaStyles.some(
        ({ id }) => id === styleId,
      )
        ? styleId
        : null;
      if (payload === undefined || !(owner instanceof RichTextBoxElement)) {
        return existing;
      }
      try {
        const clipboard = JSON.parse(payload) as InitialMartyriaStyleClipboard;
        const currentParagraphStyles = [
          ...score.paragraphStyles,
          ...(staged?.paragraphStyles ?? []),
        ];
        const clipboardParagraphStyles = clipboard.paragraphStyles.map(
          (style) => SaveService.LoadParagraphStyle_v1(style),
        );
        // The payload carries only the source's custom paragraph styles; the
        // built-in ones exist in every score.
        const clipboardInitialMartyriaStyles =
          loadClipboardInitialMartyriaStyles(clipboard.initialMartyriaStyles, [
            ...createDefaultParagraphStyles(),
            ...clipboardParagraphStyles,
          ]);
        const { importedParagraphStyles, styleIdRemap } =
          resolveClipboardParagraphStyles(
            clipboardParagraphStyles,
            currentParagraphStyles,
            clipboard.paragraphStyleIds,
          );
        const { importedInitialMartyriaStyles, initialMartyriaStyleIdRemap } =
          resolveClipboardInitialMartyriaStyles(
            clipboardInitialMartyriaStyles,
            currentInitialMartyriaStyles,
            [...currentParagraphStyles, ...importedParagraphStyles],
            styleIdRemap,
          );
        pendingModeKeyStyles.set(owner, {
          initialMartyriaStyles: [
            ...(staged?.initialMartyriaStyles ?? []),
            ...importedInitialMartyriaStyles,
          ],
          paragraphStyles: [
            ...(staged?.paragraphStyles ?? []),
            ...importedParagraphStyles,
          ],
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
    const paragraphStylesToAdd = added.length > 0 ? [...stagedStyles] : [];
    const initialMartyriaStylesToAdd =
      added.length > 0
        ? [...(pendingRichTextInitialMartyriaStyles.get(element) ?? [])]
        : [];
    const stagedModeKeyStyles = pendingModeKeyStyles.get(element);
    if (stagedModeKeyStyles !== undefined) {
      const next = Object.assign(new RichTextBoxElement(), element, newValues);
      const referenced = new Set(
        getEmbeddedModeKeys(next).map((key) => key.initialMartyriaStyleId),
      );
      if (
        stagedModeKeyStyles.initialMartyriaStyles.some(({ id }) =>
          referenced.has(id),
        )
      ) {
        paragraphStylesToAdd.push(...stagedModeKeyStyles.paragraphStyles);
        initialMartyriaStylesToAdd.push(
          ...stagedModeKeyStyles.initialMartyriaStyles,
        );
        pendingModeKeyStyles.delete(element);
      }
    }
    const importedStyles = withoutExistingStyles(
      paragraphStylesToAdd,
      score.paragraphStyles,
    );
    const importedInitialMartyriaStyles = withoutExistingStyles(
      initialMartyriaStylesToAdd,
      score.initialMartyriaStyles,
    );
    const scoreValues: Partial<Score> = {};
    if (importedStyles.length > 0) {
      scoreValues.paragraphStyles = [
        ...score.paragraphStyles,
        ...importedStyles,
      ];
    }
    if (importedInitialMartyriaStyles.length > 0) {
      scoreValues.initialMartyriaStyles = [
        ...score.initialMartyriaStyles,
        ...importedInitialMartyriaStyles,
      ];
    }
    if (Object.keys(scoreValues).length > 0) {
      commands.unshift(
        new CommandFactory<Score>().create('update-properties', {
          target: score,
          newValues: scoreValues,
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
