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
  const names = new Set(existingNames);

  if (!names.has(baseName)) {
    return baseName;
  }

  let suffix = 2;

  while (names.has(`${baseName} ${suffix}`)) {
    suffix++;
  }

  return `${baseName} ${suffix}`;
}
