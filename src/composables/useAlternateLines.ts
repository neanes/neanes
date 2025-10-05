import { AlternateLineElement, NoteElement } from '@/models/Element';
import { useEditorStore } from '@/stores/useEditorStore';

import { useCommandFactories } from './useCommandFactories';
import { useSave } from './useSave';

export function useAlternateLines() {
  const editor = useEditorStore();
  const { alternateLineCommandFactory } = useCommandFactories();
  const { save } = useSave();

  function removeAlternateLine(
    note: NoteElement,
    annotation: AlternateLineElement,
    noHistory: boolean = false,
  ) {
    editor.commandService.execute(
      alternateLineCommandFactory.create('remove-from-collection', {
        element: annotation,
        collection: note.alternateLines,
      }),
      noHistory,
    );

    editor.selectedWorkspace.selectedAlternateLineElement = null;

    save();
  }
  return { removeAlternateLine };
}
