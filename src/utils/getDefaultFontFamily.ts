/**
 * Returns the first sans-serif font available from a list of preferred fonts.
 */
export function getDefaultFontFamily(fonts: string[]) {
  const defaults = ['Arial', 'Helvetica', 'Liberation Sans', 'FreeSans'];
  const options = fonts.filter((x) => defaults.includes(x));

  return options.length > 0 ? options[0] : 'Omega';
}
