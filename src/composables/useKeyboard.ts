import { throttle } from 'throttle-debounce';
import { inject, nextTick, onBeforeMount, onMounted } from 'vue';

import DropCap from '@/components/DropCap.vue';
import TextBox from '@/components/TextBox.vue';
import { ElementType, MartyriaElement, NoteElement } from '@/models/Element';
import { EntryMode } from '@/models/EntryMode';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  MeasureNumber,
  QuantitativeNeume,
  TempoSign,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { AudioService, AudioState } from '@/services/audio/AudioService';
import { IIpcService } from '@/services/ipc/IIpcService';
import { IpcService } from '@/services/ipc/IpcService';
import { NeumeKeyboard } from '@/services/NeumeKeyboard';
import { IPlatformService } from '@/services/platform/IPlatformService';
import { PlatformService } from '@/services/platform/PlatformService';
import { useEditorStore } from '@/stores/useEditorStore';
import { TATWEEL } from '@/utils/constants';
import { getCursorPosition } from '@/utils/getCursorPosition';

import { useAudioPlayback } from './useAudioPlayback';
import { useClipboard } from './useClipboard';
import { useEditing } from './useEditing';
import { useFocus } from './useFocus';
import { useHistory } from './useHistory';
import { useNavigation } from './useNavigation';
import { useSave } from './useSave';
import { useScoreExport } from './useScoreExport';
import { useSelection } from './useSelection';

export function useKeyboard() {
  const neumeKeyboard = inject<NeumeKeyboard>(
    'neumeKeyboard',
    new NeumeKeyboard(),
  );

  const ipcService = inject<IIpcService>('ipcService', new IpcService());
  const audioService = inject<AudioService>('audioService', new AudioService());

  const platformService = inject<IPlatformService>(
    'platformService',
    new PlatformService(),
  );

  const editor = useEditorStore();
  const navigation = useNavigation();
  const audioPlayback = useAudioPlayback();
  const editing = useEditing();
  const clipboard = useClipboard();
  const exporting = useScoreExport();
  const history = useHistory();
  const { focusLyrics, isTextInputFocused, blurActiveElement } = useFocus();
  const { setSelectedElement } = useSelection();
  const { save } = useSave();

  const keydownThrottleIntervalMs = 100;

  const moveToPreviousLyricBoxThrottled = throttle(
    keydownThrottleIntervalMs,
    moveToPreviousLyricBox,
  );

  const moveToNextLyricBoxThrottled = throttle(
    keydownThrottleIntervalMs,
    moveToNextLyricBox,
  );

  const moveLeftThrottled = throttle(
    keydownThrottleIntervalMs,
    navigation.moveLeft,
  );

  const moveRightThrottled = throttle(
    keydownThrottleIntervalMs,
    navigation.moveRight,
  );

  const moveSelectionLeftThrottled = throttle(
    keydownThrottleIntervalMs,
    navigation.moveSelectionLeft,
  );

  const moveSelectionRightThrottled = throttle(
    keydownThrottleIntervalMs,
    navigation.moveSelectionRight,
  );

  const deleteSelectedElementThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.deleteSelectedElement,
  );

  const deletePreviousElementThrottled = throttle(
    keydownThrottleIntervalMs,
    deletePreviousElement,
  );

  const onFileMenuUndoThrottled = throttle(
    keydownThrottleIntervalMs,
    history.onFileMenuUndo,
  );

  const onFileMenuRedoThrottled = throttle(
    keydownThrottleIntervalMs,
    history.onFileMenuRedo,
  );

  const onCutScoreElementsThrottled = throttle(
    keydownThrottleIntervalMs,
    clipboard.onCutScoreElements,
  );

  const onCopyScoreElementsThrottled = throttle(
    keydownThrottleIntervalMs,
    clipboard.onCopyScoreElements,
  );

  const onFileMenuCopyAsHtmlThrottled = throttle(
    keydownThrottleIntervalMs,
    exporting.onFileMenuCopyAsHtml,
  );

  const onPasteScoreElementsThrottled = throttle(
    keydownThrottleIntervalMs,
    clipboard.onPasteScoreElements,
  );

  const addQuantitativeNeumeThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.addQuantitativeNeume,
  );

  const addTempoThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.addTempo,
  );

  const addAutoMartyriaThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.addAutoMartyria,
  );

  const setKlasmaThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.setKlasma,
  );
  const setGorgonThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.setGorgon,
  );
  const setFthoraNoteThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.setFthoraNote,
  );
  const setFthoraMartyriaThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.setFthoraMartyria,
  );
  const setMartyriaTempoThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.setMartyriaTempo,
  );
  const setAccidentalThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.setAccidental,
  );
  const setTimeNeumeThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.setTimeNeume,
  );
  const setMeasureNumberThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.setMeasureNumber,
  );
  const setMeasureBarNoteThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.setMeasureBarNote,
  );
  const setMeasureBarMartyriaThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.setMeasureBarMartyria,
  );
  const setIsonThrottled = throttle(keydownThrottleIntervalMs, editing.setIson);
  const setTieThrottled = throttle(keydownThrottleIntervalMs, editing.setTie);
  const setVocalExpressionThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.setVocalExpression,
  );

  const updateMartyriaNoteThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.updateMartyriaNote,
  );

  const updateMartyriaScaleThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.updateMartyriaScale,
  );

  const updateMartyriaAutoThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.updateMartyriaAuto,
  );

  const updateMartyriaAlignRightThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.updateMartyriaAlignRight,
  );

  const updateNoteAndSaveThrottled = throttle(
    keydownThrottleIntervalMs,
    editing.updateNoteAndSave,
  );

  function getLyricLength(element: NoteElement) {
    return editor.lyricRefs[element.index].getInnerText().length;
  }

  function deletePreviousElement() {
    if (editor.selectedWorkspace.selectedAlternateLineElement) {
      const elements =
        editor.selectedWorkspace.selectedAlternateLineElement.elements;
      editing.removeScoreElement(
        elements[editor.elements.length - 1],
        elements,
      );

      return;
    }

    if (
      editor.selectedElement &&
      editor.selectedElementIndex > 0 &&
      navigation.navigableElements.includes(
        editor.elements[editor.selectedElementIndex - 1].elementType,
      )
    ) {
      editing.removeScoreElement(
        editor.elements[editor.selectedElementIndex - 1],
      );

      save();
    }
  }

  function onKeydown(event: KeyboardEvent) {
    // Handle undo / redo
    // See https://github.com/electron/electron/issues/3682.
    if (
      (event.ctrlKey || event.metaKey) &&
      !isTextInputFocused() &&
      !editor.dialogOpen
    ) {
      if (event.code === 'KeyZ') {
        if (platformService.isMac && event.shiftKey) {
          onFileMenuRedoThrottled();
        } else {
          onFileMenuUndoThrottled();
        }
        event.preventDefault();
        return;
      } else if (event.code === 'KeyY') {
        onFileMenuRedoThrottled();
        event.preventDefault();
        return;
      } else if (event.code === 'KeyX') {
        onCutScoreElementsThrottled();
        event.preventDefault();
        return;
      } else if (event.code === 'KeyC') {
        if (event.shiftKey) {
          onFileMenuCopyAsHtmlThrottled();
        } else {
          onCopyScoreElementsThrottled();
        }
        event.preventDefault();
        return;
      } else if (event.code === 'KeyV') {
        const includeLyrics = event.shiftKey;
        onPasteScoreElementsThrottled(includeLyrics);
        event.preventDefault();
        return;
      } else if (event.code === 'KeyI' && !event.shiftKey) {
        switch (editor.entryMode) {
          case EntryMode.Auto:
            editor.selectedWorkspace.entryMode = EntryMode.Insert;
            break;
          case EntryMode.Insert:
            editor.selectedWorkspace.entryMode = EntryMode.Edit;
            break;
          case EntryMode.Edit:
            editor.selectedWorkspace.entryMode = EntryMode.Auto;
            break;
        }
        return;
      } else if (event.code === 'KeyU' && !event.shiftKey) {
        switch (editor.entryMode) {
          case EntryMode.Auto:
            editor.selectedWorkspace.entryMode = EntryMode.Edit;
            break;
          case EntryMode.Edit:
            editor.selectedWorkspace.entryMode = EntryMode.Insert;
            break;
          case EntryMode.Insert:
            editor.selectedWorkspace.entryMode = EntryMode.Auto;
            break;
        }
        return;
      }
    }

    if (platformService.isMac && isTextInputFocused() && !editor.dialogOpen) {
      onKeydownMac(event);
    }

    if (editor.selectedLyrics != null) {
      return onKeydownLyrics(event);
    }

    if (editor.selectedElement?.elementType === ElementType.DropCap) {
      return onKeydownDropCap(event);
    }

    if (editor.selectedElement?.elementType === ElementType.TextBox) {
      return onKeydownTextBox(event);
    }

    if (!isTextInputFocused() && !editor.dialogOpen) {
      return onKeydownNeume(event);
    }
  }

  function onKeydownNeume(event: KeyboardEvent) {
    let handled = false;

    if (event.shiftKey) {
      switch (event.code) {
        case 'ArrowLeft':
          moveSelectionLeftThrottled();
          handled = true;
          break;
        case 'ArrowRight':
          moveSelectionRightThrottled();
          handled = true;
          break;
      }
    } else {
      switch (event.code) {
        case 'ArrowLeft':
          if (!editor.rtl) {
            moveLeftThrottled();
          } else {
            moveRightThrottled();
          }
          handled = true;
          break;
        case 'ArrowRight':
          if (!editor.rtl) {
            moveRightThrottled();
          } else {
            moveLeftThrottled();
          }
          handled = true;
          break;
        case 'ArrowDown':
          if (
            (event.ctrlKey || event.metaKey) &&
            editor.selectedElement?.elementType === ElementType.Note
          ) {
            const index = editor.selectedElementIndex;

            focusLyrics(index, true);

            // Select All doesn't work until after the lyrics have been selected,
            // hence we call focus lyrics twice
            nextTick(() => {
              focusLyrics(index, true);
            });

            handled = true;
          }
          break;
        case 'Space':
          if (!event.repeat) {
            if (audioService.state === AudioState.Stopped || event.ctrlKey) {
              audioPlayback.playAudio();
            } else {
              audioPlayback.pauseAudio();
            }
            handled = true;
          }
          break;
        case 'Backspace':
          handled = true;
          deletePreviousElementThrottled();
          break;
        case 'Delete':
          handled = true;
          deleteSelectedElementThrottled();
          break;
      }
    }

    if (
      editor.selectedElement != null &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      if (neumeKeyboard.isModifier(event.code)) {
        editor.keyboardModifier = event.code;
        handled = true;
      }

      const quantitativeMapping = neumeKeyboard.findQuantitativeMapping(
        event,
        editor.keyboardModifier,
      );

      if (quantitativeMapping != null) {
        handled = true;

        if (quantitativeMapping.acceptsLyricsOption != null) {
          if (editor.selectedElement.elementType === ElementType.Note) {
            updateNoteAndSaveThrottled(editor.selectedElement as NoteElement, {
              acceptsLyrics: quantitativeMapping.acceptsLyricsOption,
            });
          }
        } else {
          addQuantitativeNeumeThrottled(
            quantitativeMapping.neume as QuantitativeNeume,
          );
        }
      }

      const tempoMapping = neumeKeyboard.findTempoMapping(
        event,
        editor.keyboardModifier,
      );

      if (tempoMapping != null) {
        handled = true;
        addTempoThrottled(tempoMapping.neume as TempoSign);
      }

      if (
        editor.keyboardModifier == null &&
        neumeKeyboard.isMartyria(event.code)
      ) {
        handled = true;
        addAutoMartyriaThrottled(event.shiftKey);
      }

      const martyriaConfigMapping = neumeKeyboard.findMartyriaConfigMapping(
        event,
        editor.keyboardModifier,
      );

      if (martyriaConfigMapping != null) {
        if (martyriaConfigMapping.note != null) {
          handled = true;

          addAutoMartyriaThrottled(
            martyriaConfigMapping.martyriaAlignmentToggle,
            martyriaConfigMapping.note,
          );
        }
      }

      if (
        editor.selectedElement.elementType === ElementType.Note &&
        !event.repeat
      ) {
        const noteElement = editor.selectedElement as NoteElement;

        const gorgonMapping = neumeKeyboard.findGorgonMapping(
          event,
          editor.keyboardModifier,
        );

        if (gorgonMapping != null) {
          handled = true;
          setGorgonThrottled(
            noteElement,
            gorgonMapping.neumes as GorgonNeume[],
          );
        }

        const vocalExpressionMapping = neumeKeyboard.findVocalExpressionMapping(
          event,
          editor.keyboardModifier,
        );

        if (vocalExpressionMapping != null) {
          handled = true;

          if (vocalExpressionMapping.neume === VocalExpressionNeume.Vareia) {
            updateNoteAndSaveThrottled(noteElement, {
              vareia: !noteElement.vareia,
            });
          } else {
            setVocalExpressionThrottled(
              noteElement,
              vocalExpressionMapping.neume as VocalExpressionNeume,
            );
          }
        }

        const tieMapping = neumeKeyboard.findTieMapping(
          event,
          editor.keyboardModifier,
        );

        if (tieMapping != null) {
          handled = true;

          setTieThrottled(noteElement, tieMapping.neumes as Tie[]);
        }

        const fthoraMapping = neumeKeyboard.findFthoraMapping(
          event,
          editor.keyboardModifier,
        );

        if (fthoraMapping != null) {
          handled = true;
          setFthoraNoteThrottled(noteElement, fthoraMapping.neumes as Fthora[]);
        }

        const accidentalMapping = neumeKeyboard.findAccidentalMapping(
          event,
          editor.keyboardModifier,
        );

        if (accidentalMapping != null) {
          handled = true;
          setAccidentalThrottled(
            noteElement,
            accidentalMapping.neume as Accidental,
          );
        }

        const hapliMapping = neumeKeyboard.findHapliMapping(
          event,
          editor.keyboardModifier,
        );

        if (hapliMapping != null) {
          handled = true;

          if (hapliMapping.neume === TimeNeume.Koronis) {
            updateNoteAndSaveThrottled(noteElement, {
              koronis: !noteElement.koronis,
            });
          } else {
            setTimeNeumeThrottled(noteElement, hapliMapping.neume as TimeNeume);
          }
        }

        const measureNumberMapping = neumeKeyboard.findMeasureNumberMapping(
          event,
          editor.keyboardModifier,
        );

        if (measureNumberMapping != null) {
          handled = true;
          setMeasureNumberThrottled(
            noteElement,
            measureNumberMapping.neume as MeasureNumber,
          );
        }

        const measureBarMapping = neumeKeyboard.findMeasureBarMapping(
          event,
          editor.keyboardModifier,
        );

        if (measureBarMapping != null) {
          handled = true;
          setMeasureBarNoteThrottled(
            noteElement,
            measureBarMapping.neume as MeasureBar,
          );
        }

        const isonMapping = neumeKeyboard.findIsonMapping(
          event,
          editor.keyboardModifier,
        );

        if (isonMapping != null) {
          handled = true;
          setIsonThrottled(noteElement, isonMapping.neume as Ison);
        }

        if (
          editor.keyboardModifier == null &&
          neumeKeyboard.isMartyria(event.code)
        ) {
          addAutoMartyriaThrottled();
        } else if (
          editor.keyboardModifier == null &&
          neumeKeyboard.isKlasma(event.code)
        ) {
          setKlasmaThrottled(noteElement);
        } else if (
          editor.keyboardModifier == null &&
          neumeKeyboard.isNoteIndicator(event.code)
        ) {
          updateNoteAndSaveThrottled(noteElement, {
            noteIndicator: !noteElement.noteIndicator,
          });
        }
      } else if (
        editor.selectedElement.elementType === ElementType.Martyria &&
        !event.repeat
      ) {
        const martyriaElement = editor.selectedElement as MartyriaElement;

        const fthoraMapping = neumeKeyboard.findFthoraMapping(
          event,
          editor.keyboardModifier,
        );

        if (fthoraMapping != null) {
          handled = true;
          setFthoraMartyriaThrottled(
            martyriaElement,
            fthoraMapping.neumes![0] as Fthora,
          );
        }

        const tempoMapping = neumeKeyboard.findMartyriaTempoMapping(
          event,
          editor.keyboardModifier,
        );

        if (tempoMapping != null) {
          handled = true;
          setMartyriaTempoThrottled(
            martyriaElement,
            tempoMapping.neume as TempoSign,
          );
        }

        const measureBarMapping = neumeKeyboard.findMeasureBarMapping(
          event,
          editor.keyboardModifier,
        );

        if (measureBarMapping != null) {
          handled = true;
          setMeasureBarMartyriaThrottled(
            martyriaElement,
            measureBarMapping.neume as MeasureBar,
          );
        }

        const martyriaConfigMapping = neumeKeyboard.findMartyriaConfigMapping(
          event,
          editor.keyboardModifier,
        );

        if (martyriaConfigMapping != null) {
          handled = true;

          if (martyriaConfigMapping.note != null) {
            // This case will not currently happen
            // because no keyboard mapping exist for it
            updateMartyriaNoteThrottled(
              martyriaElement,
              martyriaConfigMapping.note,
            );
          } else if (martyriaConfigMapping.scale != null) {
            updateMartyriaScaleThrottled(
              martyriaElement,
              martyriaConfigMapping.scale,
            );
          } else if (martyriaConfigMapping.martyriaAlignmentToggle === true) {
            updateMartyriaAlignRightThrottled(
              martyriaElement,
              !martyriaElement.alignRight,
            );
          } else if (martyriaConfigMapping.martyriaAutoToggle === true) {
            updateMartyriaAutoThrottled(martyriaElement, !martyriaElement.auto);
          }
        }
      }
    }
    if (handled) {
      event.preventDefault();
    }
  }

  function onKeydownLyrics(event: KeyboardEvent) {
    let handled = false;

    // Do not allow enter key in lyrics
    if (event.code === 'Enter') {
      event.preventDefault();
      return;
    }

    switch (event.code) {
      case 'ArrowRight':
        if (event.shiftKey) {
          return;
        }

        if (event.ctrlKey || event.metaKey) {
          if (!editor.rtl) {
            moveToNextLyricBoxThrottled();
          } else {
            moveToPreviousLyricBoxThrottled();
          }
          handled = true;
        } else if (
          !editor.rtl &&
          getCursorPosition() === getLyricLength(editor.selectedLyrics!)
        ) {
          moveToNextLyricBoxThrottled();
          handled = true;
        } else if (editor.rtl && getCursorPosition() === 0) {
          moveToPreviousLyricBoxThrottled();
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (event.shiftKey) {
          return;
        }

        if (event.ctrlKey || event.metaKey) {
          if (!editor.rtl) {
            moveToPreviousLyricBoxThrottled();
          } else {
            moveToNextLyricBoxThrottled();
          }
          handled = true;
        } else if (!editor.rtl && getCursorPosition() === 0) {
          moveToPreviousLyricBoxThrottled();
          handled = true;
        } else if (
          editor.rtl &&
          getCursorPosition() === getLyricLength(editor.selectedLyrics!)
        ) {
          moveToNextLyricBoxThrottled();
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (event.shiftKey) {
          return;
        }

        if (event.ctrlKey || event.metaKey) {
          setSelectedElement(editor.selectedLyrics);
          blurActiveElement();
          window.getSelection()?.removeAllRanges();
          handled = true;
        }
        break;
      case 'Space':
        // Ctrl + Space should add a normal space character
        if (event.ctrlKey || event.metaKey) {
          document.execCommand('insertText', false, ' ');
        } else {
          moveToNextLyricBoxThrottled(true);
        }
        handled = true;
        break;
      case 'Minus': {
        if (event.shiftKey) {
          document.execCommand('insertText', false, '_');
        } else {
          document.execCommand('insertText', false, '-');
        }

        // Ctrl key overrides the "go to next lyrics" (Alt key for mac)
        const overridden =
          (platformService.isMac && event.altKey) ||
          (!platformService.isMac && event.ctrlKey);

        if (
          !overridden &&
          getCursorPosition() === getLyricLength(editor.selectedLyrics!)
        ) {
          if (getNextLyricBoxIndex() >= 0) {
            moveToNextLyricBoxThrottled();
          } else {
            // If this is the last lyric box, blur
            // so that the melisma is registered and
            // the user doesn't accidentally type more
            // characters into box
            editor.lyricRefs[editor.selectedLyrics!.index].blur();
          }
        }

        handled = true;
        break;
      }
      case 'KeyJ': {
        if (!editor.rtl) {
          return;
        }
        if (event.shiftKey) {
          document.execCommand('insertText', false, TATWEEL);
        } else {
          return;
        }

        // Ctrl key overrides the "go to next lyrics" (Alt key for mac)
        const overridden =
          (platformService.isMac && event.altKey) ||
          (!platformService.isMac && event.ctrlKey);

        if (
          !overridden &&
          getCursorPosition() === getLyricLength(editor.selectedLyrics!)
        ) {
          if (getNextLyricBoxIndex() >= 0) {
            moveToNextLyricBoxThrottled();
          } else {
            // If this is the last lyric box, blur
            // so that the melisma is registered and
            // the user doesn't accidentally type more
            // characters into box
            editor.lyricRefs[editor.selectedLyrics!.index].blur();
          }
        }

        handled = true;
        break;
      }
    }

    if (handled) {
      event.preventDefault();
    }
  }

  function onKeydownDropCap(event: KeyboardEvent) {
    let handled = false;

    const index = editor.selectedElement!.index;
    const htmlElement = editor.elementRefs[index] as InstanceType<
      typeof DropCap
    >;

    switch (event.code) {
      case 'Enter':
        // Do not allow enter key in drop caps
        handled = true;
        break;
      case 'Tab':
        moveRightThrottled();
        handled = true;
        break;
      case 'ArrowLeft':
        if (!editor.rtl && getCursorPosition() === 0) {
          moveLeftThrottled();
          handled = true;
        } else if (
          editor.rtl &&
          getCursorPosition() === htmlElement.textElement.getInnerText().length
        ) {
          moveRightThrottled();
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (
          !editor.rtl &&
          getCursorPosition() === htmlElement.textElement.getInnerText().length
        ) {
          moveRightThrottled();
          handled = true;
        } else if (editor.rtl && getCursorPosition() === 0) {
          moveLeftThrottled();
          handled = true;
        }
        break;
    }

    if (handled) {
      event.preventDefault();
    }
  }

  function onKeydownTextBox(event: KeyboardEvent) {
    let handled = false;

    const index = editor.selectedElement!.index;
    const htmlElement = editor.elementRefs[index] as InstanceType<
      typeof TextBox
    >;

    switch (event.code) {
      case 'Tab':
        moveRightThrottled();
        handled = true;
        break;
      case 'ArrowLeft':
        if (!editor.rtl && getCursorPosition() === 0) {
          moveLeftThrottled();
          handled = true;
        } else if (
          editor.rtl &&
          getCursorPosition() ===
            htmlElement.getTextElement().getInnerText().length
        ) {
          moveRightThrottled();
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (
          !editor.rtl &&
          getCursorPosition() ===
            htmlElement.getTextElement().getInnerText().length
        ) {
          moveRightThrottled();
          handled = true;
        } else if (editor.rtl && getCursorPosition() === 0) {
          moveLeftThrottled();
          handled = true;
        }
        break;
    }

    if (handled) {
      event.preventDefault();
    }
  }

  /**
   * Handles text editing functionality for macOS
   */
  function onKeydownMac(event: KeyboardEvent) {
    let handled = false;

    if (!event.metaKey) {
      return;
    }

    switch (event.code) {
      case 'KeyA':
        document.execCommand('selectAll');
        handled = true;
        break;
      case 'KeyC':
        document.execCommand('copy');
        handled = true;
        break;
      case 'KeyV':
        ipcService.paste();
        handled = true;
        break;
      case 'KeyX':
        document.execCommand('cut');
        handled = true;
        break;
      case 'KeyZ':
        if (event.shiftKey) {
          document.execCommand('redo');
        } else {
          document.execCommand('undo');
        }
        handled = true;
        break;
    }

    if (handled) {
      event.preventDefault();
    }
  }

  function onKeyup(event: KeyboardEvent) {
    let handled = false;

    if (editor.keyboardModifier === event.code) {
      editor.keyboardModifier = null;
      handled = true;
    }

    if (handled) {
      event.preventDefault();
    }
  }

  function getNextLyricBoxIndex() {
    if (editor.selectedLyrics) {
      const currentIndex = editor.selectedLyrics.index;

      // Find the index of the next note
      for (let i = currentIndex + 1; i < editor.elements.length; i++) {
        if (editor.elements[i].elementType === ElementType.Note) {
          return i;
        }
      }
    }

    return -1;
  }

  function moveToNextLyricBox(clearMelisma: boolean = false) {
    const nextIndex = getNextLyricBoxIndex();

    if (nextIndex >= 0) {
      // If the lyrics for the last neume on the line have been updated to be so long
      // that the neume is moved to the next line by processPages(), then focusLyrics()
      // will fail if called on its own. This is because the order of events would
      // be the following:
      // focus next element => blur previous element => updateLyrics => processPages
      // and finally the newly selected element would lose focus because processPages
      // moves the element to the next line.

      // To prevent this we, preemptively call updateLyrics and then use nextTick
      // to only focus the next lyrics after the UI has been redrawn.

      const noteElement = editor.selectedLyrics!;

      const text = editor.lyricRefs[noteElement.index].getInnerText();

      editing.updateLyrics(noteElement, text, clearMelisma);

      nextTick(() => {
        focusLyrics(nextIndex, true);
      });

      return true;
    }

    return false;
  }

  function moveToPreviousLyricBox() {
    if (editor.selectedLyrics) {
      const currentIndex = editor.selectedLyrics.index;
      let nextIndex = -1;

      // Find the index of the previous note
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (editor.elements[i].elementType === ElementType.Note) {
          nextIndex = i;
          break;
        }
      }

      if (nextIndex >= 0) {
        focusLyrics(nextIndex, true);
        return true;
      }
    }

    return false;
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown);
    window.addEventListener('keyup', onKeyup);
  });

  onBeforeMount(() => {
    window.removeEventListener('keydown', onKeydown);
    window.removeEventListener('keyup', onKeyup);
  });
}
