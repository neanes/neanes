import type { Readable, Writable } from 'node:stream';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import compatibility from './compatibility.json';
import { MAX_AUTOMATION_MESSAGE_BYTES } from './messageLimits';
import { openMcpInput } from './stdioInput';

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
  // Reopen input using Node's pipe handling; keep Node's existing stdout stream
  // so we don't register a second handle for its inherited Windows pipe.
  return {
    input: process.platform === 'win32' ? openMcpInput(0) : process.stdin,
    output: process.stdout,
  };
}
