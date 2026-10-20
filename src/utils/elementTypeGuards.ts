import {
  type DropCapElement,
  ElementType,
  type ScoreElement,
} from '@/models/Element';

export function isDropCapElement(
  element: ScoreElement,
): element is DropCapElement {
  return element.elementType == ElementType.DropCap;
}
