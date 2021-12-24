'use strict';

import { app, protocol, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import {
  FileMenuOpenScoreArgs,
  FileMenuSaveAsArgs,
  FileMenuSaveAsReplyArgs,
  FileMenuSaveReplyArgs,
  IpcMainChannels,
  IpcRendererChannels,
} from './ipc/ipcChannels';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import { TestFileType } from './utils/TestFileType';
const isDevelopment = process.env.NODE_ENV !== 'production';

declare const __static: string;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

let saving = false;

interface State {
  hasUnsavedChanges: boolean;
  filePath: string | null;
}

const state: State = {
  hasUnsavedChanges: false,
  filePath: null,
};

async function showUnsavedChangesWarning(win: BrowserWindow) {
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

async function checkForUnsavedChanges(win: BrowserWindow) {
  if (state.hasUnsavedChanges) {
    const dialogResult = await showUnsavedChangesWarning(win);

    if (dialogResult.response === 0) {
      // User wants to save
      if (!(await handleSave(win, state.filePath))) {
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

async function handleSave(win: BrowserWindow, filePath: string | null) {
  try {
    if (saving) {
      return false;
    }

    saving = true;

    if (filePath != null) {
      win.webContents.send(IpcMainChannels.FileMenuSave);

      // Wait for the reply and write the data to the file path
      ipcMain.once(
        IpcRendererChannels.FileMenuSaveReply,
        async (event, args: FileMenuSaveReplyArgs) => {
          saving = false;
          await fs.writeFile(filePath!, args.data);
          win.webContents.send(IpcMainChannels.SaveComplete);
        },
      );

      return true;
    } else {
      return await handleSaveAs(win);
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function handleSaveAs(win: BrowserWindow) {
  try {
    const dialogResult = await dialog.showSaveDialog(win, {
      title: 'Save Score',
      filters: [{ name: 'Score File', extensions: ['json'] }],
    });

    if (!dialogResult.canceled) {
      const filePath = dialogResult.filePath!;

      // Ask the front-end for the data
      win.webContents.send(IpcMainChannels.FileMenuSaveAs, {
        filePath,
      } as FileMenuSaveAsArgs);

      // Wait for the reply and write the data to the file path
      ipcMain.once(
        IpcRendererChannels.FileMenuSaveAsReply,
        async (event, args: FileMenuSaveAsReplyArgs) => {
          saving = false;
          await fs.writeFile(dialogResult.filePath!, args.data);
          win.webContents.send(IpcMainChannels.SaveComplete);
        },
      );

      return true;
    } else {
      saving = false;
      return false;
    }
  } catch (error) {
    saving = false;
    console.error(error);
    return false;
  }
}

function createMenu(win: BrowserWindow) {
  var menu = Menu.buildFromTemplate([
    {
      label: '&File',
      submenu: [
        {
          label: '&New',
          accelerator: 'CmdOrCtrl+N',
          async click() {
            if (await checkForUnsavedChanges(win)) {
              win.webContents.send(IpcMainChannels.FileMenuNewScore);
            }
          },
        },
        {
          label: '&Open',
          accelerator: 'CmdOrCtrl+O',
          async click() {
            if (await checkForUnsavedChanges(win)) {
              try {
                const dialogResult = await dialog.showOpenDialog(win, {
                  properties: ['openFile'],
                  title: 'Open Score',
                  filters: [{ name: 'Score File', extensions: ['json'] }],
                });

                const filePath = dialogResult.filePaths[0];

                if (!dialogResult.canceled) {
                  const data = await fs.readFile(filePath, 'utf8');

                  win.webContents.send(IpcMainChannels.FileMenuOpenScore, {
                    data,
                    filePath,
                  } as FileMenuOpenScoreArgs);
                } else {
                  saving = false;
                }
              } catch (error) {
                console.error(error);
              } finally {
                saving = false;
              }
            }
          },
        },
        {
          label: '&Save',
          accelerator: 'CmdOrCtrl+S',
          async click() {
            handleSaveAs(win);
          },
        },
        {
          label: 'Save &As',
          accelerator: 'CmdOrCtrl+Shift+S',
          async click() {
            handleSaveAs(win);
          },
        },
        { type: 'separator' },
        {
          label: '&Export as PDF',
          accelerator: 'CmdOrCtrl+E',
          async click() {
            try {
              const dialogResult = await dialog.showSaveDialog(win, {
                title: 'Export Score as PDF',
                filters: [{ name: 'PDF File', extensions: ['pdf'] }],
              });

              if (!dialogResult.canceled) {
                const data = await win.webContents.printToPDF({
                  marginsType: 1,
                });
                await fs.writeFile(dialogResult.filePath!, data);
              }
            } catch (error) {
              console.error(error);
            }
          },
        },
        {
          label: '&Print',
          accelerator: 'CmdOrCtrl+P',
          click() {
            win.webContents.print();
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
      label: '&Insert',
      submenu: [
        {
          label: '&Neume',
          click() {
            win.webContents.send(IpcMainChannels.FileMenuInsertNeume);
          },
        },
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
    {
      label: 'View (Debug)',
      visible: isDevelopment,
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
    },
    {
      label: 'Generate Test Files (Debug)',
      visible: isDevelopment,
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
  ]);

  Menu.setApplicationMenu(menu);
}

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env
        .ELECTRON_NODE_INTEGRATION as unknown as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__static, 'favicon-32.png'),
  });

  createMenu(win);

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }
}

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
