import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import compatibility from './compatibility.json';
import { MAX_AUTOMATION_MESSAGE_BYTES } from './messageLimits';

export class McpStdioTransport extends StdioServerTransport {
  constructor() {
    super(process.stdin, process.stdout, {
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
    process.stdin.resume();
  }
}
