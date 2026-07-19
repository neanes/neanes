/** Row bounds are measured relative to each row's alphabetic baseline. */
export interface StackedTextRowBounds {
  advanceWidth: number;
  inkLeft: number;
  inkRight: number;
  inkTop: number;
  inkBottom: number;
  lineAscent: number;
  lineDescent: number;
  strokeWidth?: number;
}

export interface InitialMartyriaStackedTextGeometry {
  width: number;
  top: number;
  bottom: number;
  rows: Array<{ left: number; top: number }>;
}

export const INITIAL_MARTYRIA_STACKED_TEXT_TOP_ROW_OFFSET_EM = 0.08;

export function getInitialMartyriaStackedTextGeometry(
  rows: StackedTextRowBounds[],
  gap: number,
  baselineShift = 0,
  topRowOffset = 0,
): InitialMartyriaStackedTextGeometry {
  if (rows.length < 2) {
    throw new Error('Stacked text requires at least two rows');
  }

  const baselines = Array<number>(rows.length);
  const anchor = rows[1];
  baselines[1] = -anchor.inkTop + (anchor.strokeWidth ?? 0) / 2 - baselineShift;

  for (let index = 2; index < rows.length; index++) {
    const previous = rows[index - 1];
    const row = rows[index];
    const previousOverflow = (previous.strokeWidth ?? 0) / 2;
    const rowOverflow = (row.strokeWidth ?? 0) / 2;
    baselines[index] =
      baselines[index - 1] +
      previous.inkBottom +
      previousOverflow +
      gap -
      row.inkTop +
      rowOverflow;
  }

  const preceding = rows[0];
  const precedingOverflow = (preceding.strokeWidth ?? 0) / 2;
  const anchorOverflow = (rows[1].strokeWidth ?? 0) / 2;
  baselines[0] =
    baselines[1] -
    preceding.inkBottom -
    precedingOverflow -
    gap +
    rows[1].inkTop -
    anchorOverflow;
  baselines[0] -= topRowOffset;

  const left = Math.min(
    ...rows.map((row) => row.inkLeft - (row.strokeWidth ?? 0) / 2),
    0,
  );
  const right = Math.max(
    ...rows.map(
      (row) =>
        Math.max(row.advanceWidth, row.inkRight) + (row.strokeWidth ?? 0) / 2,
    ),
  );
  const top = Math.min(
    ...rows.map(
      (row, index) =>
        baselines[index] - row.lineAscent - (row.strokeWidth ?? 0) / 2,
    ),
  );
  const bottom = Math.max(
    ...rows.map(
      (row, index) =>
        baselines[index] + row.lineDescent + (row.strokeWidth ?? 0) / 2,
    ),
  );
  const shift = -left;

  return {
    width: right - left,
    top,
    bottom,
    rows: rows.map((row, index) => ({
      left: shift,
      top: baselines[index] - row.lineAscent - top,
    })),
  };
}
