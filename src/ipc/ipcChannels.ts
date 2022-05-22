import { PageSize } from '@/models/PageSetup';
import { Score } from '@/models/save/v1/Score';

export enum IpcMainChannels {
  FileMenuNewScore = 'FileMenuNewScore',
  FileMenuOpenScore = 'FileMenuOpenScore',
  FileMenuPrint = 'FileMenuPrint',
  FileMenuSave = 'FileMenuSave',
  FileMenuSaveAs = 'FileMenuSaveAs',
  FileMenuExportAsPdf = 'FileMenuExportAsPdf',

  FileMenuPageSetup = 'FileMenuPageSetup',

  FileMenuUndo = 'FileMenuUndo',
  FileMenuRedo = 'FileMenuRedo',

  FileMenuCut = 'FileMenuCut',
  FileMenuCopy = 'FileMenuCopy',
  FileMenuPaste = 'FileMenuPaste',

  FileMenuInsertTextBox = 'FileMenuInsertTextBox',
  FileMenuInsertModeKey = 'FileMenuInsertModeKey',
  FileMenuInsertDropCap = 'FileMenuInsertDropCap',

  FileMenuInsertHeader = 'FileMenuInsertHeader',
  FileMenuInsertFooter = 'FileMenuInsertFooter',

  FileMenuGenerateTestFile = 'GenerateTestFile',

  CloseApplication = 'CloseApplication',
}

export enum IpcRendererChannels {
  SetCanUndo = 'SetCanUndo',
  SetCanRedo = 'SetCanRedo',

  ShowMessageBox = 'ShowMessageBox',

  SaveWorkspace = 'SaveWorkspace',
  SaveWorkspaceAs = 'SaveWorkspaceAs',
  ExportWorkspaceAsPdf = 'ExportWorkspaceAsPdf',
  PrintWorkspace = 'PrintWorkspace',
  OpenWorkspaceFromArgv = 'OpenWorkspaceFromArgv',

  ExitApplication = 'ExitApplication',
}

export interface FileMenuOpenScoreArgs {
  data: string;
  filePath: string;
  success: boolean;
}

export interface ShowMessageBoxArgs {
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
  title?: string;
  message: string;
  detail?: string;
  buttons?: string[];
}

export interface ShowMessageBoxReplyArgs {
  /**
   * The index of the clicked button.
   */
  response: number;
  /**
   * The checked state of the checkbox if `checkboxLabel` was set. Otherwise `false`.
   */
  checkboxChecked: boolean;
}

export interface FileMenuInsertTextboxArgs {
  inline: boolean;
}

export interface SaveWorkspaceArgs {
  filePath: string;
  data: Score;
}

export interface SaveWorkspaceAsArgs {
  filePath: string | null;
  tempFileName: string;
  data: Score;
}

export interface SaveWorkspaceAsReplyArgs {
  filePath: string;
  success: boolean;
}

export interface SaveWorkspaceReplyArgs {
  success: boolean;
}

export interface ExportWorkspaceAsPdfArgs {
  filePath: string | null;
  tempFileName: string;
  pageSize: PageSize;
  landscape: boolean;
}

export interface PrintWorkspaceArgs {
  pageSize: PageSize;
  landscape: boolean;
}
