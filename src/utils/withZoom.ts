export const withZoom = (x: number, unit: string = 'px') =>
  `calc(${x}${unit} * var(--zoom, 1))`;

// A zoomed length plus a fixed offset that must not be zoomed, such as the
// rounding residue left over when the browser lays text out at a zoomed font
// size. The zoomed part still tracks --zoom, so the offset is the only part
// that depends on the zoom the caller measured with.
export const withZoomOffset = (
  x: number,
  offset: number,
  unit: string = 'px',
) =>
  `calc(${x}${unit} * var(--zoom, 1) ${offset < 0 ? '-' : '+'} ${Math.abs(offset)}px)`;
