export function getCursorPosition() {
  const selection = window.getSelection();

  if (selection != null) {
    const range = selection.getRangeAt(0);
    if (range.startOffset === range.endOffset) {
      return selection.getRangeAt(0).startOffset;
    }
  }

  return null;
}
