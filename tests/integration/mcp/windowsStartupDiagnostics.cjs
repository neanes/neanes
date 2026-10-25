// Loaded by Electron's default app before the Neanes entry point. Observe real
// startup events without replacing application or transport behavior.
/* eslint-disable @typescript-eslint/no-require-imports -- Electron's --require bootstrap uses CommonJS. */
const { appendFileSync, fstatSync } = require('node:fs');

const { app, ipcMain } = require('electron');

const record = (event, details) =>
  appendFileSync(
    process.env.NEANES_TEST_STARTUP_LOG,
    JSON.stringify({ event, details }) + '\n',
  );

record('bootstrap loaded', { electron: process.versions.electron });
for (const fd of [0, 1, 2]) {
  try {
    const stat = fstatSync(fd);
    record('stdio descriptor', {
      fd,
      fifo: stat.isFIFO(),
      file: stat.isFile(),
      characterDevice: stat.isCharacterDevice(),
      socket: stat.isSocket(),
      mode: stat.mode,
    });
  } catch (error) {
    record('stdio descriptor error', { fd, error: error.stack });
  }
}
process.on('uncaughtExceptionMonitor', (error) =>
  record('uncaught exception', error.stack),
);
app.on('ready', () => record('app ready'));
ipcMain.on('AutomationReady', () => record('automation ready'));
app.on('browser-window-created', (_event, window) => {
  record('window created', { id: window.id, visible: window.isVisible() });
  window.webContents.on('did-finish-load', () => record('renderer loaded'));
  window.webContents.on('did-fail-load', (_event, code, description) =>
    record('renderer load failed', { code, description }),
  );
  window.webContents.on('preload-error', (_event, _path, error) =>
    record('preload error', error.stack),
  );
  window.webContents.on('render-process-gone', (_event, details) =>
    record('renderer exited', details),
  );
  window.webContents.on('console-message', (_event, details) => {
    if (details.level === 'error' || details.level === 'warning') {
      record('renderer console', {
        level: details.level,
        message: details.message,
        lineNumber: details.lineNumber,
        sourceId: details.sourceId,
      });
    }
  });
});
