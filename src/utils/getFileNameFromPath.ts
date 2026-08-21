export function getFileNameFromPath(path: string) {
  const fileNameWithExtension = path.replace(/^.*[\\/]/, '');
  const extensionIndex = fileNameWithExtension.lastIndexOf('.');

  // No extension, or a leading dot (dotfile): return the name unchanged.
  if (extensionIndex <= 0) {
    return fileNameWithExtension;
  }

  return fileNameWithExtension.substring(0, extensionIndex);
}
