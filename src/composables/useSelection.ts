import {
  AlternateLineElement,
  AnnotationElement,
  NoteElement,
  ScoreElement,
} from '@/models/Element';
import { ScoreElementSelectionRange } from '@/models/ScoreElementSelectionRange';
import { useEditorStore } from '@/stores/useEditorStore';

import { useAlternateLines } from './useAlternateLines';
import { useAudioPlayback } from './useAudioPlayback';

export function useSelection() {
  const editor = useEditorStore();
  const audioPlayback = useAudioPlayback();
  const { removeAlternateLine } = useAlternateLines();

  function setSelectedElement(element: ScoreElement | null) {
    if (element != null) {
      setSelectedLyrics(null);
      editor.setSelectionRange(null);
      setSelectedHeaderFooterElement(null);
      editor.toolbarInnerNeume = 'Primary';

      audioPlayback.onSetSelectedElement(element);
    }

    if (
      editor.selectedWorkspace.selectedAlternateLineElement != null &&
      editor.selectedWorkspace.selectedAlternateLineElement.elements.length ===
        0
    ) {
      removeAlternateLine(
        editor.selectedElement as NoteElement,
        editor.selectedWorkspace.selectedAlternateLineElement,
        true,
      );
    }

    editor.selectedWorkspace.selectedElement = element;
    editor.selectedWorkspace.selectedAnnotationElement = null;
    editor.selectedWorkspace.selectedAlternateLineElement = null;
  }

  function setSelectedLyrics(element: NoteElement | null) {
    if (element != null) {
      setSelectedElement(null);
      setSelectedHeaderFooterElement(null);
      editor.setSelectionRange(null);
    }

    editor.selectedWorkspace.selectedLyrics = element;
  }

  function setSelectedHeaderFooterElement(element: ScoreElement | null) {
    if (element != null) {
      setSelectedElement(null);
      editor.selectedWorkspace.selectedLyrics = null;
      editor.setSelectionRange(null);
    }

    editor.selectedWorkspace.selectedHeaderFooterElement = element;
  }

  function setSelectionRange(element: ScoreElement) {
    const elementIndex = element.index;

    if (editor.selectedElement != null) {
      editor.setSelectionRange({
        start: editor.selectedElementIndex,
        end: elementIndex,
      });

      setSelectedElement(null);
    } else if (editor.selectionRange != null) {
      editor.selectionRange.end = elementIndex;
    }
  }

  function getNormalizedSelectionRange() {
    if (editor.selectionRange == null) {
      return null;
    }

    const start = Math.min(
      editor.selectionRange.start,
      editor.selectionRange.end,
    );
    const end = Math.max(
      editor.selectionRange.start,
      editor.selectionRange.end,
    );

    return {
      start,
      end,
    } as ScoreElementSelectionRange;
  }

  function isSelected(element: ScoreElement) {
    if (editor.selectedElement === element) {
      return true;
    }
    if (editor.selectionRange != null) {
      const start = Math.min(
        editor.selectionRange.start,
        editor.selectionRange.end,
      );
      const end = Math.max(
        editor.selectionRange.start,
        editor.selectionRange.end,
      );

      return start <= element.index && element.index <= end;
    }

    return false;
  }

  function setSelectedAnnotation(
    parent: ScoreElement | null,
    annotation: AnnotationElement,
  ) {
    setSelectedElement(parent);
    editor.selectedWorkspace.selectedAnnotationElement = annotation;
  }

  function setSelectedAlternateLine(
    parent: ScoreElement | null,
    alternateLine: AlternateLineElement,
  ) {
    setSelectedElement(parent);
    editor.selectedWorkspace.selectedAlternateLineElement = alternateLine;
  }

  function isAudioSelected(element: ScoreElement) {
    return editor.audioElement === element;
  }

  return {
    setSelectedElement,
    setSelectedLyrics,
    setSelectedHeaderFooterElement,
    setSelectionRange,
    getNormalizedSelectionRange,
    isSelected,
    setSelectedAnnotation,
    setSelectedAlternateLine,
    isAudioSelected,
  };
}
