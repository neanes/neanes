export const withZoom = (x: number, unit: string = 'px') =>
  `calc(${x}${unit} * var(--zoom, 1))`;

// A zoomed length plus a fixed offset that must not be zoomed, such as the
// rounding residue left over when the browser lays text out at a zoomed font
// size. The offset only holds for the zoom the caller measured at, so it is
// gated on --zoom-residue, which @media print clears along with --zoom. Both
// halves of the correction therefore switch in the stylesheet, at the moment
// the browser changes media, rather than having to be recomputed in advance.
export const withZoomOffset = (x: number, offset: number) =>
  `calc(${x}px * var(--zoom, 1) + ${offset}px * var(--zoom-residue, 1))`;
