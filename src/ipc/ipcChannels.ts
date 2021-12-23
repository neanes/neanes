export enum IpcMainChannels {
  FileMenuNewScore = 'FileMenuNewScore',
  FileMenuOpenScore = 'FileMenuOpenScore',
  FileMenuSave = 'FileMenuSave',
  FileMenuSaveAs = 'FileMenuSaveAs',

  FileMenuInsertNeume = 'FileMenuInsertNeume',
  FileMenuInsertTextBox = 'FileMenuInsertTextBox',
  FileMenuInsertModeKey = 'FileMenuInsertModeKey',
  FileMenuInsertDropCap = 'FileMenuInsertDropCap',

  GenerateTestFile = 'GenerateTestFile',
}

export enum IpcRendererChannels {
  FileMenuSaveAsReply = 'FileMenuSaveAsReply',
}
