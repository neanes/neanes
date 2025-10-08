import DropCap from '@/components/DropCap.vue';
import TextBox from '@/components/TextBox.vue';
import { ElementType } from '@/models/Element';
import { useEditorStore } from '@/stores/useEditorStore';

import { useSelection } from './useSelection';

export function useNavigation() {
  const editor = useEditorStore();
  const { setSelectedElement, setSelectionRange } = useSelection();

  const navigableElements = [
    ElementType.Note,
    ElementType.Martyria,
    ElementType.Tempo,
    ElementType.Empty,
    ElementType.DropCap,
    ElementType.TextBox,
    ElementType.ImageBox,
    ElementType.ModeKey,
  ];

  function moveLeft() {
    let index = -1;

    if (editor.selectedElement) {
      index = editor.selectedElement.index;
    } else if (editor.selectionRange) {
      index = editor.selectionRange.end;
    }

    const element = editor.elements[index - 1];

    if (index - 1 >= 0 && navigableElements.includes(element.elementType)) {
      // If the currently selected element is a drop cap or text box, blur it first
      if (editor.selectedElement?.elementType === ElementType.DropCap) {
        (editor.elementRefs[index] as InstanceType<typeof DropCap>).blur();
      } else if (editor.selectedElement?.elementType === ElementType.TextBox) {
        (editor.elementRefs[index] as TextBox).blur();
      }

      setSelectedElement(element);

      // If the newly selected element is a drop cap or text box, focus it
      if (element.elementType === ElementType.DropCap) {
        (editor.elementRefs[index - 1] as InstanceType<typeof DropCap>).focus();
      } else if (element.elementType === ElementType.TextBox) {
        (editor.elementRefs[index - 1] as TextBox).focus();
      }

      return true;
    }

    return false;
  }

  function moveRight() {
    let index = -1;

    if (editor.selectedElement) {
      index = editor.selectedElement.index;
    } else if (editor.selectionRange) {
      index = editor.selectionRange.end;
    }

    const element = editor.elements[index + 1];

    if (
      index >= 0 &&
      index + 1 < editor.elements.length &&
      navigableElements.includes(element.elementType)
    ) {
      // If the currently selected element is a drop cap, blur it first
      if (editor.selectedElement?.elementType === ElementType.DropCap) {
        (editor.elementRefs[index] as InstanceType<typeof DropCap>).blur();
      } else if (editor.selectedElement?.elementType === ElementType.TextBox) {
        (editor.elementRefs[index] as TextBox).blur();
      }

      setSelectedElement(element);

      // If the newly selected element is a drop cap, focus it
      if (element.elementType === ElementType.DropCap) {
        (editor.elementRefs[index] as InstanceType<typeof DropCap>).focus();
      } else if (element.elementType === ElementType.TextBox) {
        (editor.elementRefs[index] as TextBox).focus();
      }

      return true;
    }

    return false;
  }

  function moveSelectionLeft() {
    if (editor.selectionRange != null) {
      if (
        editor.selectionRange.end > 0 &&
        navigableElements.includes(
          editor.elements[editor.selectionRange.end - 1].elementType,
        )
      ) {
        setSelectionRange(editor.elements[editor.selectionRange.end - 1]);
      }
    } else if (
      editor.selectedElement != null &&
      editor.selectedElementIndex > 0 &&
      navigableElements.includes(
        editor.elements[editor.selectedElementIndex - 1].elementType,
      )
    ) {
      setSelectionRange(editor.elements[editor.selectedElementIndex - 1]);
    }
  }

  function moveSelectionRight() {
    if (editor.selectionRange != null) {
      if (
        editor.selectionRange.end + 1 < editor.elements.length - 1 &&
        navigableElements.includes(
          editor.elements[editor.selectionRange.end + 1].elementType,
        )
      ) {
        setSelectionRange(editor.elements[editor.selectionRange.end + 1]);
      }
    } else if (
      editor.selectedElement != null &&
      editor.selectedElementIndex + 1 < editor.elements.length - 1 &&
      navigableElements.includes(
        editor.elements[editor.selectedElementIndex + 1].elementType,
      )
    ) {
      setSelectionRange(editor.elements[editor.selectedElementIndex + 1]);
    }
  }

  return {
    moveLeft,
    moveRight,
    moveSelectionLeft,
    moveSelectionRight,
    navigableElements,
  };
}
