import { PageSize } from '@/models/PageSetup';

export enum IpcMainChannels {
  FileMenuNewScore = 'FileMenuNewScore',
  FileMenuOpenScore = 'FileMenuOpenScore',
  FileMenuPrint = 'FileMenuPrint',
  FileMenuSave = 'FileMenuSave',
  FileMenuSaveAs = 'FileMenuSaveAs',

  FileMenuPageSetup = 'FileMenuPageSetup',

  FileMenuUndo = 'FileMenuUndo',
  FileMenuRedo = 'FileMenuRedo',

  FileMenuInsertTextBox = 'FileMenuInsertTextBox',
  FileMenuInsertModeKey = 'FileMenuInsertModeKey',
  FileMenuInsertDropCap = 'FileMenuInsertDropCap',

  FileMenuGenerateTestFile = 'GenerateTestFile',

  SaveComplete = 'SaveComplete',
}

export enum IpcRendererChannels {
  FileMenuPrintReply = 'FileMenuPrintReply',

  FileMenuSaveReply = 'FileMenuSaveReply',
  FileMenuSaveAsReply = 'FileMenuSaveAsReply',

  SetHasUnsavedChanges = 'SetHasUnsavedChanges',
  SetFilePath = 'SetFilePath',

  SetCanUndo = 'SetCanUndo',
  SetCanRedo = 'SetCanRedo',

  ShowErrorBox = 'ShowErrorBox',
}

export interface FileMenuOpenScoreArgs {
  data: string;
  filePath: string;
}

export interface FileMenuPrintReplyArgs {
  pageSize: PageSize;
  landscape: boolean;
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

export interface ShowErrorBoxArgs {
  title: string;
  content: string;
}
