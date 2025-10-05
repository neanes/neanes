import { Workspace } from '@/models/Workspace';

let untitledIndex = 1;

export function getTempFilename() {
  return `Untitled-${untitledIndex++}`;
}

export function getFileName(
  workspace: Workspace,
  showUnsavedChanges: boolean = true,
) {
  const unsavedChangesMarker =
    workspace.hasUnsavedChanges && showUnsavedChanges ? '*' : '';

  if (workspace.filePath != null) {
    const fileName = getFileNameFromPath(workspace.filePath);
    return `${unsavedChangesMarker}${fileName}`;
  } else {
    return `${unsavedChangesMarker}${workspace.tempFileName}`;
  }
}

export function getFileNameFromPath(path: string) {
  const fileNameWithExtension = path.replace(/^.*[\\/]/, '');
  return fileNameWithExtension.substring(
    0,
    fileNameWithExtension.lastIndexOf('.'),
  );
}
