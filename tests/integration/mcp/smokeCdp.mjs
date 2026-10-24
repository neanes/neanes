import assert from 'node:assert/strict';

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

export async function connectCdp(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const reply = JSON.parse(event.data);
    const request = pending.get(reply.id);
    if (!request) {
      return;
    }
    pending.delete(reply.id);
    if (reply.error || reply.result?.exceptionDetails) {
      request.reject(new Error(JSON.stringify(reply)));
    } else {
      request.resolve(reply.result);
    }
  });
  socket.addEventListener('close', () => {
    for (const request of pending.values()) {
      request.reject(new Error('Debugger connection closed.'));
    }
    pending.clear();
  });
  function send(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  return {
    send,
    async evaluate(expression) {
      return (
        await send('Runtime.evaluate', {
          expression,
          awaitPromise: true,
          returnByValue: true,
        })
      ).result.value;
    },
    close: () => socket.close(),
  };
}
