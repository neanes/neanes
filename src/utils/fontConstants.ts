export const DEFAULT_FONT_STYLE = 'Regular';

// The combobox value that represents "no explicit font family" (i.e. inherit the
// text box's default). Selecting it clears the fontFamily attribute, and the
// clear (X) button resets to it.
export const RICH_TEXT_DEFAULT_FONT_FAMILY = 'default';

export const NEUME_FONT_FAMILIES: ReadonlySet<string> = new Set([
  'Neanes',
  'NeanesStathisSeries',
]);
