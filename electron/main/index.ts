'use strict';

import type { MenuItemConstructorOptions } from 'electron';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  protocol,
  screen,
  shell,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import { promises as fs } from 'fs';
import i18next from 'i18next';
import { imageSizeFromFile } from 'image-size/fromFile';
import JSZip from 'jszip';
import mimetypes from 'mime-types';
import path from 'path';
import { debounce } from 'throttle-debounce';

import type { PageSize } from '@/models/PageSetup';

import { initializeI18n, resolveLanguagePreference } from '../../src/i18n';
import type {
  CloseWorkspacesArgs,
  ExportPageAsImageArgs,
  ExportWorkspaceAsHtmlArgs,
  ExportWorkspaceAsImageArgs,
  ExportWorkspaceAsImageReplyArgs,
  ExportWorkspaceAsLatexArgs,
  ExportWorkspaceAsMusicXmlArgs,
  ExportWorkspaceAsPdfArgs,
  FileMenuImportOcrArgs,
  FileMenuInsertTextboxArgs,
  FileMenuOpenImageArgs,
  FileMenuOpenScoreArgs,
  FileMenuViewPaneVisibilityArgs,
  OpenWorkspaceFromArgvArgs,
  PrintWorkspaceArgs,
  SaveWorkspaceArgs,
  SaveWorkspaceAsArgs,
  SaveWorkspaceAsReplyArgs,
  SaveWorkspaceReplyArgs,
  ShowMessageBoxArgs,
} from '../../src/ipc/ipcChannels';
import {
  CloseWorkspacesDisposition,
  IpcMainChannels,
  IpcRendererChannels,
} from '../../src/ipc/ipcChannels';
import type { Score } from '../../src/models/save/v1/Score';
import {
  createDefaultPaneVisibility,
  type WorkspacePaneId,
  type WorkspacePaneVisibility,
} from '../../src/models/WorkspacePane';
import { getSystemFonts } from '../../src/utils/getSystemFonts';
import { TestFileType } from '../../src/utils/TestFileType';

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = path.join(__dirname, '..');
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist');
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST;

const preload = path.join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(process.env.DIST, 'index.html');

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const isDevelopment = import.meta.env.DEV;

const userDataPath = app.getPath('userData');

const maxRecentFiles = 20;
const storeFilePath = path.join(userDataPath, 'settings.json');

const isMac = process.platform === 'darwin';
const silentPdf = process.argv.includes('--silent-pdf');
const silentHtml = process.argv.includes('--silent-html');
const silentLatex = process.argv.includes('--silent-latex');
const silentLatexIncludeModeKeys = process.argv.includes(
  '--latex-include-mode-keys',
);
const silentLatexIncludeTextBoxes = process.argv.includes(
  '--latex-include-text-boxes',
);
const silent = silentPdf || silentLatex || silentHtml;

const disableUpdates = process.argv.includes('--no-update');
const fakeUpdateMode = process.env.FAKE_UPDATE_AVAILABLE === '1';

let win: BrowserWindow | null = null;
let readyToExit = false;
let creatingWindow = false;
let quitting = false;
let paneMenuVisibility = createDefaultPaneVisibility();

const paneMenuItemIds: Record<WorkspacePaneId, string> = {
  'common-combos': 'view-pane-common-combos',
  'neume-selector': 'view-pane-neume-selector',
  lyrics: 'view-pane-lyrics',
  properties: 'view-pane-properties',
  selection: 'view-pane-selection',
};
let updateAvailable = false;
let updateDownloaded = false;
let updateDownloadInProgress = false;
let pendingUpdateVersion: string | undefined;
let didReportUpdateError = false;
let fakeDownloadProgressTimer: NodeJS.Timeout | null = null;

const minWidth = 800;
const minHeight = 600;

interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
  maximized: boolean;
}

interface Store {
  recentFiles: string[];
  windowState: WindowState;
  lastDirectory?: string;
  language?: string;
}

const defaultWindowState: WindowState = {
  width: 800,
  height: 600,
  x: 0,
  y: 0,
  maximized: true,
};

const defaultStore = {
  recentFiles: [],
  windowState: defaultWindowState,
};

const store: Store = defaultStore;

interface SecondInstanceData {
  argv: string[];
}

enum OnConflictChoice {
  Replace = 0,
  ReplaceAll = 1,
  Skip = 2,
  SkipAll = 3,
}

let saving = false;
let exporting = false;
let loaded = false;

let exportAsImageOnConflict: OnConflictChoice | null = null;

let darwinPath: string | null = null;
let autoUpdaterInitialized = false;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: { secure: true, standard: true, supportFetchAPI: true },
  },
]);

if (
  !app.requestSingleInstanceLock({ argv: process.argv } as SecondInstanceData)
) {
  app.exit();
}

const debouncedSaveWindowState = debounce(500, saveStore);

async function generateFilePath(filename: string) {
  let targetDirectory = app.getPath('home');

  if (store.lastDirectory != null) {
    try {
      const stat = await fs.stat(store.lastDirectory);

      if (stat.isDirectory()) {
        targetDirectory = store.lastDirectory;
      }
    } catch {
      // ignore
    }
  }

  return path.join(targetDirectory, filename);
}

// Returns the source path with its extension swapped for the given one,
// keeping the same directory and base name (e.g. /scores/song.byz -> /scores/song.pdf).
function replaceExtension(filePath: string, extension: string) {
  const directory = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));
  return path.join(directory, `${baseName}.${extension}`);
}

// Computes the default path for an export save dialog. When the score has been
// saved, the export defaults to the score's own folder and base name with the
// export's extension. Otherwise it falls back to the last-used directory.
async function getExportDefaultPath(
  sourceFilePath: string | null,
  tempFileName: string,
  extension: string,
) {
  return sourceFilePath != null
    ? replaceExtension(sourceFilePath, extension)
    : await generateFilePath(`${tempFileName}.${extension}`);
}

function sendToRenderer(channel: IpcMainChannels, payload?: unknown) {
  if (win == null || !loaded) {
    return;
  }

  win.webContents.send(channel, payload);
}

function sendPendingUpdateState() {
  if (updateDownloaded) {
    sendToRenderer(IpcMainChannels.UpdateDownloaded, {
      version: pendingUpdateVersion,
    });
    return;
  }

  if (updateDownloadInProgress) {
    sendToRenderer(IpcMainChannels.UpdateDownloadStarted);
    return;
  }

  if (updateAvailable) {
    sendToRenderer(IpcMainChannels.UpdateAvailable, {
      version: pendingUpdateVersion,
    });
  }
}

function clearFakeDownloadProgressTimer() {
  if (fakeDownloadProgressTimer != null) {
    clearInterval(fakeDownloadProgressTimer);
    fakeDownloadProgressTimer = null;
  }
}

function simulateFakeUpdateDownload() {
  const progressSteps = [18, 42, 69, 91, 100];
  const total = 100;
  let stepIndex = 0;

  clearFakeDownloadProgressTimer();

  fakeDownloadProgressTimer = setInterval(() => {
    if (win == null || !loaded || !updateDownloadInProgress) {
      clearFakeDownloadProgressTimer();
      return;
    }

    const percent = progressSteps[stepIndex] ?? 100;
    const transferred = percent;

    sendToRenderer(IpcMainChannels.UpdateDownloadProgress, {
      percent,
      transferred,
      total,
    });

    stepIndex += 1;

    if (percent >= 100) {
      clearFakeDownloadProgressTimer();
      updateDownloaded = true;
      updateDownloadInProgress = false;
      sendToRenderer(IpcMainChannels.UpdateDownloaded, {
        version: pendingUpdateVersion,
      });
    }
  }, 250);
}

function setupAutoUpdater() {
  if (autoUpdaterInitialized) {
    return;
  }

  autoUpdaterInitialized = true;

  if (fakeUpdateMode) {
    updateAvailable = true;
    updateDownloaded = false;
    updateDownloadInProgress = false;
    pendingUpdateVersion = undefined;
    didReportUpdateError = false;
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('update-available', (info) => {
    updateAvailable = true;
    updateDownloaded = false;
    updateDownloadInProgress = false;
    pendingUpdateVersion = info.version;
    didReportUpdateError = false;

    sendToRenderer(IpcMainChannels.UpdateAvailable, {
      version: info.version,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    updateDownloaded = true;
    updateDownloadInProgress = false;
    pendingUpdateVersion = info.version;
    didReportUpdateError = false;

    sendToRenderer(IpcMainChannels.UpdateDownloaded, {
      version: info.version,
    });
  });

  autoUpdater.on('download-progress', (info) => {
    sendToRenderer(IpcMainChannels.UpdateDownloadProgress, {
      percent: info.percent,
      transferred: info.transferred,
      total: info.total,
    });
  });

  autoUpdater.on('error', (error) => {
    const shouldReportError =
      updateDownloadInProgress || updateAvailable || updateDownloaded;

    updateDownloadInProgress = false;

    if (!shouldReportError || didReportUpdateError) {
      return;
    }

    didReportUpdateError = true;

    sendToRenderer(IpcMainChannels.UpdateError, {
      message: error == null ? 'Unable to update.' : error.message,
    });
  });
}

async function loadStore() {
  try {
    Object.assign(store, JSON.parse(await fs.readFile(storeFilePath, 'utf8')));
  } catch {
    // Return default file
    return defaultStore;
  }
}

async function saveStore() {
  try {
    if (win != null) {
      if (!win.isMinimized() && !win.isMaximized()) {
        Object.assign(store.windowState, getCurrentPosition());
      }

      store.windowState.maximized = win.isMaximized();
    }

    await fs.writeFile(storeFilePath, JSON.stringify(store));
  } catch (error) {
    console.error(error);
  }
}

async function showReplaceFileDialog(filePath: string) {
  try {
    await fs.stat(filePath);

    const replaceFileResult = await dialog.showMessageBox(win!, {
      type: 'question',
      title: 'Replace file?',
      message: `A file named "${path.basename(
        filePath,
      )}" already exists. Do you want to replace it?`,
      buttons: ['Cancel', 'Replace'],
      defaultId: 0,
      cancelId: 0,
    });

    return replaceFileResult.response === 1;
  } catch {
    // ignore
  }

  return true;
}

async function showReplaceOrSkipFileDialog(filePath: string) {
  try {
    await fs.stat(filePath);

    const replaceFileResult = await dialog.showMessageBox(win!, {
      type: 'question',
      title: 'Replace file?',
      message: `A file named "${path.basename(
        filePath,
      )}" already exists. Do you want to replace it?`,
      buttons: ['Replace', 'Replace all', 'Skip', 'Skip all'],
      defaultId: 0,
      cancelId: 2,
    });

    return replaceFileResult.response as OnConflictChoice;
  } catch {
    // ignore
  }

  return OnConflictChoice.Replace;
}

async function addToRecentFiles(filePath: string) {
  // This is probably overkill, but we'll load the store first
  // to get the most recent store, just in case there are multiple
  // instances of the app running. This will keep the recent files
  // in sync across all the apps.
  // Concurrency should probably be handled better, but it's
  // an edge case.
  await loadStore();

  // Remove the file from the list if it already exists
  store.recentFiles = store.recentFiles.filter((x) => x !== filePath);
  // Add the file to the beginning of the list
  store.recentFiles.unshift(filePath);
  // Trim off files at the end if there are too many
  store.recentFiles = store.recentFiles.slice(0, maxRecentFiles);

  await saveStore();
}

async function writeScoreFile(filePath: string, score: Score) {
  // If using the compressed file format, zip first
  if (path.extname(filePath) === '.byz') {
    const zip = new JSZip();

    const unzippedFileName = `${path.basename(filePath, '.byz')}.byzx`;

    const data = JSON.stringify(score);

    zip.file(unzippedFileName, data);

    const file = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    await fs.writeFile(filePath, file);
  } else {
    // For uncompressed files, and white space and indentation
    // to make the file easier to read
    const data = JSON.stringify(score, null, 2);
    await fs.writeFile(filePath, data);
  }
}

async function readScoreFile(filePath: string) {
  let data: string;

  // If using the compressed file format, zip first
  if (path.extname(filePath) === '.byz') {
    const file = await fs.readFile(filePath);
    const zip = await JSZip.loadAsync(file);
    data = await zip.file(/\.(byzx)$/)[0].async('text');
  } else if (path.extname(filePath) === '.byzx') {
    data = await fs.readFile(filePath, 'utf8');
  } else {
    throw `Unsupported file type: ${path.extname(filePath)}`;
  }

  return data;
}

async function openFile(filePath: string) {
  const data = await readScoreFile(filePath);

  if (!silent) {
    await addToRecentFiles(filePath);

    createMenu();
  }

  return data;
}

async function openFileFromArgs(argv: string[]) {
  const result: FileMenuOpenScoreArgs[] = [];

  // Check whether a file was passed to the app.
  // See https://github.com/electron/electron/issues/4690#issuecomment-422617581
  // for why the special case for isPackaged is needed.
  if (app.isPackaged) {
    // workaround for missing executable argument)
    argv.unshift('');
  }

  // parameters is now an array containing any files/folders that your OS will pass to your application
  const parameters = argv.slice(2);

  for (const parameter of parameters) {
    // Ignore CLI paramters
    if (parameter.startsWith('--')) {
      continue;
    }

    try {
      result.push({
        data: await openFile(parameter),
        filePath: parameter,
        success: true,
      });
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        dialog.showMessageBox(win!, {
          type: 'error',
          title: 'Open failed',
          message: error.message,
        });
      }
    }
  }

  return {
    files: result,
    silentPdf,
    silentHtml,
    silentLatex,
    silentLatexIncludeModeKeys,
    silentLatexIncludeTextBoxes,
  } as OpenWorkspaceFromArgvArgs;
}

async function saveWorkspace(args: SaveWorkspaceArgs) {
  const result: SaveWorkspaceReplyArgs = { success: false };

  try {
    if (saving) {
      return false;
    }

    saving = true;

    await writeScoreFile(args.filePath, args.data);

    result.success = true;
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win!, {
        type: 'error',
        title: 'Save failed',
        message: error.message,
      });
    }
  } finally {
    saving = false;
  }

  return result;
}

async function saveWorkspaceAs(args: SaveWorkspaceAsArgs) {
  const result: SaveWorkspaceAsReplyArgs = { success: false, filePath: '' };

  try {
    if (saving) {
      return false;
    }

    saving = true;

    const dialogResult = await dialog.showSaveDialog(win!, {
      title: 'Save Score',
      defaultPath: args.filePath || (await generateFilePath(args.tempFileName)),
      properties: ['showOverwriteConfirmation'],
      filters: [
        {
          name: `${app.name} File`,
          extensions: ['byz'],
        },
        {
          name: `Uncompressed ${app.name} File`,
          extensions: ['byzx'],
        },
      ],
    });

    if (!dialogResult.canceled) {
      result.filePath = dialogResult.filePath!;

      // Hack for Linux: if the filepath doesn't end with the proper extension,
      // then add it
      // See https://github.com/electron/electron/issues/21935
      let doWrite = true;

      if (
        !result.filePath.endsWith('.byz') &&
        !result.filePath.endsWith('.byzx')
      ) {
        result.filePath += '.byz';

        doWrite = await showReplaceFileDialog(result.filePath);
      }

      if (doWrite) {
        await writeScoreFile(result.filePath, args.data);

        await addToRecentFiles(result.filePath);
        createMenu();

        result.success = true;

        store.lastDirectory = path.dirname(result.filePath);
        await saveStore();
      }
    }
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win!, {
        type: 'error',
        title: 'Save As failed',
        message: error.message,
      });
    }
  } finally {
    saving = false;
  }

  return result;
}

async function openImage() {
  const result: FileMenuOpenImageArgs = {
    filePath: '',
    data: '',
    imageHeight: 0,
    imageWidth: 0,
    success: false,
  };

  try {
    const dialogResult = await dialog.showOpenDialog(win!, {
      properties: ['openFile'],
      title: 'Insert Image',
      filters: [
        {
          name: `All image types`,
          extensions: [
            'bmp',
            'jpg',
            'jpeg',
            'jpe',
            'png',
            'gif',
            'svg',
            'webp',
            'ico',
          ],
        },
      ],
    });

    if (!dialogResult.canceled) {
      const filePath = dialogResult.filePaths[0];

      const mimeType = mimetypes.lookup(filePath);
      const base64 = await fs.readFile(filePath, { encoding: 'base64' });

      result.data = `data:${mimeType};base64,${base64}`;

      result.filePath = filePath;
      result.success = true;

      try {
        const dimensions = await imageSizeFromFile(filePath);

        result.imageHeight = dimensions?.height ?? 0;
        result.imageWidth = dimensions?.width ?? 0;
      } catch {
        console.error(
          'Could not read dimensions of image. Defaulting to 100x100.',
        );
        result.imageHeight = 100;
        result.imageWidth = 100;
      }
    }
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win!, {
        type: 'error',
        title: 'Open image failed',
        message: error.message,
      });
    }
  }

  return result;
}

async function openOcrFile() {
  const result: FileMenuImportOcrArgs = {
    filePath: '',
    data: '',
    success: false,
  };

  try {
    const dialogResult = await dialog.showOpenDialog(win!, {
      properties: ['openFile'],
      title: 'Import OCR Result',
      filters: [
        {
          name: `OCR File`,
          extensions: ['byzocr'],
        },
      ],
    });

    if (!dialogResult.canceled) {
      const filePath = dialogResult.filePaths[0];

      result.data = await fs.readFile(filePath, { encoding: 'utf8' });

      result.filePath = filePath;
      result.success = true;
    }
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      await dialog.showMessageBox(win!, {
        type: 'error',
        title: 'Open OCR file failed',
        message: error.message,
      });
    }
  }

  return result;
}

function getPageSize(pageSize: PageSize, width: number, height: number) {
  switch (pageSize) {
    case 'Half-Legal':
      return {
        width: 7,
        height: 8.5,
      };
    case 'Half-Letter':
      return {
        width: 5.5,
        height: 8.5,
      };
    case 'Custom':
      return {
        width,
        height,
      };
    default:
      return pageSize;
  }
}

let silentPdfSuccessCount = 0;
let silentPdfFailCount = 0;

async function exportWorkspaceAsPdf(args: ExportWorkspaceAsPdfArgs) {
  try {
    if (exporting || !win) {
      return;
    }

    if (silentPdf) {
      try {
        const data = await win.webContents.printToPDF({
          pageSize: getPageSize(
            args.pageSize,
            args.pageWidthInches,
            args.pageHeightInches,
          ),
          landscape: args.landscape,
        });
        const newPath = replaceExtension(args.filePath!, 'pdf');

        await fs.writeFile(newPath, data);
        silentPdfSuccessCount++;
        console.log(`DONE ${args.filePath} => ${newPath}`);
      } catch (error) {
        silentPdfFailCount++;
        console.error(`FAIL ${args.filePath} | ${error}`);
      }

      return;
    }

    exporting = true;

    const dialogResult = await dialog.showSaveDialog(win, {
      title: 'Export Score as PDF',
      filters: [{ name: 'PDF File', extensions: ['pdf'] }],
      properties: ['showOverwriteConfirmation'],
      defaultPath: await getExportDefaultPath(
        args.filePath,
        args.tempFileName,
        'pdf',
      ),
    });

    if (!dialogResult.canceled) {
      let filePath = dialogResult.filePath;

      // Hack for Linux: if the filepath doesn't end with the proper extension,
      // then add it
      // See https://github.com/electron/electron/issues/21935
      let doWrite = true;

      if (!filePath.endsWith('.pdf')) {
        filePath += '.pdf';

        doWrite = await showReplaceFileDialog(filePath);
      }

      if (doWrite) {
        const data = await win.webContents.printToPDF({
          pageSize: getPageSize(
            args.pageSize,
            args.pageWidthInches,
            args.pageHeightInches,
          ),
          landscape: args.landscape,
        });
        await fs.writeFile(filePath, data);

        const openError = await shell.openPath(filePath);
        if (openError) {
          // The file has already been written successfully; failing to open it
          // afterward is not an export failure, so just log it.
          console.error(`Failed to open ${filePath}: ${openError}`);
        }

        store.lastDirectory = path.dirname(filePath);
        await saveStore();
      }
    }
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win!, {
        type: 'error',
        title: 'Export to PDF failed',
        message: error.message,
      });
    }
  } finally {
    exporting = false;
  }
}

let silentHtmlSuccessCount = 0;
let silentHtmlFailCount = 0;

async function exportWorkspaceAsHtml(args: ExportWorkspaceAsHtmlArgs) {
  try {
    if (saving || !win) {
      return false;
    }

    if (silentHtml) {
      try {
        const newPath = replaceExtension(args.filePath!, 'html');

        await fs.writeFile(newPath, args.data);
        silentHtmlSuccessCount++;
        console.log(`DONE ${args.filePath} => ${newPath}`);
      } catch (error) {
        silentHtmlFailCount++;
        console.error(`FAIL ${args.filePath} | ${error}`);
      }

      return;
    }

    saving = true;

    const dialogResult = await dialog.showSaveDialog(win!, {
      title: 'Export Score as HTML',
      defaultPath: await getExportDefaultPath(
        args.filePath,
        args.tempFileName,
        'html',
      ),
      properties: ['showOverwriteConfirmation'],
      filters: [
        {
          name: `HTML File`,
          extensions: ['html'],
        },
      ],
    });

    if (!dialogResult.canceled) {
      let filePath = dialogResult.filePath;

      // Hack for Linux: if the filepath doesn't end with the proper extension,
      // then add it
      // See https://github.com/electron/electron/issues/21935
      let doWrite = true;

      if (!filePath.endsWith('.html')) {
        filePath += '.html';

        doWrite = await showReplaceFileDialog(filePath);
      }

      if (doWrite) {
        await fs.writeFile(filePath, args.data);

        const openError = await shell.openPath(filePath);
        if (openError) {
          // The file has already been written successfully; failing to open it
          // afterward is not an export failure, so just log it.
          console.error(`Failed to open ${filePath}: ${openError}`);
        }

        store.lastDirectory = path.dirname(filePath);
        await saveStore();
      }
    }
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win!, {
        type: 'error',
        title: 'Export as HTML failed',
        message: error.message,
      });
    }
  } finally {
    saving = false;
  }
}

async function exportWorkspaceAsMusicXml(args: ExportWorkspaceAsMusicXmlArgs) {
  try {
    if (saving) {
      return false;
    }

    saving = true;

    const extension = args.compressed ? 'mxl' : 'musicxml';

    const dialogResult = await dialog.showSaveDialog(win!, {
      title: 'Export Score as MusicXML',
      defaultPath: await getExportDefaultPath(
        args.filePath,
        args.tempFileName,
        extension,
      ),
      properties: ['showOverwriteConfirmation'],
      filters: [
        {
          name: args.compressed
            ? 'Compressed MusicXML File'
            : 'Uncompressed MusicXML File',
          extensions: [extension],
        },
      ],
    });

    if (!dialogResult.canceled) {
      let filePath = dialogResult.filePath;

      // Hack for Linux: if the filepath doesn't end with the proper extension,
      // then add it
      // See https://github.com/electron/electron/issues/21935
      let doWrite = true;

      if (!filePath.endsWith(`.${extension}`)) {
        filePath += `.${extension}`;

        doWrite = await showReplaceFileDialog(filePath);
      }

      if (doWrite) {
        await fs.writeFile(filePath, args.data);

        if (args.openFolder) {
          shell.showItemInFolder(filePath);
        }

        store.lastDirectory = path.dirname(filePath);
        await saveStore();
      }
    }
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win!, {
        type: 'error',
        title: 'Export as MusicXML failed',
        message: error.message,
      });
    }
  } finally {
    saving = false;
  }
}

let silentLatexSuccessCount = 0;
let silentLatexFailCount = 0;

async function exportWorkspaceAsLatex(args: ExportWorkspaceAsLatexArgs) {
  try {
    if (saving) {
      return false;
    }

    if (silentLatex) {
      try {
        const newPath = replaceExtension(args.filePath!, 'byztex');

        await fs.writeFile(newPath, args.data);
        silentLatexSuccessCount++;
        console.log(`DONE ${args.filePath} => ${newPath}`);
      } catch (error) {
        silentLatexFailCount++;
        console.error(`FAIL ${args.filePath} | ${error}`);
      }

      return;
    }

    saving = true;

    const dialogResult = await dialog.showSaveDialog(win!, {
      title: 'Export Score as Latex',
      defaultPath: await getExportDefaultPath(
        args.filePath,
        args.tempFileName,
        'byztex',
      ),
      properties: ['showOverwriteConfirmation'],
      filters: [
        {
          name: 'neanestex File',
          extensions: ['byztex'],
        },
      ],
    });

    if (!dialogResult.canceled) {
      let filePath = dialogResult.filePath;

      // Hack for Linux: if the filepath doesn't end with the proper extension,
      // then add it
      // See https://github.com/electron/electron/issues/21935
      let doWrite = true;

      if (!filePath.endsWith('.byztex')) {
        filePath += '.byztex';

        doWrite = await showReplaceFileDialog(filePath);
      }

      if (doWrite) {
        await fs.writeFile(filePath, args.data);

        store.lastDirectory = path.dirname(filePath);
        await saveStore();
      }
    }
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win!, {
        type: 'error',
        title: 'Export as Latex failed',
        message: error.message,
      });
    }
  } finally {
    saving = false;
  }
}

async function exportWorkspaceAsImage(args: ExportWorkspaceAsImageArgs) {
  const result = {
    filePath: args.filePath,
    success: false,
  } as ExportWorkspaceAsImageReplyArgs;

  try {
    if (saving) {
      return result;
    }

    saving = true;

    const dialogResult = await dialog.showSaveDialog(win!, {
      title: 'Export Score as Images',
      defaultPath: await getExportDefaultPath(
        args.filePath,
        args.tempFileName,
        args.imageFormat,
      ),
      filters: [
        {
          name: args.imageFormat === 'png' ? `PNG File` : `SVG File`,
          extensions: [args.imageFormat],
        },
      ],
    });

    if (!dialogResult.canceled) {
      let filePath = dialogResult.filePath;
      if (!filePath.endsWith(`.${args.imageFormat}`)) {
        filePath += `.${args.imageFormat}`;
      }

      result.filePath = filePath;
      result.success = true;
      exportAsImageOnConflict = null;

      store.lastDirectory = path.dirname(filePath);
      await saveStore();
    }

    return result;
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win!, {
        type: 'error',
        title: 'Export as Image failed',
        message: error.message,
      });
    }

    return result;
  } finally {
    saving = false;
  }
}

async function exportPageAsImage(args: ExportPageAsImageArgs) {
  try {
    if (saving || exportAsImageOnConflict === OnConflictChoice.SkipAll) {
      return false;
    }

    saving = true;

    if (exportAsImageOnConflict !== OnConflictChoice.ReplaceAll) {
      exportAsImageOnConflict = await showReplaceOrSkipFileDialog(
        args.filePath,
      );

      if (exportAsImageOnConflict === OnConflictChoice.SkipAll) {
        return false;
      }
    }

    if (
      exportAsImageOnConflict === OnConflictChoice.ReplaceAll ||
      exportAsImageOnConflict === OnConflictChoice.Replace
    ) {
      await fs.writeFile(args.filePath, args.data, 'base64');
    }

    return true;
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win!, {
        type: 'error',
        title: 'Export as Image failed',
        message: error.message,
      });
    }
  } finally {
    saving = false;
  }
}

async function printWorkspace(args: PrintWorkspaceArgs) {
  return new Promise((resolve) => {
    try {
      if (!win) {
        resolve({ success: false });
        return;
      }

      win.webContents.print(
        {
          pageSize: getPageSize(
            args.pageSize,
            args.pageWidthInches,
            args.pageHeightInches,
          ),
          landscape: args.landscape,
        },
        (success, failureReason) => {
          if (
            !success &&
            failureReason !== 'cancelled' &&
            failureReason !== 'Print job canceled'
          ) {
            dialog.showMessageBox(win!, {
              type: 'error',
              title: 'Print failed',
              message: failureReason,
            });
          }
          resolve({ success, failureReason });
        },
      );
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        dialog.showMessageBox(win!, {
          type: 'error',
          title: 'Print failed',
          message: error.message,
        });
      }

      resolve({ success: false });
    }
  });
}

async function openWorkspaces() {
  const workspaces: FileMenuOpenScoreArgs[] = [];

  try {
    const dialogResult = await dialog.showOpenDialog(win!, {
      properties: ['openFile', 'multiSelections'],
      title: 'Open Score',
      filters: [
        {
          name: `${app.name} Files`,
          extensions: ['byz', 'byzx'],
        },
      ],
    });

    if (!dialogResult.canceled) {
      for (const filePath of dialogResult.filePaths) {
        workspaces.push({
          data: await openFile(filePath),
          filePath: filePath,
          success: true,
        });
      }
    }
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win!, {
        type: 'error',
        title: 'Open failed',
        message: error.message,
      });
    }
  }

  return workspaces;
}

const getCurrentPosition = () => {
  const position = win!.getPosition();
  const size = win!.getSize();
  return {
    x: position[0],
    y: position[1],
    width: size[0],
    height: size[1],
  };
};

function windowWithinBounds(
  windowState: WindowState,
  bounds: Electron.Rectangle,
) {
  return (
    windowState.x >= bounds.x &&
    windowState.y >= bounds.y &&
    windowState.x + windowState.width <= bounds.x + bounds.width &&
    windowState.y + windowState.height <= bounds.y + bounds.height
  );
}

function resetToDefaults() {
  const bounds = screen.getPrimaryDisplay().bounds;
  return Object.assign({}, defaultWindowState, {
    x: Math.max(0, (bounds.width - defaultWindowState.width) / 2),
    y: Math.max(0, (bounds.height - defaultWindowState.height) / 2),
  });
}

function ensureVisibleOnSomeDisplay(windowState: WindowState) {
  const visible = screen.getAllDisplays().some((display) => {
    return windowWithinBounds(windowState, display.bounds);
  });
  if (!visible) {
    // Window is partially or fully not visible now.
    // Reset it to safe defaults.
    return resetToDefaults();
  }
  return windowState;
}

function syncPaneMenuItems(visibility: WorkspacePaneVisibility) {
  paneMenuVisibility = {
    ...paneMenuVisibility,
    ...visibility,
  };

  const menu = Menu.getApplicationMenu();

  if (menu == null) {
    return;
  }

  (Object.entries(visibility) as Array<[WorkspacePaneId, boolean]>).forEach(
    ([paneId, isVisible]) => {
      const item = menu.getMenuItemById(paneMenuItemIds[paneId]);

      if (item != null) {
        item.checked = isVisible;
      }
    },
  );
}

function createPaneMenuItem(
  paneId: WorkspacePaneId,
  label: string,
  accelerator?: string,
): MenuItemConstructorOptions {
  return {
    accelerator,
    checked: paneMenuVisibility[paneId],
    id: paneMenuItemIds[paneId],
    label,
    type: 'checkbox',
    click(menuItem) {
      const requestedVisibility = menuItem.checked;

      menuItem.checked = paneMenuVisibility[paneId];
      win?.webContents.send(IpcMainChannels.FileMenuViewPaneVisibility, {
        paneId,
        visible: requestedVisibility,
      } as FileMenuViewPaneVisibilityArgs);
    },
  };
}

function createMenu() {
  const menu = Menu.buildFromTemplate([
    ...(isMac
      ? ([
          {
            label: app.name,
            submenu: [
              {
                label: `About ${app.name}`,
                click() {
                  void openAboutDialog();
                },
              },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ] as MenuItemConstructorOptions[])
      : []),
    {
      label: i18next.t(($) => $.menu.file.root),
      submenu: [
        {
          label: i18next.t(($) => $.menu.file.new),
          accelerator: 'CmdOrCtrl+N',
          click() {
            if (!win) {
              createWindow();
            }

            win?.webContents.send(IpcMainChannels.FileMenuNewScore);
          },
        },
        {
          label: i18next.t(($) => $.menu.file.open),
          accelerator: 'CmdOrCtrl+O',
          async click() {
            const workspaces: FileMenuOpenScoreArgs[] = await openWorkspaces();

            for (const workspace of workspaces) {
              if (!win && workspace.success) {
                darwinPath = workspace.filePath;
                createWindow();
              } else {
                win?.webContents.send(
                  IpcMainChannels.FileMenuOpenScore,
                  workspace,
                );
              }
            }
          },
        },
        {
          id: 'recentfiles',
          label: i18next.t(($) => $.menu.file.openRecent),
          submenu: store.recentFiles.map((x, index) => ({
            label: `${index + 1}: ${x}`,
            async click() {
              try {
                const data = await openFile(x);

                if (!win) {
                  darwinPath = x;
                  createWindow();
                } else {
                  win?.webContents.send(IpcMainChannels.FileMenuOpenScore, {
                    filePath: x,
                    data,
                    success: true,
                  } as FileMenuOpenScoreArgs);
                }
              } catch (error) {
                console.error(error);

                if (error instanceof Error) {
                  dialog.showMessageBox(win!, {
                    type: 'error',
                    title: 'Open failed',
                    message: error.message,
                  });
                }
              }
            },
          })),
        },
        {
          label: i18next.t(($) => $.menu.file.import),
          submenu: [
            {
              label: i18next.t(($) => $.menu.file.importFromOcr),
              async click() {
                const data = await openOcrFile();

                if (data.success) {
                  win?.webContents.send(
                    IpcMainChannels.FileMenuImportOcr,
                    data,
                  );
                }
              },
            },
          ],
        },
        {
          label: i18next.t(($) => $.menu.file.save),
          accelerator: 'CmdOrCtrl+S',
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuSave);
          },
        },
        {
          label: i18next.t(($) => $.menu.file.saveAs),
          accelerator: 'CmdOrCtrl+Shift+S',
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuSaveAs);
          },
        },
        { type: 'separator' },
        {
          label: i18next.t(($) => $.menu.file.pageSetup),
          accelerator: 'CmdOrCtrl+Shift+P',
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuPageSetup);
          },
        },
        {
          label: i18next.t(($) => $.menu.file.exportAsPdf),
          accelerator: 'CmdOrCtrl+E',
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuExportAsPdf);
          },
        },
        {
          label: i18next.t(($) => $.menu.file.exportAs),
          submenu: [
            {
              label: i18next.t(($) => $.menu.file.exportAsHtml),
              accelerator: 'CmdOrCtrl+Shift+E',
              click() {
                win?.webContents.send(IpcMainChannels.FileMenuExportAsHtml);
              },
            },
            {
              label: i18next.t(($) => $.menu.file.exportAsMusicXml),
              click() {
                win?.webContents.send(IpcMainChannels.FileMenuExportAsMusicXml);
              },
            },
            {
              label: i18next.t(($) => $.menu.file.exportAsLatex),
              click() {
                win?.webContents.send(IpcMainChannels.FileMenuExportAsLatex);
              },
            },
            {
              label: i18next.t(($) => $.menu.file.exportAsImage),
              click() {
                win?.webContents.send(IpcMainChannels.FileMenuExportAsImage);
              },
            },
          ],
        },
        {
          label: i18next.t(($) => $.menu.file.print),
          accelerator: 'CmdOrCtrl+P',
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuPrint);
          },
        },
        { type: 'separator' },
        {
          label: i18next.t(($) => $.menu.file.close),
          accelerator: 'CmdOrCtrl+W',
          click() {
            win?.webContents.send(IpcMainChannels.CloseWorkspaces, {
              disposition: CloseWorkspacesDisposition.SELF,
            } as CloseWorkspacesArgs);
          },
        },
        {
          label: i18next.t(($) => $.menu.file.closeOthers),
          click() {
            win?.webContents.send(IpcMainChannels.CloseWorkspaces, {
              disposition: CloseWorkspacesDisposition.OTHERS,
            } as CloseWorkspacesArgs);
          },
        },
        { type: 'separator' },
        { role: isMac ? 'close' : 'quit' },
      ],
    },
    {
      label: i18next.t(($) => $.menu.edit.root),
      submenu: [
        {
          id: 'undo',
          label: i18next.t(($) => $.menu.edit.undo),
          accelerator: 'CmdOrCtrl+Z',
          click(menuItem, browserWindow, event) {
            // The accelerator is handled in the renderer process because of
            // https://github.com/electron/electron/issues/3682.
            if (!event.triggeredByAccelerator) {
              win?.webContents.send(IpcMainChannels.FileMenuUndo);
            }
          },
        },
        {
          id: 'redo',
          label: i18next.t(($) => $.menu.edit.redo),
          accelerator: isMac ? 'CmdOrCtrl+Shift+Z' : 'CmdOrCtrl+Y',
          click(menuItem, browserWindow, event) {
            // The accelerator is handled in the renderer process because of
            // https://github.com/electron/electron/issues/3682.
            if (!event.triggeredByAccelerator) {
              win?.webContents.send(IpcMainChannels.FileMenuRedo);
            }
          },
        },
        { type: 'separator' },
        {
          label: i18next.t(($) => $.menu.edit.cut),
          accelerator: 'CmdOrCtrl+X',
          click(menuItem, browserWindow, event) {
            if (win?.webContents?.isDevToolsFocused()) {
              win.webContents.devToolsWebContents?.cut();
            }

            // The accelerator is handled in the renderer process because of
            // https://github.com/electron/electron/issues/3682.
            if (!event.triggeredByAccelerator) {
              win?.webContents.send(IpcMainChannels.FileMenuCut);
            }
          },
        },
        {
          label: i18next.t(($) => $.menu.edit.copy),
          accelerator: 'CmdOrCtrl+C',
          click(menuItem, browserWindow, event) {
            if (win?.webContents?.isDevToolsFocused()) {
              win.webContents.devToolsWebContents?.copy();
            }
            // The accelerator is handled in the renderer process because of
            // https://github.com/electron/electron/issues/3682.
            if (!event.triggeredByAccelerator) {
              win?.webContents.send(IpcMainChannels.FileMenuCopy);
            }
          },
        },
        {
          label: i18next.t(($) => $.menu.edit.copyAsHtml),
          accelerator: 'CmdOrCtrl+Shift+C',
          click(menuItem, browserWindow, event) {
            // The accelerator is handled in the renderer process because of
            // https://github.com/electron/electron/issues/3682.
            if (!event.triggeredByAccelerator) {
              win?.webContents.send(IpcMainChannels.FileMenuCopyAsHtml);
            }
          },
        },
        {
          label: i18next.t(($) => $.menu.edit.paste),
          accelerator: 'CmdOrCtrl+V',
          click(menuItem, browserWindow, event) {
            if (win?.webContents?.isDevToolsFocused()) {
              win.webContents.devToolsWebContents?.paste();
            }

            // The accelerator is handled in the renderer process because of
            // https://github.com/electron/electron/issues/3682.
            if (!event.triggeredByAccelerator) {
              win?.webContents.send(IpcMainChannels.FileMenuPaste);
            }
          },
        },
        {
          label: i18next.t(($) => $.menu.edit.pasteWithLyrics),
          accelerator: 'CmdOrCtrl+Shift+V',
          click(menuItem, browserWindow, event) {
            // The accelerator is handled in the renderer process because of
            // https://github.com/electron/electron/issues/3682.
            if (!event.triggeredByAccelerator) {
              win?.webContents.send(IpcMainChannels.FileMenuPasteWithLyrics);
            }
          },
        },
        { type: 'separator' },
        {
          label: i18next.t(($) => $.menu.edit.copyFormat),
          accelerator: 'CmdOrCtrl+Shift+R',
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuCopyFormat);
          },
        },
        {
          label: i18next.t(($) => $.menu.edit.pasteFormat),
          accelerator: 'CmdOrCtrl+R',
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuPasteFormat);
          },
        },
        { type: 'separator' },
        {
          label: i18next.t(($) => $.menu.edit.find),
          accelerator: 'CmdOrCtrl+F',
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuFind);
          },
        },
        { type: 'separator' },
        {
          label: i18next.t(($) => $.menu.edit.preferences),
          accelerator: 'CmdOrCtrl+,',
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuPreferences);
          },
        },
      ],
    },
    {
      label: i18next.t(($) => $.menu.insert.root),
      submenu: [
        {
          label: i18next.t(($) => $.menu.insert.alternateLine),
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuInsertAlternateLine);
          },
        },
        {
          label: i18next.t(($) => $.menu.insert.annotation),
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuInsertAnnotation);
          },
        },
        {
          label: i18next.t(($) => $.menu.insert.dropCapBefore),
          accelerator: 'CmdOrCtrl+D',
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuInsertDropCapBefore);
          },
        },
        {
          label: i18next.t(($) => $.menu.insert.dropCapAfter),
          accelerator: 'CmdOrCtrl+Shift+D',
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuInsertDropCapAfter);
          },
        },
        {
          label: i18next.t(($) => $.menu.insert.textBox),
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuInsertTextBox, {
              inline: false,
            } as FileMenuInsertTextboxArgs);
          },
        },
        {
          label: i18next.t(($) => $.menu.insert.richTextBox),
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuInsertRichTextBox);
          },
        },
        {
          label: i18next.t(($) => $.menu.insert.inlineTextBox),
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuInsertTextBox, {
              inline: true,
            } as FileMenuInsertTextboxArgs);
          },
        },
        {
          label: i18next.t(($) => $.menu.insert.modeKey),
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuInsertModeKey);
          },
        },
        {
          label: i18next.t(($) => $.menu.insert.image),
          async click() {
            const data = await openImage();

            if (data.success) {
              win?.webContents.send(IpcMainChannels.FileMenuInsertImage, data);
            }
          },
        },
        { type: 'separator' },
        {
          label: i18next.t(($) => $.menu.insert.headersAndFooters),
          submenu: [
            {
              label: i18next.t(($) => $.menu.insert.header),
              click() {
                win?.webContents.send(IpcMainChannels.FileMenuInsertHeader);
              },
            },
            {
              label: i18next.t(($) => $.menu.insert.footer),
              click() {
                win?.webContents.send(IpcMainChannels.FileMenuInsertFooter);
              },
            },
          ],
        },
      ],
    },
    {
      label: i18next.t(($) => $.menu.view.root),
      submenu: [
        createPaneMenuItem(
          'neume-selector',
          i18next.t(($) => $.menu.view.neumeSelector),
        ),
        createPaneMenuItem(
          'common-combos',
          i18next.t(($) => $.menu.view.commonCombos),
        ),
        createPaneMenuItem(
          'properties',
          i18next.t(($) => $.menu.view.properties),
        ),
        createPaneMenuItem(
          'selection',
          i18next.t(($) => $.menu.view.selection),
        ),
        createPaneMenuItem(
          'lyrics',
          i18next.t(($) => $.menu.edit.lyrics),
          'CmdOrCtrl+L',
        ),
        { type: 'separator' },
        {
          label: i18next.t(($) => $.menu.view.resetLayout),
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuViewResetPaneLayout);
          },
        },
        ...(isDevelopment
          ? ([
              { type: 'separator' },
              { role: 'reload' },
              { role: 'forceReload' },
              { role: 'toggleDevTools' },
              { type: 'separator' },
              { role: 'resetZoom' },
              { role: 'zoomIn' },
              { role: 'zoomOut' },
              { type: 'separator' },
              { role: 'togglefullscreen' },
            ] as MenuItemConstructorOptions[])
          : []),
      ],
    },
    {
      label: i18next.t(($) => $.menu.tools.root),
      submenu: [
        {
          label: i18next.t(($) => $.menu.tools.copyElementLink),
          click() {
            win?.webContents.send(IpcMainChannels.FileMenuToolsCopyElementLink);
          },
        },
      ],
    },
    ...(isDevelopment
      ? [
          {
            label: i18next.t(($) => $.menu.view.generateTestFiles),
            submenu: Object.values(TestFileType).map((testFileType) => ({
              label: testFileType,
              click() {
                if (!win) {
                  createWindow();
                }

                win?.webContents.send(
                  IpcMainChannels.FileMenuGenerateTestFile,
                  testFileType,
                );
              },
            })),
          },
        ]
      : []),
    {
      role: 'help',
      submenu: [
        {
          label: i18next.t(($) => $.menu.help.guide),
          click() {
            shell.openExternal(import.meta.env.VITE_GUIDE_URL);
          },
        },
        { type: 'separator' },
        {
          label: i18next.t(($) => $.menu.help.requestAFeature),
          click() {
            shell.openExternal(import.meta.env.VITE_ISSUES_URL);
          },
        },
        {
          label: i18next.t(($) => $.menu.help.reportAnIssue),
          click() {
            shell.openExternal(import.meta.env.VITE_ISSUES_URL);
          },
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        ...(!isMac
          ? ([
              {
                label: i18next.t(($) => $.menu.help.about),
                click() {
                  void openAboutDialog();
                },
              },
            ] as MenuItemConstructorOptions[])
          : []),
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);
}

async function openAboutDialog() {
  if (!win) {
    await createWindow();
  }

  if (!win) {
    return;
  }

  if (loaded) {
    win.webContents.send(IpcMainChannels.OpenAboutDialog);
  } else {
    win.webContents.once('did-finish-load', () => {
      win?.webContents.send(IpcMainChannels.OpenAboutDialog);
    });
  }

  if (win.isMinimized()) {
    win.restore();
  }

  win.show();
  win.focus();
}

async function createWindow() {
  // Guard against race conditions
  if (creatingWindow) {
    return;
  }

  creatingWindow = true;

  readyToExit = false;

  await loadStore();

  store.windowState = ensureVisibleOnSomeDisplay(store.windowState);

  store.windowState.height = Math.max(minHeight, store.windowState.height);
  store.windowState.width = Math.max(minWidth, store.windowState.width);

  // Create the browser window.
  win = new BrowserWindow({
    ...store.windowState,
    minWidth,
    minHeight,
    webPreferences: {
      preload,
      spellcheck: false,
    },
    icon: path.join(process.env.PUBLIC!, 'favicon-32.png'),
    show: false,
  });

  if (store.windowState.maximized) {
    win.maximize();
  }

  win.on('resize', debouncedSaveWindowState);
  win.on('move', debouncedSaveWindowState);
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (!silent) {
    win.once('ready-to-show', () => {
      win?.show();
    });
  }

  win.webContents.once('did-finish-load', () => {
    loaded = true;
    sendPendingUpdateState();
  });

  // Prevent the user from accidentally
  // closing the app with unsaved changes
  win.on('close', (event) => {
    if (!readyToExit) {
      win?.webContents.send(IpcMainChannels.CloseApplication);
      event.preventDefault();
    }
  });

  win.on('closed', () => {
    win = null;
    loaded = false;
    darwinPath = null;
    clearFakeDownloadProgressTimer();
  });

  createMenu();

  if (process.env.VITE_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(url!);
    if (!process.env.IS_TEST) {
      win.webContents.openDevTools();
    }
  } else {
    // Load the index.html when not in development
    if (!silent && !disableUpdates && !fakeUpdateMode) {
      autoUpdater.checkForUpdates();
    }

    await win.loadFile(indexHtml);
  }

  creatingWindow = false;
}

ipcMain.on(IpcRendererChannels.SetLanguage, async (event, language: string) => {
  store.language = language || undefined;
  await saveStore();
  await i18next.changeLanguage(
    resolveLanguagePreference(store.language, app.getLocale()),
  );
  createMenu();
});

ipcMain.on(IpcRendererChannels.SetCanUndo, async (event, data) => {
  Menu.getApplicationMenu()!.getMenuItemById('undo')!.enabled = data;
});

ipcMain.on(IpcRendererChannels.SetCanRedo, async (event, data) => {
  Menu.getApplicationMenu()!.getMenuItemById('redo')!.enabled = data;
});

ipcMain.on(
  IpcRendererChannels.SetWorkspacePaneVisibility,
  (event, visibility: WorkspacePaneVisibility) => {
    syncPaneMenuItems(visibility);
  },
);

ipcMain.on(IpcRendererChannels.OpenImageDialog, async () => {
  const data = await openImage();

  if (data.success) {
    win?.webContents.send(IpcMainChannels.FileMenuInsertImage, data);
  }
});

ipcMain.handle(IpcRendererChannels.ExitApplication, async () => {
  readyToExit = true;

  if (silentPdf) {
    console.log(`Successfully wrote ${silentPdfSuccessCount} files`);

    if (silentPdfFailCount > 0) {
      console.log(`Failed to write ${silentPdfFailCount} files`);
    }
  }

  if (silentHtml) {
    console.log(`Successfully wrote ${silentHtmlSuccessCount} files`);

    if (silentHtmlFailCount > 0) {
      console.log(`Failed to write ${silentHtmlFailCount} files`);
    }
  }

  if (silentLatex) {
    console.log(`Successfully wrote ${silentLatexSuccessCount} files`);

    if (silentLatexFailCount > 0) {
      console.log(`Failed to write ${silentLatexFailCount} files`);
    }
  }

  // In macOS, there is a distinction between "close" and "quit".
  if (quitting) {
    app.exit();
  } else {
    win?.close();
  }
});

ipcMain.handle(IpcRendererChannels.DownloadUpdate, async () => {
  if (updateDownloaded) {
    sendPendingUpdateState();
    return;
  }

  if (!updateAvailable || updateDownloadInProgress) {
    return;
  }

  if (fakeUpdateMode) {
    updateDownloadInProgress = true;
    didReportUpdateError = false;
    sendToRenderer(IpcMainChannels.UpdateDownloadStarted);
    simulateFakeUpdateDownload();
    return;
  }

  // MacOS requires code-signing in order for auto-update to work.
  // Since we don't code sign, just send the user to the download URL.
  if (isMac) {
    shell.openExternal(import.meta.env.VITE_DOWNLOAD_URL);
    return;
  }

  updateDownloadInProgress = true;
  didReportUpdateError = false;
  sendToRenderer(IpcMainChannels.UpdateDownloadStarted);

  try {
    await autoUpdater.downloadUpdate();
  } catch (error) {
    updateDownloadInProgress = false;
    didReportUpdateError = true;

    sendToRenderer(IpcMainChannels.UpdateError, {
      message:
        error instanceof Error ? error.message : 'Unable to download update.',
    });
  }
});

ipcMain.handle(IpcRendererChannels.RestartToInstallUpdate, async () => {
  if (!updateDownloaded) {
    return;
  }

  if (fakeUpdateMode) {
    console.info(
      'FAKE_UPDATE_AVAILABLE=1: restart-and-install requested; skipping quitAndInstall().',
    );
    return;
  }

  readyToExit = true;
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle(IpcRendererChannels.InstallUpdateOnExit, async () => {
  if (!updateDownloaded) {
    return;
  }

  if (fakeUpdateMode) {
    console.info(
      'FAKE_UPDATE_AVAILABLE=1: install-on-exit requested; skipping autoInstallOnAppQuit.',
    );
    return;
  }

  autoUpdater.autoInstallOnAppQuit = true;
});

ipcMain.handle(IpcRendererChannels.CancelExit, async () => {
  quitting = false;
});

ipcMain.handle(
  IpcRendererChannels.ShowMessageBox,
  async (event, args: ShowMessageBoxArgs) => {
    return await dialog.showMessageBox(win!, {
      type: args.type,
      title: args.title,
      message: args.message,
      detail: args.detail,
      buttons: args.buttons,
    });
  },
);

ipcMain.handle(IpcRendererChannels.ShowItemInFolder, async (event, path) => {
  shell.showItemInFolder(path);
});

ipcMain.handle(
  IpcRendererChannels.SaveWorkspace,
  async (event, args: SaveWorkspaceArgs) => {
    return await saveWorkspace(args);
  },
);

ipcMain.handle(
  IpcRendererChannels.SaveWorkspaceAs,
  async (event, args: SaveWorkspaceAsArgs) => {
    return await saveWorkspaceAs(args);
  },
);

ipcMain.handle(
  IpcRendererChannels.ExportWorkspaceAsPdf,
  async (event, args: ExportWorkspaceAsPdfArgs) => {
    return await exportWorkspaceAsPdf(args);
  },
);

ipcMain.handle(
  IpcRendererChannels.ExportWorkspaceAsHtml,
  async (event, args: ExportWorkspaceAsHtmlArgs) => {
    return await exportWorkspaceAsHtml(args);
  },
);

ipcMain.handle(
  IpcRendererChannels.ExportWorkspaceAsMusicXml,
  async (event, args: ExportWorkspaceAsMusicXmlArgs) => {
    return await exportWorkspaceAsMusicXml(args);
  },
);

ipcMain.handle(
  IpcRendererChannels.ExportWorkspaceAsLatex,
  async (event, args: ExportWorkspaceAsLatexArgs) => {
    return await exportWorkspaceAsLatex(args);
  },
);

ipcMain.handle(
  IpcRendererChannels.ExportWorkspaceAsImage,
  async (event, args: ExportWorkspaceAsImageArgs) => {
    return await exportWorkspaceAsImage(args);
  },
);

ipcMain.handle(
  IpcRendererChannels.ExportPageAsImage,
  async (event, args: ExportPageAsImageArgs) => {
    return await exportPageAsImage(args);
  },
);

ipcMain.handle(
  IpcRendererChannels.PrintWorkspace,
  async (event, args: PrintWorkspaceArgs) => {
    return await printWorkspace(args);
  },
);

ipcMain.handle(IpcRendererChannels.OpenWorkspaceFromArgv, async () => {
  if (isMac && darwinPath != null) {
    const result = {
      data: await openFile(darwinPath),
      filePath: darwinPath,
      success: true,
    };

    return { files: [result], silent: false };
  } else {
    return await openFileFromArgs(process.argv);
  }
});

ipcMain.handle(IpcRendererChannels.GetSystemFonts, async () => {
  let fonts: string[] = [];

  try {
    fonts = await getSystemFonts();
  } catch (error) {
    console.error(error);
  }

  return fonts;
});

ipcMain.handle(IpcRendererChannels.Paste, async () => {
  return await win?.webContents.paste();
});

// macOS-only
// This is called in two cases:
// 1. The app is already running and the user opens a file
// 2. The app is not running and the user opens a file.
// If the app isn't loaded yet, then save the path and wait for the web app
// to tell us it's ready to load the file via the OpenWorkspaceFromArgv channel
app.on('open-file', async (event, path) => {
  darwinPath = path;

  try {
    if (!win) {
      createWindow();
    } else if (loaded) {
      const result = {
        data: await openFile(path),
        filePath: path,
        success: true,
      };

      if (!win) {
        createWindow();
      }

      win?.webContents.send(IpcMainChannels.FileMenuOpenScore, result);

      win?.show();
    }
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win!, {
        type: 'error',
        title: 'Open failed',
        message: error.message,
      });
    }
  }
});

app.on(
  'second-instance',
  async (event, argv, workingDirectory, additionalData: any) => {
    const results = await openFileFromArgs(
      (additionalData as SecondInstanceData).argv,
    );

    if (loaded) {
      results.files
        .filter((x) => x.success)
        .forEach((x) =>
          win?.webContents.send(IpcMainChannels.FileMenuOpenScore, x),
        );

      win?.show();
    } else {
      win?.webContents.once('did-finish-load', () => {
        results.files
          .filter((x) => x.success)
          .forEach((x) =>
            win?.webContents.send(IpcMainChannels.FileMenuOpenScore, x),
          );
      });
    }
  },
);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (!isMac) {
    app.quit();
  }
});

app.on('before-quit', () => {
  quitting = true;
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  // Load the persisted store first so the user's chosen language (if any)
  // is honored when we initialize i18next and build the native menu.
  await loadStore();

  await initializeI18n({
    lng: resolveLanguagePreference(store.language, app.getLocale()),
  });

  setupAutoUpdater();

  if (!win) {
    createWindow();
  }
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
