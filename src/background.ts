'use strict';

import {
  app,
  protocol,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  MenuItemConstructorOptions,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import {
  FileMenuOpenScoreArgs,
  FileMenuPrintReplyArgs,
  FileMenuSaveAsArgs,
  FileMenuSaveAsReplyArgs,
  FileMenuSaveReplyArgs,
  IpcMainChannels,
  IpcRendererChannels,
  ShowErrorBoxArgs,
} from './ipc/ipcChannels';
import path from 'path';
import { promises as fs } from 'fs';
import { TestFileType } from './utils/TestFileType';
import AdmZip from 'adm-zip';
import { errorMonitor } from 'events';

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

let saving = false;

interface State {
  hasUnsavedChanges: boolean;
  filePath: string | null;
}

const state: State = {
  hasUnsavedChanges: false,
  filePath: null,
};

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

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

async function showUnsavedChangesWarning() {
  const fileName =
    state.filePath != null ? path.basename(state.filePath) : 'Untitled 1';

  return await dialog.showMessageBox(win, {
    title: process.env.VUE_APP_TITLE,
    message: `Do you want to save the changes you made to ${fileName}?`,
    detail: "Your changes will be lost if you don't save them.",
    type: 'warning',
    buttons: ['Save', "Don't Save", 'Cancel'],
  });
}

async function checkForUnsavedChanges() {
  if (state.hasUnsavedChanges) {
    const dialogResult = await showUnsavedChangesWarning();

    if (dialogResult.response === 0) {
      // User wants to save
      if (!(await handleSave(state.filePath))) {
        // If the user cancels the save dialog
        // then don't do anything.
        return false;
      }
    } else if (dialogResult.response === 2) {
      // User wants to cancel
      return false;
    }
  }

  return true;
}

async function writeScoreFile(filePath: string, data: string) {
  // If using the compressed file format, zip first
  if (path.extname(filePath) === '.byz') {
    const zip = new AdmZip();

    const unzippedFileName = `${path.basename(filePath, '.byz')}.byzx`;

    zip.addFile(unzippedFileName, Buffer.from(data));
    // Missing typescript definition
    await (zip as any).writeZipPromise(filePath);
  } else {
    await fs.writeFile(filePath, data);
  }
}

async function readScoreFile(filePath: string) {
  let data: string;

  // If using the compressed file format, zip first
  if (path.extname(filePath) === '.byz') {
    const zip = new AdmZip(filePath);
    data = zip.getEntries()[0].getData().toString('utf8');
  } else {
    data = await fs.readFile(filePath, 'utf8');
  }

  return data;
}

async function openFile(filePath: string) {
  const data = await readScoreFile(filePath);

  win.webContents.send(IpcMainChannels.FileMenuOpenScore, {
    data,
    filePath,
  } as FileMenuOpenScoreArgs);

  await addToRecentFiles(filePath);

  createMenu();
}

async function handleSave(filePath: string | null) {
  try {
    if (saving) {
      return false;
    }

    saving = true;

    if (filePath != null) {
      win.webContents.send(IpcMainChannels.FileMenuSave);

      // Wait for the reply and write the data to the file path
      await new Promise<void>((resolve, reject) =>
        ipcMain.once(
          IpcRendererChannels.FileMenuSaveReply,
          async (event, args: FileMenuSaveReplyArgs) => {
            try {
              saving = false;
              await writeScoreFile(filePath!, args.data);
              win.webContents.send(IpcMainChannels.SaveComplete);
              resolve();
            } catch (error) {
              reject(error);
            }
          },
        ),
      );

      return true;
    } else {
      return await handleSaveAs();
    }
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win, {
        type: 'error',
        title: 'Save failed',
        message: error.message,
      });
    }

    return false;
  }
}

async function handleSaveAs() {
  try {
    const dialogResult = await dialog.showSaveDialog(win, {
      title: 'Save Score',
      defaultPath: state.filePath || 'Untitled 1',
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
      const filePath = dialogResult.filePath!;

      // Ask the front-end for the data
      win.webContents.send(IpcMainChannels.FileMenuSaveAs, {
        filePath,
      } as FileMenuSaveAsArgs);

      // Wait for the reply and write the data to the file path
      await new Promise<void>((resolve, reject) =>
        ipcMain.once(
          IpcRendererChannels.FileMenuSaveAsReply,
          async (event, args: FileMenuSaveAsReplyArgs) => {
            try {
              saving = false;

              await writeScoreFile(dialogResult.filePath!, args.data);

              win.webContents.send(IpcMainChannels.SaveComplete);

              resolve();
            } catch (error) {
              reject(error);
            }
          },
        ),
      );

      return true;
    } else {
      saving = false;
      return false;
    }
  } catch (error) {
    saving = false;
    console.error(error);

    if (error instanceof Error) {
      dialog.showMessageBox(win, {
        type: 'error',
        title: 'Save As failed',
        message: error.message,
      });
    }

    return false;
  }
}

function createMenu() {
  var menu = Menu.buildFromTemplate([
    {
      label: '&File',
      submenu: [
        {
          label: '&New',
          accelerator: 'CmdOrCtrl+N',
          async click() {
            if (await checkForUnsavedChanges()) {
              win.webContents.send(IpcMainChannels.FileMenuNewScore);
            }
          },
        },
        {
          label: '&Open',
          accelerator: 'CmdOrCtrl+O',
          async click() {
            if (await checkForUnsavedChanges()) {
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

                const filePath = dialogResult.filePaths[0];

                if (!dialogResult.canceled) {
                  await openFile(filePath);
                } else {
                  saving = false;
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
              } finally {
                saving = false;
              }
            }
          },
        },
        {
          id: 'recentfiles',
          label: 'Open Recent',
          submenu: store.recentFiles.map((x, index) => ({
            label: `${index + 1}: ${x}`,
            async click() {
              if (await checkForUnsavedChanges()) {
                try {
                  await openFile(x);
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
            },
          })),
        },
        {
          label: '&Save',
          accelerator: 'CmdOrCtrl+S',
          async click() {
            handleSave(state.filePath);
          },
        },
        {
          label: 'Save &As',
          accelerator: 'CmdOrCtrl+Shift+S',
          async click() {
            handleSaveAs();
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
          async click() {
            try {
              const dialogResult = await dialog.showSaveDialog(win, {
                title: 'Export Score as PDF',
                filters: [{ name: 'PDF File', extensions: ['pdf'] }],
                defaultPath:
                  state.filePath != null
                    ? path.basename(
                        state.filePath,
                        path.extname(state.filePath),
                      )
                    : 'Untitled 1',
              });

              if (!dialogResult.canceled) {
                win.webContents.send(IpcMainChannels.FileMenuPrint);

                // Wait for the reply and print
                await new Promise<void>((resolve, reject) =>
                  ipcMain.once(
                    IpcRendererChannels.FileMenuPrintReply,
                    async (event, args: FileMenuPrintReplyArgs) => {
                      try {
                        const data = await win.webContents.printToPDF({
                          pageSize: args.pageSize,
                          landscape: args.landscape,
                        });
                        await fs.writeFile(dialogResult.filePath!, data);
                        resolve();
                      } catch (error) {
                        reject(error);
                      }
                    },
                  ),
                );
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
            }
          },
        },
        {
          label: '&Print',
          accelerator: 'CmdOrCtrl+P',
          async click() {
            try {
              win.webContents.send(IpcMainChannels.FileMenuPrint);

              // Wait for the reply and print
              await new Promise<void>((resolve, reject) =>
                ipcMain.once(
                  IpcRendererChannels.FileMenuPrintReply,
                  async (event, args: FileMenuPrintReplyArgs) => {
                    try {
                      win.webContents.print({
                        pageSize: args.pageSize,
                        landscape: args.landscape,
                      });

                      resolve();
                    } catch (error) {
                      reject(error);
                    }
                  },
                ),
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
            }
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
            win.webContents.send(IpcMainChannels.FileMenuInsertTextBox);
          },
        },
        {
          label: '&Mode Key',
          click() {
            win.webContents.send(IpcMainChannels.FileMenuInsertModeKey);
          },
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

  // Prevent the user from accidentally
  // closing the app with unsaved changes
  win.on('close', async (event) => {
    if (state.hasUnsavedChanges) {
      event.preventDefault();

      if (await checkForUnsavedChanges()) {
        app.exit();
      }
    }
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

ipcMain.on(IpcRendererChannels.SetHasUnsavedChanges, async (event, data) => {
  state.hasUnsavedChanges = data;
});

ipcMain.on(IpcRendererChannels.SetFilePath, async (event, data) => {
  state.filePath = data;
});

ipcMain.on(IpcRendererChannels.SetCanUndo, async (event, data) => {
  Menu.getApplicationMenu()!.getMenuItemById('undo')!.enabled = data;
});

ipcMain.on(IpcRendererChannels.SetCanRedo, async (event, data) => {
  Menu.getApplicationMenu()!.getMenuItemById('redo')!.enabled = data;
});

ipcMain.on(
  IpcRendererChannels.ShowErrorBox,
  async (event, args: ShowErrorBoxArgs) => {
    dialog.showMessageBox(win, {
      type: 'error',
      title: args.title,
      message: args.content,
    });
  },
);

ipcMain.on(IpcRendererChannels.EditorFinishedLoading, async () => {
  // Check if there a file was passed to the app.
  // See https://github.com/electron/electron/issues/4690#issuecomment-422617581
  // for why the special case for isPackaged is needed.
  if (app.isPackaged) {
    // workaround for missing executable argument)
    process.argv.unshift('');
  }

  // parameters is now an array containing any files/folders that your OS will pass to your application
  const parameters = process.argv.slice(2);

  if (parameters.length > 0) {
    try {
      await openFile(parameters[0]);
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
});
