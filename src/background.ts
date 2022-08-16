'use strict';

import {
  app,
  protocol,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  MenuItemConstructorOptions,
  shell,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import {
  IpcMainChannels,
  IpcRendererChannels,
  ShowMessageBoxArgs,
  SaveWorkspaceArgs,
  SaveWorkspaceAsArgs,
  ExportWorkspaceAsPdfArgs,
  SaveWorkspaceReplyArgs,
  PrintWorkspaceArgs,
  FileMenuOpenScoreArgs,
  SaveWorkspaceAsReplyArgs,
  FileMenuInsertTextboxArgs,
} from './ipc/ipcChannels';
import path from 'path';
import { promises as fs } from 'fs';
import { TestFileType } from './utils/TestFileType';
import { errorMonitor } from 'events';
import { Score } from './models/save/v1/Score';
import fontList from 'font-list';
import { getSystemFonts } from './utils/getSystemFonts';
import JSZip from 'jszip';

const isDevelopment = process.env.NODE_ENV !== 'production';

const userDataPath = app.getPath('userData');

const maxRecentFiles = 20;
const storeFilePath = path.join(userDataPath, 'settings.json');

declare const __static: string;

let win!: BrowserWindow;

interface Store {
  recentFiles: string[];
}

let store: Store = {
  recentFiles: [],
};

interface SecondInstanceData {
  argv: string[];
}

let saving = false;
let exporting = false;
let loaded = false;

let darwinPath: string | null = null;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

if (
  !app.requestSingleInstanceLock({ argv: process.argv } as SecondInstanceData)
) {
  app.exit();
}

async function loadStore() {
  try {
    store = JSON.parse(await fs.readFile(storeFilePath, 'utf8'));
  } catch (error) {
    // Return default file
    return {
      recentFiles: [],
    } as Store;
  }
}

async function saveStore() {
  try {
    await fs.writeFile(storeFilePath, JSON.stringify(store));
  } catch (error) {
    console.error(error);
  }
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

  await addToRecentFiles(filePath);

  createMenu();

  return data;
}

async function openFileFromArgs(argv: string[]) {
  const result: FileMenuOpenScoreArgs[] = [];

  // Check if there a file was passed to the app.
  // See https://github.com/electron/electron/issues/4690#issuecomment-422617581
  // for why the special case for isPackaged is needed.
  if (app.isPackaged) {
    // workaround for missing executable argument)
    argv.unshift('');
  }

  // parameters is now an array containing any files/folders that your OS will pass to your application
  const parameters = argv.slice(2);

  for (let parameter of parameters) {
    try {
      result.push({
        data: await openFile(parameters[0]),
        filePath: parameters[0],
        success: true,
      });
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        dialog.showMessageBox(win, {
          type: 'error',
          title: 'Open failed',
          message: error.message,
        });
      }
    }
  }

  return result;
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
      dialog.showMessageBox(win, {
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

    const dialogResult = await dialog.showSaveDialog(win, {
      title: 'Save Score',
      defaultPath: args.filePath || args.tempFileName,
      filters: [
        {
          name: `${process.env.VUE_APP_TITLE} File`,
          extensions: ['byz'],
        },
        {
          name: `Uncompressed ${process.env.VUE_APP_TITLE} File`,
          extensions: ['byzx'],
        },
      ],
    });

    if (!dialogResult.canceled) {
      result.filePath = dialogResult.filePath!;

      await writeScoreFile(dialogResult.filePath!, args.data);

      await addToRecentFiles(dialogResult.filePath!);
      createMenu();

      result.success = true;
    }
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win, {
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

async function exportWorkspaceAsPdf(args: ExportWorkspaceAsPdfArgs) {
  try {
    if (exporting) {
      return;
    }

    exporting = true;

    const dialogResult = await dialog.showSaveDialog(win, {
      title: 'Export Score as PDF',
      filters: [{ name: 'PDF File', extensions: ['pdf'] }],
      defaultPath:
        args.filePath != null
          ? path.basename(args.filePath, path.extname(args.filePath))
          : args.tempFileName,
    });

    if (!dialogResult.canceled) {
      const data = await win.webContents.printToPDF({
        pageSize: args.pageSize,
        landscape: args.landscape,
      });
      await fs.writeFile(dialogResult.filePath!, data);

      await shell.openPath(dialogResult.filePath!);
    }
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win, {
        type: 'error',
        title: 'Export to PDF failed',
        message: error.message,
      });
    }
  } finally {
    exporting = false;
  }
}

async function printWorkspace(args: PrintWorkspaceArgs) {
  return new Promise((resolve) => {
    try {
      win.webContents.print(
        {
          pageSize: args.pageSize,
          landscape: args.landscape,
        },
        (success, failureReason) => {
          if (!success && failureReason !== 'cancelled') {
            dialog.showMessageBox(win, {
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
        dialog.showMessageBox(win, {
          type: 'error',
          title: 'Print failed',
          message: error.message,
        });
      }

      resolve({ success: false });
    }
  });
}

async function openWorkspace() {
  const result: FileMenuOpenScoreArgs = {
    filePath: '',
    data: '',
    success: false,
  };

  try {
    const dialogResult = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      title: 'Open Score',
      filters: [
        {
          name: `${process.env.VUE_APP_TITLE} Files`,
          extensions: ['byz', 'byzx'],
        },
      ],
    });

    if (!dialogResult.canceled) {
      const filePath = dialogResult.filePaths[0];
      result.data = await openFile(filePath);
      result.filePath = filePath;
      result.success = true;
    }
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win, {
        type: 'error',
        title: 'Open failed',
        message: error.message,
      });
    }
  }

  return result;
}

function createMenu() {
  var menu = Menu.buildFromTemplate([
    {
      label: '&File',
      submenu: [
        {
          label: '&New',
          accelerator: 'CmdOrCtrl+N',
          click() {
            win.webContents.send(IpcMainChannels.FileMenuNewScore);
          },
        },
        {
          label: '&Open',
          accelerator: 'CmdOrCtrl+O',
          async click() {
            win.webContents.send(
              IpcMainChannels.FileMenuOpenScore,
              await openWorkspace(),
            );
          },
        },
        {
          id: 'recentfiles',
          label: 'Open Recent',
          submenu: store.recentFiles.map((x, index) => ({
            label: `${index + 1}: ${x}`,
            async click() {
              try {
                const data = await openFile(x);

                win.webContents.send(IpcMainChannels.FileMenuOpenScore, {
                  filePath: x,
                  data,
                  success: true,
                } as FileMenuOpenScoreArgs);
              } catch (error) {
                console.error(error);

                if (error instanceof Error) {
                  dialog.showMessageBox(win, {
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
          label: '&Save',
          accelerator: 'CmdOrCtrl+S',
          click() {
            win.webContents.send(IpcMainChannels.FileMenuSave);
          },
        },
        {
          label: 'Save &As',
          accelerator: 'CmdOrCtrl+Shift+S',
          click() {
            win.webContents.send(IpcMainChannels.FileMenuSaveAs);
          },
        },
        { type: 'separator' },
        {
          label: 'Page Setup',
          click() {
            win.webContents.send(IpcMainChannels.FileMenuPageSetup);
          },
        },
        {
          label: '&Export as PDF',
          accelerator: 'CmdOrCtrl+E',
          click() {
            win.webContents.send(IpcMainChannels.FileMenuExportAsPdf);
          },
        },
        {
          label: '&Print',
          accelerator: 'CmdOrCtrl+P',
          click() {
            win.webContents.send(IpcMainChannels.FileMenuPrint);
          },
        },
        { type: 'separator' },
        {
          label: 'E&xit',
          accelerator: 'Alt+F4',
          click() {
            app.quit();
          },
        },
      ],
    },
    {
      label: '&Edit',
      submenu: [
        {
          id: 'undo',
          label: '&Undo',
          accelerator: 'CmdOrCtrl+Z',
          click(menuItem, browserWindow, event) {
            // The accelerator is handled in the renderer process because of
            // https://github.com/electron/electron/issues/3682.
            if (!event.triggeredByAccelerator) {
              win.webContents.send(IpcMainChannels.FileMenuUndo);
            }
          },
        },
        {
          id: 'redo',
          label: '&Redo',
          accelerator: 'CmdOrCtrl+Y',
          click(menuItem, browserWindow, event) {
            // The accelerator is handled in the renderer process because of
            // https://github.com/electron/electron/issues/3682.
            if (!event.triggeredByAccelerator) {
              win.webContents.send(IpcMainChannels.FileMenuRedo);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Cu&t',
          accelerator: 'CmdOrCtrl+X',
          click(menuItem, browserWindow, event) {
            // The accelerator is handled in the renderer process because of
            // https://github.com/electron/electron/issues/3682.
            if (!event.triggeredByAccelerator) {
              win.webContents.send(IpcMainChannels.FileMenuCut);
            }
          },
        },
        {
          label: '&Copy',
          accelerator: 'CmdOrCtrl+C',
          click(menuItem, browserWindow, event) {
            // The accelerator is handled in the renderer process because of
            // https://github.com/electron/electron/issues/3682.
            if (!event.triggeredByAccelerator) {
              win.webContents.send(IpcMainChannels.FileMenuCopy);
            }
          },
        },
        {
          label: '&Paste',
          accelerator: 'CmdOrCtrl+V',
          click(menuItem, browserWindow, event) {
            // The accelerator is handled in the renderer process because of
            // https://github.com/electron/electron/issues/3682.
            if (!event.triggeredByAccelerator) {
              win.webContents.send(IpcMainChannels.FileMenuPaste);
            }
          },
        },
      ],
    },
    {
      label: '&Insert',
      submenu: [
        {
          label: '&Drop Cap',
          click() {
            win.webContents.send(IpcMainChannels.FileMenuInsertDropCap);
          },
        },
        {
          label: '&Text Box',
          click() {
            win.webContents.send(IpcMainChannels.FileMenuInsertTextBox, {
              inline: false,
            } as FileMenuInsertTextboxArgs);
          },
        },
        {
          label: '&Inline Text Box',
          click() {
            win.webContents.send(IpcMainChannels.FileMenuInsertTextBox, {
              inline: true,
            } as FileMenuInsertTextboxArgs);
          },
        },
        {
          label: '&Mode Key',
          click() {
            win.webContents.send(IpcMainChannels.FileMenuInsertModeKey);
          },
        },
        { type: 'separator' },
        {
          label: 'Headers && Footers',
          submenu: [
            {
              label: 'Header',
              click() {
                win.webContents.send(IpcMainChannels.FileMenuInsertHeader);
              },
            },
            {
              label: 'Footer',
              click() {
                win.webContents.send(IpcMainChannels.FileMenuInsertFooter);
              },
            },
          ],
        },
      ],
    },
    ...(isDevelopment
      ? [
          {
            label: 'View (Debug)',
            submenu: [
              { role: 'reload' },
              { role: 'forceReload' },
              { role: 'toggleDevTools' },
              { type: 'separator' },
              { role: 'resetZoom' },
              { role: 'zoomIn' },
              { role: 'zoomOut' },
              { type: 'separator' },
              { role: 'togglefullscreen' },
            ],
          } as MenuItemConstructorOptions,
          {
            label: 'Generate Test Files (Debug)',
            submenu: Object.values(TestFileType).map((testFileType) => ({
              label: testFileType,
              click() {
                win.webContents.send(
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
          label: 'Guide',
          click() {
            shell.openExternal(process.env.VUE_APP_GUIDE_URL!);
          },
        },
        { type: 'separator' },
        {
          label: 'Request a Feature',
          click() {
            shell.openExternal(process.env.VUE_APP_ISSUES_URL!);
          },
        },
        {
          label: 'Report an Issue',
          click() {
            shell.openExternal(process.env.VUE_APP_ISSUES_URL!);
          },
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'About',
          click() {
            let detail = `Version: ${app.getVersion()}\n`;
            detail += `Electron: ${process.versions.electron}\n`;
            detail += `Chromium: ${process.versions.chrome}\n`;
            detail += `Node.js: ${process.version}`;

            dialog.showMessageBox(win, {
              title: process.env.VUE_APP_TITLE,
              message: process.env.VUE_APP_TITLE!,
              detail: detail,
              type: 'info',
            });
          },
        },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);
}

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1280,
    height: 1024,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env
        .ELECTRON_NODE_INTEGRATION as unknown as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false,
    },
    icon: path.join(__static, 'favicon-32.png'),
    show: false,
  });

  win.maximize();

  win.once('ready-to-show', () => {
    win.show();
  });

  win.webContents.once('did-finish-load', () => (loaded = true));

  // Prevent the user from accidentally
  // closing the app with unsaved changes
  win.on('close', async (event) => {
    win.webContents.send(IpcMainChannels.CloseApplication);
    event.preventDefault();
  });

  // Load store before we create the menu, since
  // the store contains the list of recent files
  await loadStore();
  createMenu();

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    autoUpdater.checkForUpdatesAndNotify();
    await win.loadURL('app://./index.html');
  }
}

app.setAboutPanelOptions({
  applicationName: app.getName(),
  applicationVersion: app.getVersion(),
});

ipcMain.on(IpcRendererChannels.SetCanUndo, async (event, data) => {
  Menu.getApplicationMenu()!.getMenuItemById('undo')!.enabled = data;
});

ipcMain.on(IpcRendererChannels.SetCanRedo, async (event, data) => {
  Menu.getApplicationMenu()!.getMenuItemById('redo')!.enabled = data;
});

ipcMain.handle(IpcRendererChannels.ExitApplication, async () => {
  app.exit();
});

ipcMain.handle(
  IpcRendererChannels.ShowMessageBox,
  async (event, args: ShowMessageBoxArgs) => {
    return await dialog.showMessageBox(win, {
      type: args.type,
      title: args.title,
      message: args.message,
      detail: args.detail,
      buttons: args.buttons,
    });
  },
);

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
  IpcRendererChannels.PrintWorkspace,
  async (event, args: PrintWorkspaceArgs) => {
    return await printWorkspace(args);
  },
);

ipcMain.handle(IpcRendererChannels.OpenWorkspaceFromArgv, async () => {
  if (process.platform === 'darwin' && darwinPath != null) {
    const result = {
      data: await openFile(darwinPath),
      filePath: darwinPath,
      success: true,
    };

    return [result];
  } else {
    return await openFileFromArgs(process.argv);
  }
});

ipcMain.handle(IpcRendererChannels.GetSystemFonts, async () => {
  let fonts: string[] = [];

  try {
    //fonts = await fontList.getFonts({ disableQuoting: true });
    fonts = await getSystemFonts();
  } catch (error) {
    console.error(error);
  }

  return fonts;
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
    if (loaded) {
      const result = {
        data: await openFile(path),
        filePath: path,
        success: true,
      };

      win.webContents.send(IpcMainChannels.FileMenuOpenScore, result);

      win.show();
    }
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win, {
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
      results
        .filter((x) => x.success)
        .forEach((x) =>
          win.webContents.send(IpcMainChannels.FileMenuOpenScore, x),
        );

      win.show();
    } else {
      win.webContents.once('did-finish-load', () => {
        results
          .filter((x) => x.success)
          .forEach((x) =>
            win.webContents.send(IpcMainChannels.FileMenuOpenScore, x),
          );
      });
    }
  },
);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      if (e instanceof Error) {
        console.error('Vue Devtools failed to install:', e.toString());
      }
    }
  }
  createWindow();
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
