/** Bounds are relative to the text baseline. Ink top is negative. */
export interface PitchAtomBounds {
  advanceWidth: number;
  inkLeft: number;
  inkRight: number;
  inkTop: number;
  inkBottom: number;
  lineAscent: number;
  lineDescent: number;
  strokeWidth?: number;
}

export interface PitchAtomPlacement {
  left: number;
  top: number;
}

export interface InitialMartyriaPitchGeometry {
  width: number;
  top: number;
  bottom: number;
  text: PitchAtomPlacement;
  fthora?: PitchAtomPlacement;
  quantitative?: PitchAtomPlacement;
}

const ATTACHMENT_GAP = 2;

export function getPaintedBounds(bounds: PitchAtomBounds): PitchAtomBounds {
  const overflow = (bounds.strokeWidth ?? 0) / 2;
  return overflow === 0
    ? bounds
    : {
        ...bounds,
        inkLeft: bounds.inkLeft - overflow,
        inkRight: bounds.inkRight + overflow,
        inkTop: bounds.inkTop - overflow,
        inkBottom: bounds.inkBottom + overflow,
      };
}

function horizontalInkPlacement(
  text: PitchAtomBounds,
  attachment: PitchAtomBounds,
): number {
  const textInkCenter = (text.inkLeft + text.inkRight) / 2;
  const attachmentInkCenter = (attachment.inkLeft + attachment.inkRight) / 2;
  return textInkCenter - attachmentInkCenter;
}

function overlaps(
  first: { left: number; baseline: number; bounds: PitchAtomBounds },
  second: { left: number; baseline: number; bounds: PitchAtomBounds },
) {
  return (
    first.left + first.bounds.inkRight > second.left + second.bounds.inkLeft &&
    second.left + second.bounds.inkRight > first.left + first.bounds.inkLeft &&
    first.baseline + first.bounds.inkBottom >
      second.baseline + second.bounds.inkTop &&
    second.baseline + second.bounds.inkBottom >
      first.baseline + first.bounds.inkTop
  );
}

export function getInitialMartyriaPitchGeometry(
  text: PitchAtomBounds,
  fthora?: PitchAtomBounds,
  quantitative?: PitchAtomBounds,
  strokeOverflow = 0,
): InitialMartyriaPitchGeometry {
  const paintedText = getPaintedBounds(text);
  const textPlacement = { left: 0, baseline: 0, bounds: paintedText };
  const attach = (bounds: PitchAtomBounds | undefined) => {
    if (bounds == null) {
      return undefined;
    }
    const painted = getPaintedBounds(bounds);
    return {
      left: horizontalInkPlacement(paintedText, painted),
      baseline: paintedText.inkTop - ATTACHMENT_GAP - painted.inkBottom,
      bounds: painted,
    };
  };
  const fthoraPlacement = attach(fthora);
  const quantitativePlacement = attach(quantitative);

  if (
    fthoraPlacement != null &&
    quantitativePlacement != null &&
    overlaps(quantitativePlacement, fthoraPlacement)
  ) {
    quantitativePlacement.baseline =
      fthoraPlacement.baseline +
      fthoraPlacement.bounds.inkTop -
      quantitativePlacement.bounds.inkBottom -
      ATTACHMENT_GAP;
  }

  const atoms = [textPlacement, fthoraPlacement, quantitativePlacement].filter(
    (atom): atom is NonNullable<typeof atom> => atom != null,
  );
  const left = Math.min(
    ...atoms.map((atom) => atom.left + atom.bounds.inkLeft),
    -strokeOverflow,
  );
  const right = Math.max(
    text.advanceWidth + strokeOverflow,
    ...atoms.map((atom) => atom.left + atom.bounds.inkRight),
  );
  const top = Math.min(
    text.inkTop - strokeOverflow,
    ...atoms.map((atom) => atom.baseline + atom.bounds.inkTop),
  );
  const bottom = Math.max(
    text.inkBottom + strokeOverflow,
    ...atoms.map((atom) => atom.baseline + atom.bounds.inkBottom),
  );

  const shift = -left;
  const place = (atom: typeof textPlacement | undefined) =>
    atom == null
      ? undefined
      : {
          left: atom.left + shift,
          top: atom.baseline - top - atom.bounds.lineAscent,
        };

  return {
    width: right - left,
    top,
    bottom,
    text: place(textPlacement)!,
    fthora: place(fthoraPlacement),
    quantitative: place(quantitativePlacement),
  };
}
