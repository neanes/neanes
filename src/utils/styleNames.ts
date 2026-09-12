export function areStyleDisplayNamesValid(names: Iterable<string>) {
  const existingNames = new Set<string>();

  for (const value of names) {
    const name = value.trim();

    if (name.length === 0 || existingNames.has(name)) {
      return false;
    }

    existingNames.add(name);
  }

  return true;
}

export function getNextAvailableStyleName(
  baseName: string,
  existingNames: Iterable<string>,
) {
  const name = baseName.trim();
  const names = new Set([...existingNames].map((value) => value.trim()));

  if (!names.has(name)) {
    return name;
  }

  let suffix = 2;

  while (names.has(`${name} ${suffix}`)) {
    suffix++;
  }

  return `${name} ${suffix}`;
}
