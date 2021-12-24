export enum IpcMainChannels {
  FileMenuNewScore = 'FileMenuNewScore',
  FileMenuOpenScore = 'FileMenuOpenScore',
  FileMenuSave = 'FileMenuSave',
  FileMenuSaveAs = 'FileMenuSaveAs',

  FileMenuInsertNeume = 'FileMenuInsertNeume',
  FileMenuInsertTextBox = 'FileMenuInsertTextBox',
  FileMenuInsertModeKey = 'FileMenuInsertModeKey',
  FileMenuInsertDropCap = 'FileMenuInsertDropCap',

  FileMenuGenerateTestFile = 'GenerateTestFile',
}

export enum IpcRendererChannels {
  FileMenuSaveReply = 'FileMenuSaveReply',
  FileMenuSaveAsReply = 'FileMenuSaveAsReply',
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
  filePath: string;
}
