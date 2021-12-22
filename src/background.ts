'use strict';

import { app, protocol, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import { IpcMainChannels, IpcRendererChannels } from './ipc/ipcChannels';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
const isDevelopment = process.env.NODE_ENV !== 'production';

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

function createMenu(win: BrowserWindow) {
  var menu = Menu.buildFromTemplate([
    {
      label: '&File',
      submenu: [
        {
          label: '&New Score',
          accelerator: 'CmdOrCtrl+N',
          click() {
            win.webContents.send(IpcMainChannels.FileMenuNewScore);
          },
        },
        {
          label: '&Open Score',
          accelerator: 'CmdOrCtrl+O',
          async click() {
            try {
              const dialogResult = await dialog.showOpenDialog(win, {
                properties: ['openFile'],
                title: 'Open Score',
                filters: [{ name: 'Score File', extensions: ['json'] }],
              });

              if (!dialogResult.canceled) {
                const data = await fs.readFile(
                  dialogResult.filePaths[0],
                  'utf8',
                );

                win.webContents.send(IpcMainChannels.FileMenuOpenScore, data);
              }
            } catch (error) {
              console.error(error);
            }
          },
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
          async click() {
            try {
              const dialogResult = await dialog.showSaveDialog(win, {
                title: 'Save Score',
                filters: [{ name: 'Score File', extensions: ['json'] }],
              });

              if (!dialogResult.canceled) {
                // Ask the front-end for the data
                win.webContents.send(IpcMainChannels.FileMenuSaveAs);

                // Wait for the reply and write the data to the file path
                ipcMain.once(
                  IpcRendererChannels.FileMenuSaveAsReply,
                  async (event, data) => {
                    await fs.writeFile(dialogResult.filePath!, data);
                  },
                );
              }
            } catch (error) {
              console.error(error);
            }
          },
        },
        { type: 'separator' },
        {
          label: '&Export Score as PDF',
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
      label: 'Debug',
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
