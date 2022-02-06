export function getFileNameFromPath(path: string) {
  const fileNameWithExtension = path.replace(/^.*[\\/]/, '');
  return fileNameWithExtension.substring(
    0,
    fileNameWithExtension.lastIndexOf('.'),
  );
}
