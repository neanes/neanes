export const withZoom = (x: number, unit: string = 'px') =>
  `calc(${x}${unit} * var(--zoom, 1))`;

// The effective --zoom on an element, for unscaling DOM measurements taken
// inside a zoomed subtree; 1 when the property is unset or not a number.
export const getComputedZoom = (element: Element) =>
  Number(getComputedStyle(element).getPropertyValue('--zoom')) || 1;
