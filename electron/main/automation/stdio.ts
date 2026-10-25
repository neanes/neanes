import { createReadStream, createWriteStream } from 'node:fs';
import type { Readable, Writable } from 'node:stream';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import compatibility from './compatibility.json';
import { MAX_AUTOMATION_MESSAGE_BYTES } from './messageLimits';

export class McpStdioTransport extends StdioServerTransport {
  constructor(
    readonly input: Readable,
    output: Writable,
  ) {
    super(input, output, {
      maxBufferSize: MAX_AUTOMATION_MESSAGE_BYTES,
    });
  }

  override async start() {
    const onmessage = this.onmessage;
    this.onmessage = (message) => {
      // Restrict negotiation to the revisions exercised by Neanes.
      if (
        'method' in message &&
        message.method === 'initialize' &&
        message.params &&
        !compatibility.protocolVersions.includes(
          String(message.params.protocolVersion),
        )
      ) {
        message.params.protocolVersion = compatibility.protocolVersions[0];
      }
      onmessage?.(message);
    };
    await super.start();
    // Startup pauses stdin until the renderer and transport are ready.
    this.input.resume();
  }
}
export function createMcpStdioStreams() {
  // Electron replaces process.stdin with an EOF-only stream on Windows.
  // Use the inherited pipe descriptors instead of that Electron wrapper.
  return process.platform === 'win32'
    ? {
        input: createReadStream('', { fd: 0, autoClose: false }),
        output: createWriteStream('', { fd: 1, autoClose: false }),
      }
    : { input: process.stdin, output: process.stdout };
}
