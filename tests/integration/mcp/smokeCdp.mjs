import assert from 'node:assert/strict';

import { eventually } from './smokePolling.mjs';

// Pause actual script execution in the next export window, then resume it.
export async function pauseNextExport(evaluateMain) {
  await evaluateMain(`(() => {
    const {app} = process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron');
    globalThis.__smokePausedExport = { paused: false, error: null, window: null, breakpointId: null };
    app.once('browser-window-created', (_event, window) => {
      const state = globalThis.__smokePausedExport;
      state.window = window;
      const debug = window.webContents.debugger;
      debug.attach();
      debug.on('message', (_event, method) => {
        if (method === 'Debugger.paused') state.paused = true;
      });
      void debug.sendCommand('Debugger.enable')
        .then(() => debug.sendCommand('Debugger.setInstrumentationBreakpoint', {instrumentation: 'beforeScriptExecution'}))
        .then(({breakpointId}) => { state.breakpointId = breakpointId; })
        .catch(error => { state.error = String(error); });
    });
  })()`);
  return {
    async wait() {
      await eventually(async () => {
        const state = await evaluateMain(`(() => {
          const state = globalThis.__smokePausedExport;
          return { paused: state.paused, error: state.error, breakpointId: state.breakpointId, url: state.window?.webContents.getURL() };
        })()`);
        assert.equal(state.error, null);
        assert.ok(state.breakpointId);
        assert.equal(state.paused, true);
        assert.ok(state.url.includes('export.html'));
      });
    },
    async release() {
      await evaluateMain(`(async () => {
        const state = globalThis.__smokePausedExport;
        if (state.window && !state.window.isDestroyed()) {
          const debug = state.window.webContents.debugger;
          if (state.breakpointId) await debug.sendCommand('Debugger.removeBreakpoint', {breakpointId: state.breakpointId});
          if (state.paused) await debug.sendCommand('Debugger.resume');
          debug.detach();
        }
        delete globalThis.__smokePausedExport;
      })()`);
    },
  };
}

export async function editorTarget(debugUrl) {
  const targets = await (await fetch(`${debugUrl}/json/list`)).json();
  const target = targets.find(
    (entry) =>
      entry.type === 'page' &&
      !entry.url.includes('export.html') &&
      !entry.url.startsWith('devtools:'),
  );
  assert.ok(
    target?.webSocketDebuggerUrl,
    'No disposable editor debugging target found.',
  );
  return target;
}

export async function connectCdp(
  webSocketDebuggerUrl,
  { timeoutMs = 10_000 } = {},
) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let connectionTimer;
  try {
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
      connectionTimer = setTimeout(() => {
        socket.close();
        reject(
          new Error(
            `Debugger connection timed out after ${timeoutMs} ms: ${webSocketDebuggerUrl}`,
          ),
        );
      }, timeoutMs);
    });
  } finally {
    clearTimeout(connectionTimer);
  }
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const reply = JSON.parse(event.data);
    const request = pending.get(reply.id);
    if (!request) {
      return;
    }
    pending.delete(reply.id);
    clearTimeout(request.timer);
    if (reply.error || reply.result?.exceptionDetails) {
      request.reject(new Error(JSON.stringify(reply)));
    } else {
      request.resolve(reply.result);
    }
  });
  socket.addEventListener('close', () => {
    for (const request of pending.values()) {
      clearTimeout(request.timer);
      request.reject(new Error('Debugger connection closed.'));
    }
    pending.clear();
  });
  function send(
    method,
    params,
    { timeoutMs: requestTimeoutMs = timeoutMs } = {},
  ) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => {
        pending.delete(id);
        const context = params?.expression
          ? `: ${params.expression.slice(0, 160)}`
          : '';
        reject(
          Object.assign(
            new Error(
              `Debugger request ${id} (${method}) timed out after ${requestTimeoutMs} ms${context}`,
            ),
            { code: 'CDP_REQUEST_TIMEOUT', method, requestId: id },
          ),
        );
      }, requestTimeoutMs);
      pending.set(id, { resolve, reject, timer });
      try {
        socket.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        pending.delete(id);
        clearTimeout(timer);
        reject(error);
      }
    });
  }
  return {
    send,
    async evaluate(expression, options) {
      return (
        await send(
          'Runtime.evaluate',
          {
            expression,
            awaitPromise: true,
            returnByValue: true,
          },
          options,
        )
      ).result.value;
    },
    close: () => socket.close(),
  };
}
