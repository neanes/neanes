import {
  type DropCapElement,
  ElementType,
  type EmptyElement,
  type ImageBoxElement,
  type MartyriaElement,
  type ModeKeyElement,
  type NoteElement,
  type RichTextBoxElement,
  type ScoreElement,
  type TempoElement,
  type TextBoxElement,
} from '@/models/Element';

export function isSyllableElement(
  element: ScoreElement,
): element is NoteElement {
  return element.elementType == ElementType.Note;
}

export function isMartyriaElement(
  element: ScoreElement,
): element is MartyriaElement {
  return element.elementType == ElementType.Martyria;
}

export function isTempoElement(element: ScoreElement): element is TempoElement {
  return element.elementType == ElementType.Tempo;
}

export function isEmptyElement(element: ScoreElement): element is EmptyElement {
  return element.elementType == ElementType.Empty;
}

export function isTextBoxElement(
  element: ScoreElement,
): element is TextBoxElement {
  return element.elementType == ElementType.TextBox;
}

export function isRichTextBoxElement(
  element: ScoreElement,
): element is RichTextBoxElement {
  return element.elementType == ElementType.RichTextBox;
}

export function isDropCapElement(
  element: ScoreElement,
): element is DropCapElement {
  return element.elementType == ElementType.DropCap;
}

export function isModeKeyElement(
  element: ScoreElement,
): element is ModeKeyElement {
  return element.elementType == ElementType.ModeKey;
}

export function isImageBoxElement(
  element: ScoreElement,
): element is ImageBoxElement {
  return element.elementType == ElementType.ImageBox;
}
