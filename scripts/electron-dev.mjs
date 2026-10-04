const shutdowns = new WeakMap();

// vite-plugin-electron exposes its child process as process.electronApp.
export function stopElectronDevApp() {
  const child = process.electronApp;

  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }

  const pending = shutdowns.get(child);

  if (pending) {
    return pending;
  }

  // A restart must not cause the old child's exit to terminate Vite.
  child.removeListener('exit', process.exit);

  const shutdown = new Promise((resolve) => {
    const timeout = setTimeout(() => child.kill('SIGKILL'), 2000);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });

    if (child.connected) {
      child.send('graceful-exit', (error) => {
        if (error) {
          child.kill('SIGKILL');
        }
      });
    } else {
      child.kill('SIGKILL');
    }
  });

  shutdowns.set(child, shutdown);
  return shutdown;
}
