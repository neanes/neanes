import {
  getPaintedBounds,
  type PitchAtomBounds,
} from '@/models/InitialMartyriaPitchGeometry';

/** Row bounds are measured relative to each row's alphabetic baseline. */
export type StackedCharacterBounds = PitchAtomBounds;

export interface InitialMartyriaStackedCharactersGeometry {
  width: number;
  top: number;
  bottom: number;
  topRow: { top: number };
  bottomRow: { top: number };
}

export function getInitialMartyriaStackedCharactersGeometry(
  topRow: StackedCharacterBounds,
  bottomRow: StackedCharacterBounds,
  topRowOffset = 0,
): InitialMartyriaStackedCharactersGeometry {
  const paintedTop = getPaintedBounds(topRow);
  const paintedBottom = getPaintedBounds(bottomRow);

  // The bottom row's painted ink top sits at zero; the top row stacks its
  // painted ink directly above, raised by topRowOffset.
  const bottomBaseline = -paintedBottom.inkTop;
  const topBaseline =
    bottomBaseline - paintedTop.inkBottom + paintedBottom.inkTop - topRowOffset;

  // Center both character boxes on one axis, like two center-aligned text
  // lines, and grow the containing box evenly to fit ink and outline overflow.
  const overflow = (row: StackedCharacterBounds) => (row.strokeWidth ?? 0) / 2;
  const horizontalRadius = (
    row: StackedCharacterBounds,
    painted: StackedCharacterBounds,
  ) =>
    Math.max(
      row.advanceWidth / 2 + overflow(row),
      Math.abs(painted.inkLeft - row.advanceWidth / 2),
      Math.abs(painted.inkRight - row.advanceWidth / 2),
    );
  const halfWidth = Math.max(
    horizontalRadius(topRow, paintedTop),
    horizontalRadius(bottomRow, paintedBottom),
  );
  const top = Math.min(
    topBaseline + paintedTop.inkTop,
    bottomBaseline + paintedBottom.inkTop,
  );
  const bottom = Math.max(
    topBaseline + paintedTop.inkBottom,
    bottomBaseline + paintedBottom.inkBottom,
  );

  return {
    width: halfWidth * 2,
    top,
    bottom,
    topRow: {
      top: topBaseline - topRow.lineAscent - top,
    },
    bottomRow: {
      top: bottomBaseline - bottomRow.lineAscent - top,
    },
  };
}
