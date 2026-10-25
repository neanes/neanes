import type { IncomingMessage } from 'node:http';

import { MAX_AUTOMATION_MESSAGE_BYTES } from './messageLimits';

// Bound streamed bodies even when Content-Length is absent or incomplete.
export async function readJsonBody(stream: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > MAX_AUTOMATION_MESSAGE_BYTES) {
      stream.destroy();
      throw new Error('Message exceeds size limit.');
    }
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks, size).toString('utf8'));
}
