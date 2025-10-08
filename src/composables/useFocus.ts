import { useEditorStore } from '@/stores/useEditorStore';

export function useFocus() {
  const editor = useEditorStore();

  function blurActiveElement() {
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    return activeElement;
  }

  function focusElement(element: Element | null) {
    if (element instanceof HTMLElement) {
      element.focus();
    }
  }

  function focusLyrics(index: number, selectAll: boolean = false) {
    editor.lyricRefs[index].focus(selectAll);
  }

  function isTextInputFocused() {
    return (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement ||
      (document.activeElement instanceof HTMLElement &&
        document.activeElement.isContentEditable)
    );
  }

  return {
    blurActiveElement,
    focusElement,
    focusLyrics,
    isTextInputFocused,
  };
}
