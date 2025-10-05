import { useEditorStore } from '@/stores/useEditorStore';

import { useEditing } from './useEditing';
import { useSave } from './useSave';
import { useSelection } from './useSelection';

export function useHistory() {
  const editor = useEditorStore();
  const editing = useEditing();
  const { setSelectedElement } = useSelection();
  const { save } = useSave();

  function onFileMenuUndo() {
    const currentIndex = editor.selectedElementIndex;

    const textBoxDefaultFontFamilyPrevious =
      editor.score.pageSetup.textBoxDefaultFontFamily;
    const textBoxDefaultFontSizePrevious =
      editor.score.pageSetup.textBoxDefaultFontSize;

    editor.commandService.undo();

    // TODO this may be overkill, but the alternative is putting in place
    // an event system to only refresh on certain undo actions
    editing.refreshStaffLyrics();

    if (currentIndex > -1) {
      // If the selected element was removed during the undo process, choose a new one
      const clampedIndex = Math.min(currentIndex, editor.elements.length - 1);

      if (editor.selectedElement !== editor.elements[clampedIndex]) {
        setSelectedElement(editor.elements[clampedIndex]);
      }

      // Undo/redo could affect the note display in the neume toolbar (among other things),
      // so we force a refresh here
      editor.elements[clampedIndex].keyHelper++;
    }

    if (
      textBoxDefaultFontFamilyPrevious !=
        editor.score.pageSetup.textBoxDefaultFontFamily ||
      textBoxDefaultFontSizePrevious !=
        editor.score.pageSetup.textBoxDefaultFontSize
    ) {
      editing.recalculateRichTextBoxHeights();
      editing.recalculateTextBoxHeights();
    }

    save();
  }

  function onFileMenuRedo() {
    const currentIndex = editor.selectedElementIndex;

    const textBoxDefaultFontFamilyPrevious =
      editor.score.pageSetup.textBoxDefaultFontFamily;
    const textBoxDefaultFontSizePrevious =
      editor.score.pageSetup.textBoxDefaultFontSize;

    editor.commandService.redo();

    // TODO this may be overkill, but the alternative is putting in place
    // an event system to only refresh on certain undo actions
    editing.refreshStaffLyrics();

    if (currentIndex > -1) {
      // If the selected element was removed during the redo process, choose a new one
      const clampedIndex = Math.min(currentIndex, editor.elements.length - 1);

      if (editor.selectedElement !== editor.elements[clampedIndex]) {
        setSelectedElement(editor.elements[clampedIndex]);
      }

      // Undo/redo could affect the note display in the neume toolbar (among other things),
      // so we force a refresh here
      editor.elements[clampedIndex].keyHelper++;
    }

    if (
      textBoxDefaultFontFamilyPrevious !=
        editor.score.pageSetup.textBoxDefaultFontFamily ||
      textBoxDefaultFontSizePrevious !=
        editor.score.pageSetup.textBoxDefaultFontSize
    ) {
      editing.recalculateRichTextBoxHeights();
      editing.recalculateTextBoxHeights();
    }

    save();
  }

  return { onFileMenuRedo, onFileMenuUndo };
}
