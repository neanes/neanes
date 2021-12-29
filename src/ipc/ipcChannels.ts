export enum IpcMainChannels {
  FileMenuNewScore = 'FileMenuNewScore',
  FileMenuOpenScore = 'FileMenuOpenScore',
  FileMenuSave = 'FileMenuSave',
  FileMenuSaveAs = 'FileMenuSaveAs',

  FileMenuUndo = 'FileMenuUndo',
  FileMenuRedo = 'FileMenuRedo',

  FileMenuInsertNeume = 'FileMenuInsertNeume',
  FileMenuInsertTextBox = 'FileMenuInsertTextBox',
  FileMenuInsertModeKey = 'FileMenuInsertModeKey',
  FileMenuInsertDropCap = 'FileMenuInsertDropCap',

  FileMenuGenerateTestFile = 'GenerateTestFile',

  SaveComplete = 'SaveComplete',
}

export enum IpcRendererChannels {
  FileMenuSaveReply = 'FileMenuSaveReply',
  FileMenuSaveAsReply = 'FileMenuSaveAsReply',

  SetHasUnsavedChanges = 'SetHasUnsavedChanges',
  SetFilePath = 'SetFilePath',
}

export interface FileMenuOpenScoreArgs {
  data: string;
  filePath: string;
}

export interface FileMenuSaveAsArgs {
  filePath: string;
}

export interface FileMenuSaveAsReplyArgs {
  data: string;
}

export interface FileMenuSaveReplyArgs {
  data: string;
}
