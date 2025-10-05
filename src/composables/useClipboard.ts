import { inject } from 'vue';

import {
  DropCapElement,
  ElementType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  ScoreElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import { EntryMode } from '@/models/EntryMode';
import { NeumeCombination } from '@/models/NeumeCommonCombinations';
import { Command } from '@/services/history/CommandService';
import { IIpcService } from '@/services/ipc/IIpcService';
import { IpcService } from '@/services/ipc/IpcService';
import { useEditorStore } from '@/stores/useEditorStore';
import { shallowEquals } from '@/utils/shallowEquals';

import { useCommandFactories } from './useCommandFactories';
import { useEditing } from './useEditing';
import { useFocus } from './useFocus';
import { useNavigation } from './useNavigation';
import { useSave } from './useSave';
import { useSelection } from './useSelection';

export function useClipboard() {
  const ipcService = inject<IIpcService>('ipcService', new IpcService());
  const editor = useEditorStore();
  const navigation = useNavigation();
  const editing = useEditing();
  const { isTextInputFocused } = useFocus();
  const { save } = useSave();
  const { setSelectedElement, isSelected, getNormalizedSelectionRange } =
    useSelection();

  const {
    scoreElementCommandFactory,
    noteElementCommandFactory,
    martyriaCommandFactory,
    tempoCommandFactory,
    dropCapCommandFactory,
    modeKeyCommandFactory,
    textBoxCommandFactory,
  } = useCommandFactories();

  function onCutScoreElements() {
    if (editor.selectionRange != null) {
      const start = Math.min(
        editor.selectionRange.start,
        editor.selectionRange.end,
      );

      const elementsToCut = editor.elements.filter(
        (x) => x.elementType != ElementType.Empty && isSelected(x),
      );

      editor.clipboard = elementsToCut.map((x) => x.clone());

      editor.commandService.executeAsBatch(
        elementsToCut.map((element) =>
          scoreElementCommandFactory.create('remove-from-collection', {
            element,
            collection: editor.elements,
          }),
        ),
      );

      editing.refreshStaffLyrics();

      setSelectedElement(
        editor.elements[Math.min(start, editor.elements.length - 1)],
      );

      save();
    } else if (
      editor.selectedElement != null &&
      editor.selectedElement.elementType !== ElementType.Empty
    ) {
      const currentIndex = editor.selectedElementIndex;

      editor.clipboard = [editor.selectedElement.clone()];

      editing.removeScoreElement(editor.selectedElement);

      setSelectedElement(
        editor.elements[Math.min(currentIndex, editor.elements.length - 1)],
      );

      save();
    }
  }

  function onCopyScoreElements() {
    if (editor.selectionRange != null) {
      editor.clipboard = editor.elements
        .filter((x) => x.elementType != ElementType.Empty && isSelected(x))
        .map((x) => x.clone());
    } else if (
      editor.selectedElement != null &&
      editor.selectedElement.elementType !== ElementType.Empty
    ) {
      editor.clipboard = [editor.selectedElement.clone()];
    }
  }

  function onPasteScoreElements(includeLyrics: boolean) {
    if (editor.clipboard.length > 0 && editor.selectedElement != null) {
      switch (editor.entryMode) {
        case EntryMode.Insert:
          onPasteScoreElementsInsert(includeLyrics);
          break;
        case EntryMode.Auto:
          onPasteScoreElementsAuto(includeLyrics);
          break;
        case EntryMode.Edit:
          onPasteScoreElementsEdit(includeLyrics);
          break;
      }
    }
  }

  function onPasteScoreElementsInsert(includeLyrics: boolean) {
    if (editor.selectedElement == null || editor.clipboard.length === 0) {
      return;
    }

    const insertAtIndex = editing.isLastElement(editor.selectedElement)
      ? editor.selectedElementIndex
      : editor.selectedElementIndex + 1;

    const newElements = editor.clipboard.map((x) => x.clone({ includeLyrics }));

    editing.addScoreElements(newElements, insertAtIndex);

    setSelectedElement(newElements.at(-1)!);
    save();
  }

  function onPasteScoreElementsEdit(includeLyrics: boolean) {
    if (editor.selectedElement == null || editor.clipboard.length === 0) {
      return;
    }

    const commands: Command[] = [];

    let currentIndex = editor.selectedElementIndex;

    for (const clipboardElement of editor.clipboard) {
      const currentElement = editor.elements[currentIndex];

      if (currentIndex >= editor.elements.length - 1) {
        commands.push(
          scoreElementCommandFactory.create('add-to-collection', {
            elements: [clipboardElement.clone({ includeLyrics })],
            collection: editor.elements,
            insertAtIndex: currentIndex,
          }),
        );
      } else {
        if (currentElement.elementType === clipboardElement.elementType) {
          switch (currentElement.elementType) {
            case ElementType.Note:
              if (
                !shallowEquals(
                  (currentElement as NoteElement).getClipboardProperties(
                    includeLyrics,
                  ),
                  (clipboardElement as NoteElement).getClipboardProperties(
                    includeLyrics,
                  ),
                )
              ) {
                commands.push(
                  noteElementCommandFactory.create('update-properties', {
                    target: currentElement as NoteElement,
                    newValues: (
                      clipboardElement as NoteElement
                    ).getClipboardProperties(includeLyrics),
                  }),
                );
              }
              break;
            case ElementType.Tempo:
              if (
                !shallowEquals(
                  (currentElement as TempoElement).getClipboardProperties(),
                  (clipboardElement as TempoElement).getClipboardProperties(),
                )
              ) {
                commands.push(
                  tempoCommandFactory.create('update-properties', {
                    target: currentElement as TempoElement,
                    newValues: (
                      clipboardElement as TempoElement
                    ).getClipboardProperties(),
                  }),
                );
              }
              break;
            case ElementType.Martyria:
              if (
                !shallowEquals(
                  (currentElement as MartyriaElement).getClipboardProperties(),
                  (
                    clipboardElement as MartyriaElement
                  ).getClipboardProperties(),
                )
              ) {
                commands.push(
                  martyriaCommandFactory.create('update-properties', {
                    target: currentElement as MartyriaElement,
                    newValues: (
                      clipboardElement as MartyriaElement
                    ).getClipboardProperties(),
                  }),
                );
              }
              break;
            case ElementType.DropCap:
              if (
                !shallowEquals(
                  (currentElement as DropCapElement).getClipboardProperties(),
                  (clipboardElement as DropCapElement).getClipboardProperties(),
                )
              ) {
                commands.push(
                  dropCapCommandFactory.create('update-properties', {
                    target: currentElement as DropCapElement,
                    newValues: (
                      clipboardElement as DropCapElement
                    ).getClipboardProperties(),
                  }),
                );
              }
              break;
            case ElementType.ModeKey:
              if (
                !shallowEquals(
                  (currentElement as ModeKeyElement).getClipboardProperties(),
                  (clipboardElement as ModeKeyElement).getClipboardProperties(),
                )
              ) {
                commands.push(
                  modeKeyCommandFactory.create('update-properties', {
                    target: currentElement as ModeKeyElement,
                    newValues: (
                      clipboardElement as ModeKeyElement
                    ).getClipboardProperties(),
                  }),
                );
              }
              break;
            case ElementType.TextBox:
              if (
                !shallowEquals(
                  (currentElement as TextBoxElement).getClipboardProperties(),
                  (clipboardElement as TextBoxElement).getClipboardProperties(),
                )
              ) {
                commands.push(
                  textBoxCommandFactory.create('update-properties', {
                    target: currentElement as TextBoxElement,
                    newValues: (
                      clipboardElement as TextBoxElement
                    ).getClipboardProperties(),
                  }),
                );
              }
              break;
          }
        } else {
          commands.push(
            scoreElementCommandFactory.create('replace-element-in-collection', {
              element: clipboardElement.clone(),
              collection: editor.elements,
              replaceAtIndex: currentIndex,
            }),
          );
        }
      }

      currentIndex++;
    }

    if (commands.length > 1) {
      editor.commandService.executeAsBatch(commands);
      editing.refreshStaffLyrics();
    } else if (commands.length === 1) {
      editor.commandService.execute(commands[0]);
      editing.refreshStaffLyrics();
    }

    save();
  }

  function onPasteScoreElementsAuto(includeLyrics: boolean) {
    navigation.moveRight();
    const currentIndex = editor.selectedElementIndex;

    onPasteScoreElementsEdit(includeLyrics);

    // Set the selected element to the last element that was pasted
    setSelectedElement(
      editor.elements[currentIndex + editor.clipboard.length - 1],
    );
  }

  function onFileMenuPasteFormat() {
    const normalizedRange = getNormalizedSelectionRange();

    const commands: Command[] = [];

    if (normalizedRange != null) {
      for (let i = normalizedRange.start; i <= normalizedRange.end; i++) {
        if (editor.elements[i].elementType === editor.formatType) {
          applyCopiedFormat(editor.elements[i], commands);
        }
      }
    } else if (editor.selectedElement != null) {
      applyCopiedFormat(editor.selectedElement, commands);
    }

    if (commands.length > 0) {
      editor.commandService.executeAsBatch(commands);
      save();
    }
  }

  function applyCopiedFormat(element: ScoreElement, commands: Command[]) {
    if (
      element.elementType === ElementType.TextBox &&
      editor.textBoxFormat != null
    ) {
      commands.push(
        textBoxCommandFactory.create('update-properties', {
          target: element as TextBoxElement,
          newValues: editor.textBoxFormat,
        }),
      );
    } else if (
      element.elementType === ElementType.Note &&
      editor.noteFormat != null
    ) {
      commands.push(
        noteElementCommandFactory.create('update-properties', {
          target: element as NoteElement,
          newValues: editor.noteFormat,
        }),
      );
    }
  }

  function onFileMenuCut() {
    if (!isTextInputFocused() && !editor.dialogOpen) {
      onCutScoreElements();
    } else {
      document.execCommand('cut');
    }
  }

  function onFileMenuCopy() {
    if (!isTextInputFocused() && !editor.dialogOpen) {
      onCopyScoreElements();
    } else {
      document.execCommand('copy');
    }
  }

  function onFileMenuCopyFormat() {
    if (editor.selectedElement == null) {
      return;
    }

    if (editor.selectedElement.elementType === ElementType.TextBox) {
      editor.formatType = ElementType.TextBox;
      editor.textBoxFormat = (
        editor.selectedElement as TextBoxElement
      ).cloneFormat();
    } else if (editor.selectedElement.elementType === ElementType.Note) {
      editor.formatType = ElementType.Note;
      editor.noteFormat = (editor.selectedElement as NoteElement).cloneFormat();
    }
  }

  function onFileMenuPaste() {
    if (!isTextInputFocused() && !editor.dialogOpen) {
      onPasteScoreElements(false);
    } else {
      ipcService.paste();
    }
  }

  function onFileMenuPasteWithLyrics() {
    if (!isTextInputFocused() && !editor.dialogOpen) {
      onPasteScoreElements(true);
    } else {
      ipcService.paste();
    }
  }

  // TODO this may actually belong in a neume combinations composable
  function addNeumeCombination(combo: NeumeCombination) {
    const backup = editor.clipboard.slice();
    editor.clipboard = combo.elements;
    onPasteScoreElements(false);

    editor.clipboard = backup;
  }

  return {
    onCutScoreElements,
    onCopyScoreElements,
    onPasteScoreElements,
    onFileMenuPasteFormat,
    onFileMenuPasteWithLyrics,
    onFileMenuPaste,
    onFileMenuCopy,
    onFileMenuCut,
    onFileMenuCopyFormat,
    addNeumeCombination,
  };
}
