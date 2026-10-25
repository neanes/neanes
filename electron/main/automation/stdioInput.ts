import { createReadStream, fstatSync } from 'node:fs';
import { Socket } from 'node:net';

export function openMcpInput(fd: number) {
  // Match Node's stdio handling: redirected files use fs, inherited IPC pipes
  // use libuv's stream handling through net.Socket, including on Windows.
  return fstatSync(fd).isFile()
    ? createReadStream('', { fd, autoClose: false })
    : new Socket({ fd, readable: true, writable: false });
}
