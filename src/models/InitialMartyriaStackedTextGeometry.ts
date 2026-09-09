import {
  getPaintedBounds,
  type PitchAtomBounds,
} from '@/models/InitialMartyriaPitchGeometry';

/** Row bounds are measured relative to each row's alphabetic baseline. */
export type StackedTextRowBounds = PitchAtomBounds;

export interface InitialMartyriaStackedTextGeometry {
  width: number;
  top: number;
  bottom: number;
  rows: Array<{ left: number; top: number }>;
}

export function getInitialMartyriaStackedTextGeometry(
  topRow: StackedTextRowBounds,
  bottomRow: StackedTextRowBounds,
  topRowOffset = 0,
): InitialMartyriaStackedTextGeometry {
  const paintedTop = getPaintedBounds(topRow);
  const paintedBottom = getPaintedBounds(bottomRow);

  // The bottom row's painted ink top sits at zero; the top row stacks its
  // painted ink directly above, raised by topRowOffset.
  const bottomBaseline = -paintedBottom.inkTop;
  const topBaseline =
    bottomBaseline - paintedTop.inkBottom + paintedBottom.inkTop - topRowOffset;

  const overflow = (row: StackedTextRowBounds) => (row.strokeWidth ?? 0) / 2;
  const left = Math.min(paintedTop.inkLeft, paintedBottom.inkLeft, 0);
  const right = Math.max(
    topRow.advanceWidth + overflow(topRow),
    paintedTop.inkRight,
    bottomRow.advanceWidth + overflow(bottomRow),
    paintedBottom.inkRight,
  );
  const top = Math.min(
    topBaseline + paintedTop.inkTop,
    bottomBaseline + paintedBottom.inkTop,
  );
  const bottom = Math.max(
    topBaseline + paintedTop.inkBottom,
    bottomBaseline + paintedBottom.inkBottom,
  );
  const shift = -left;

  return {
    width: right - left,
    top,
    bottom,
    rows: [
      { left: shift, top: topBaseline - topRow.lineAscent - top },
      { left: shift, top: bottomBaseline - bottomRow.lineAscent - top },
    ],
  };
}
