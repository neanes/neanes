/** The text with its first character in upper case, in the given locale. */
export function capitalizeInitial(value: string, locale?: string) {
  const [first = '', ...rest] = [...value];
  return `${first.toLocaleUpperCase(locale)}${rest.join('')}`;
}
