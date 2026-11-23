import i18next from 'i18next';
import { inject } from 'vue';

import { editorPreferencesKey } from '@/injectionKeys';
import type { EditorPreferences } from '@/models/EditorPreferences';
import {
  type QuoteStyle,
  quoteStyleForLanguage,
  smartQuote,
} from '@/utils/smartQuotes';

// Returns the quote style to type with, or null when smart quotes are off.
export function getSmartQuoteStyle(
  preferences: EditorPreferences,
): QuoteStyle | null {
  if (!preferences.smartQuotes) {
    return null;
  }

  return (
    preferences.quoteStyle || quoteStyleForLanguage(i18next.language) || 'en'
  );
}

function textBeforeCaret(el: HTMLElement) {
  if (el instanceof HTMLTextAreaElement) {
    return el.value.slice(0, el.selectionStart);
  }

  const selection = getSelection();

  if (selection == null || selection.rangeCount === 0) {
    return '';
  }

  const caret = selection.getRangeAt(0);
  const range = document.createRange();
  range.selectNodeContents(el);
  range.setEnd(caret.startContainer, caret.startOffset);

  return range.toString();
}

function isCaretCollapsed(el: HTMLElement) {
  return el instanceof HTMLTextAreaElement
    ? el.selectionStart === el.selectionEnd
    : getSelection()?.isCollapsed === true;
}

function selectCharacterBeforeCaret(el: HTMLElement) {
  if (el instanceof HTMLTextAreaElement) {
    el.setSelectionRange(el.selectionStart - 1, el.selectionStart);
  } else {
    getSelection()?.modify('extend', 'backward', 'character');
  }
}

// Returns a beforeinput handler for plain text fields. It converts typed
// straight quotes, and Backspace right after a conversion restores the
// straight quote.
export function useSmartQuotes() {
  // The export and automation renderers (src/export.ts, src/automation.ts)
  // mount score pages without TheEditor, so no preferences are provided.
  const editorPreferences = inject(editorPreferencesKey, undefined);
  let lastConversion: {
    target: HTMLElement;
    caret: number;
    original: string;
  } | null = null;

  return (event: InputEvent) => {
    const target = event.target as HTMLElement;
    const previous = lastConversion;
    lastConversion = null;

    if (editorPreferences == null || event.isComposing) {
      return;
    }

    if (event.inputType === 'deleteContentBackward') {
      if (
        previous?.target === target &&
        isCaretCollapsed(target) &&
        textBeforeCaret(target).length === previous.caret
      ) {
        event.preventDefault();
        selectCharacterBeforeCaret(target);
        // insertText keeps the native undo stack and fires the input event.
        document.execCommand('insertText', false, previous.original);
      }
      return;
    }

    if (event.inputType !== 'insertText' || event.data == null) {
      return;
    }

    const style = getSmartQuoteStyle(editorPreferences.value);

    if (style == null) {
      return;
    }

    const before = textBeforeCaret(target);
    const quote = smartQuote(event.data, before, style);

    if (quote === undefined) {
      return;
    }

    event.preventDefault();
    document.execCommand('insertText', false, quote);
    lastConversion = {
      target,
      caret: before.length + quote.length,
      original: event.data,
    };
  };
}
