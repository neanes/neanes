import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Transform } from 'node:stream';
import { pathToFileURL } from 'node:url';

export function createStartupNewlineFilter() {
  let prefix = Buffer.alloc(0);
  let started = false;
  return new Transform({
    transform(chunk, _encoding, callback) {
      if (started) {
        callback(null, chunk);
        return;
      }
      const data = Buffer.concat([prefix, chunk]);
      if (data.length === 1 && data[0] === 13) {
        prefix = data;
        callback();
        return;
      }
      prefix = Buffer.alloc(0);
      started = true;
      callback(
        null,
        data[0] === 13 && data[1] === 10 ? data.subarray(2) : data,
      );
    },
    flush(callback) {
      callback(null, prefix);
    },
  });
}

async function launch() {
  const privateProfile = await mkdtemp(path.join(tmpdir(), 'neanes-mcp-'));
  const env = { ...process.env, NEANES_MCP_USER_DATA_DIR: privateProfile };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(process.execPath, process.argv.slice(2), {
    env,
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  const stop = () => child.kill();
  child.once('error', (error) => {
    console.error(error);
    process.exitCode = 1;
  });
  child.stdin.on('error', (error) => {
    if (error.code !== 'EPIPE') {
      console.error(error);
    }
    stop();
  });
  process.stdout.once('error', stop);
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
  process.stdin.pipe(child.stdin);
  // Electron emits this CRLF in native Windows startup, before app code runs.
  // Remove only that one prefix; all subsequent bytes stay visible to clients.
  const output =
    process.platform === 'win32'
      ? child.stdout.pipe(createStartupNewlineFilter())
      : child.stdout;
  output.pipe(process.stdout);
  const code = await new Promise((resolve) => child.once('close', resolve));
  try {
    process.stdin.unpipe(child.stdin);
    process.stdin.pause();
    process.exitCode = code ?? 1;
  } finally {
    // Chromium keeps profile files open beyond BrowserWindow.destroy(). Remove
    // the directory only after the worker process and its stdio have closed.
    await rm(privateProfile, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await launch();
}
