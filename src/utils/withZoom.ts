export const withZoom = (x: number, unit: string = 'px') =>
  `calc(${x}${unit} * var(--zoom, 1))`;
