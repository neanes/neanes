import type { PageSize } from '@/models/PageSetup';
import type { Score } from '@/models/save/v1/Score';
import type { WorkspacePaneId } from '@/models/WorkspacePane';

export enum IpcMainChannels {
  UpdateAvailable = 'UpdateAvailable',
  UpdateDownloadStarted = 'UpdateDownloadStarted',
  UpdateDownloadProgress = 'UpdateDownloadProgress',
  UpdateDownloaded = 'UpdateDownloaded',
  UpdateError = 'UpdateError',

  FileMenuNewScore = 'FileMenuNewScore',
  FileMenuOpenScore = 'FileMenuOpenScore',
  FileMenuPrint = 'FileMenuPrint',
  FileMenuSave = 'FileMenuSave',
  FileMenuSaveAs = 'FileMenuSaveAs',
  FileMenuImportOcr = 'FileMenuImportOcr',
  FileMenuExportAsPdf = 'FileMenuExportAsPdf',
  FileMenuExportAsHtml = 'FileMenuExportAsHtml',
  FileMenuExportAsMusicXml = 'FileMenuExportAsMusicXml',
  FileMenuExportAsLatex = 'FileMenuExportAsLatex',
  FileMenuExportAsImage = 'FileMenuExportAsImage',

  FileMenuPageSetup = 'FileMenuPageSetup',

  FileMenuUndo = 'FileMenuUndo',
  FileMenuRedo = 'FileMenuRedo',

  FileMenuCut = 'FileMenuCut',
  FileMenuCopy = 'FileMenuCopy',
  FileMenuCopyAsHtml = 'FileMenuCopyAsHtml',
  FileMenuCopyFormat = 'FileMenuCopyFormat',
  FileMenuPaste = 'FileMenuPaste',
  FileMenuPasteWithLyrics = 'FileMenuPasteWithLyrics',
  FileMenuPasteFormat = 'FileMenuPasteFormat',

  FileMenuFind = 'FileMenuFind',

  FileMenuViewPaneVisibility = 'FileMenuViewPaneVisibility',
  FileMenuViewResetPaneLayout = 'FileMenuViewResetPaneLayout',

  FileMenuPreferences = 'FileMenuPreferences',
  OpenAboutDialog = 'OpenAboutDialog',

  FileMenuInsertAnnotation = 'FileMenuInsertAnnotation',
  FileMenuInsertAlternateLine = 'FileMenuInsertAlternateLine',
  FileMenuInsertTextBox = 'FileMenuInsertTextBox',
  FileMenuInsertRichTextBox = 'FileMenuInsertRichTextBox',
  FileMenuInsertModeKey = 'FileMenuInsertModeKey',
  FileMenuInsertDropCapBefore = 'FileMenuInsertDropCapBefore',
  FileMenuInsertDropCapAfter = 'FileMenuInsertDropCapAfter',
  FileMenuInsertImage = 'FileMenuInsertImage',

  FileMenuInsertHeader = 'FileMenuInsertHeader',
  FileMenuInsertFooter = 'FileMenuInsertFooter',

  FileMenuToolsCopyElementLink = 'FileMenuToolsCopyElementLink',

  FileMenuGenerateTestFile = 'GenerateTestFile',

  CloseWorkspaces = 'CloseWorkspaces',

  CloseApplication = 'CloseApplication',
}

export enum IpcRendererChannels {
  DownloadUpdate = 'DownloadUpdate',
  RestartToInstallUpdate = 'RestartToInstallUpdate',
  InstallUpdateOnExit = 'InstallUpdateOnExit',

  SetCanUndo = 'SetCanUndo',
  SetCanRedo = 'SetCanRedo',
  SetWorkspacePaneVisibility = 'SetWorkspacePaneVisibility',

  ShowMessageBox = 'ShowMessageBox',
  ShowItemInFolder = 'ShowItemInFolder',

  SaveWorkspace = 'SaveWorkspace',
  SaveWorkspaceAs = 'SaveWorkspaceAs',
  ExportWorkspaceAsPdf = 'ExportWorkspaceAsPdf',
  ExportWorkspaceAsHtml = 'ExportWorkspaceAsHtml',
  ExportWorkspaceAsMusicXml = 'ExportWorkspaceAsMusicXml',
  ExportWorkspaceAsLatex = 'ExportWorkspaceAsLatex',
  ExportWorkspaceAsImage = 'ExportWorkspaceAsImage',
  ExportPageAsImage = 'ExportPageAsImage',
  PrintWorkspace = 'PrintWorkspace',
  OpenWorkspaceFromArgv = 'OpenWorkspaceFromArgv',
  OpenImageDialog = 'OpenImageDialog',

  GetSystemFonts = 'GetSystemFonts',

  ExitApplication = 'ExitApplication',
  CancelExit = 'CancelExit',

  Paste = 'Paste',

  SetLanguage = 'SetLanguage',
}

export interface FileMenuOpenScoreArgs {
  data: string;
  filePath: string;
  success: boolean;
}

export interface OpenWorkspaceFromArgvArgs {
  files: FileMenuOpenScoreArgs[];
  silentPdf?: boolean;
  silentHtml?: boolean;
  silentLatex?: boolean;
  silentLatexIncludeModeKeys?: boolean;
  silentLatexIncludeTextBoxes?: boolean;
}

export interface FileMenuOpenImageArgs {
  data: string;
  imageWidth: number;
  imageHeight: number;
  filePath: string;
  success: boolean;
}

export interface UpdateAvailableArgs {
  version?: string;
}

export interface UpdateDownloadProgressArgs {
  percent: number;
  transferred: number;
  total: number;
}

export interface UpdateErrorArgs {
  message: string;
}

export interface FileMenuImportOcrArgs {
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

export interface FileMenuViewPaneVisibilityArgs {
  paneId: WorkspacePaneId;
  visible?: boolean;
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
  pageWidthInches: number;
  pageHeightInches: number;
  landscape: boolean;
}

export interface ExportWorkspaceAsHtmlArgs {
  filePath: string | null;
  tempFileName: string;
  data: string;
}

export interface ExportWorkspaceAsMusicXmlArgs {
  filePath: string | null;
  tempFileName: string;
  data: string;
  compressed: boolean;
  openFolder: boolean;
}

export interface ExportWorkspaceAsLatexArgs {
  filePath: string | null;
  tempFileName: string;
  data: string;
}

export interface ExportWorkspaceAsImageArgs {
  filePath: string | null;
  tempFileName: string;
  imageFormat: 'svg' | 'png';
}

export interface ExportWorkspaceAsImageReplyArgs {
  filePath: string;
  success: boolean;
}

export interface ExportPageAsImageArgs {
  filePath: string;
  data: string;
}

export interface PrintWorkspaceArgs {
  pageSize: PageSize;
  pageWidthInches: number;
  pageHeightInches: number;
  landscape: boolean;
}

export enum CloseWorkspacesDisposition {
  SELF,
  OTHERS,
  LEFT,
  RIGHT,
}

export interface CloseWorkspacesArgs {
  disposition: CloseWorkspacesDisposition;
  workspaceId?: string;
}
