// Run outside the agent command sandbox; starts disposable Electron processes.
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import { createSmokeApp } from './smokeApp.mjs';
import { eventually } from './smokePolling.mjs';

const electron =
  "process.getBuiltinModule('module').createRequire(process.cwd() + '/package.json')('electron')";

for (const action of ['quit', 'close-window']) {
  const app = await createSmokeApp('neanes-shutdown-');
  try {
    const child = app.start({ args: ['--inspect=0'] });
    await app.ready();
    const discoveryFile = path.join(app.profile, 'mcp-editor.json');
    const connection = JSON.parse(await readFile(discoveryFile, 'utf8'));
    const socketDirectory =
      process.platform === 'win32' ? null : path.dirname(connection.socket);
    const debuggerConnection = await app.debugger('main');
    const { evaluate } = debuggerConnection;

    if (action === 'close-window') {
      await evaluate(`${electron}.BrowserWindow.getAllWindows()[0].close()`);
      if (process.platform === 'darwin') {
        // Closing a macOS window keeps the application and connection alive.
        await eventually(async () =>
          assert.equal(
            await evaluate(`${electron}.BrowserWindow.getAllWindows().length`),
            0,
          ),
        );
        assert.equal(child.exitCode, null);
        await access(discoveryFile);
        await access(socketDirectory);
      }
    }

    if (action === 'quit' || process.platform === 'darwin') {
      // Disconnect the inspector before shutdown so it cannot delay process exit.
      await evaluate(
        `setTimeout(() => ${electron}.app.quit(), 100); undefined`,
      );
    }
    debuggerConnection.close();

    await eventually(() => {
      assert.equal(child.signalCode, null, app.log());
      assert.equal(child.exitCode, 0, app.log());
    });
    await assert.rejects(access(discoveryFile), { code: 'ENOENT' });
    if (socketDirectory) {
      await assert.rejects(access(socketDirectory), { code: 'ENOENT' });
    }
  } finally {
    await app.close();
  }
}

console.log('Shutdown smoke passed: explicit quit and window-close cleanup.');
