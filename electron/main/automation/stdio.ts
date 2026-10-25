import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

import compatibility from './compatibility.json';
import { readJsonLines } from './jsonLines';

// The SDK owns MCP semantics. This transport keeps malformed envelopes recoverable
// and restricts negotiation to the revisions exercised by Neanes.
export class McpStdioTransport implements Transport {
  onclose?: Transport['onclose'];
  onerror?: Transport['onerror'];
  onmessage?: Transport['onmessage'];
  private detach?: () => void;
  private closed = false;
  private readonly requests = new Set<string | number>();

  async start() {
    this.detach = readJsonLines(
      process.stdin,
      1024 * 1024,
      (message) => {
        const parsed = JSONRPCMessageSchema.safeParse(message);
        const envelope = message as Record<string, unknown> | null;
        const id = envelope?.id;
        const validId = typeof id === 'string' || Number.isInteger(id);
        if (
          !parsed.success ||
          !('method' in parsed.data) ||
          (validId && this.requests.has(id as string | number))
        ) {
          this.sendError({
            jsonrpc: '2.0',
            id: validId ? (id as string | number) : null,
            error: { code: -32600, message: 'Invalid Request' },
          });
          return;
        }
        if (validId) {
          this.requests.add(id as string | number);
        }
        const request = parsed.data;
        if (
          request.method === 'initialize' &&
          request.params &&
          !compatibility.protocolVersions.includes(
            String(request.params.protocolVersion),
          )
        ) {
          request.params.protocolVersion = compatibility.protocolVersions[0];
        }
        this.onmessage?.(request);
      },
      () => {
        this.sendError({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error' },
        });
      },
    );
    process.stdin.on('error', this.handleError);
    process.stdin.resume();
    process.stdout.on('error', this.handleError);
  }

  private sendError(message: {
    jsonrpc: '2.0';
    id: string | number | null;
    error: { code: number; message: string };
  }) {
    if (!this.closed) {
      process.stdout.write(JSON.stringify(message) + '\n');
    }
  }

  private readonly handleError = (error: Error) => this.onerror?.(error);

  async send(message: JSONRPCMessage) {
    if (this.closed) {
      return;
    }
    if ('id' in message && message.id !== undefined && !('method' in message)) {
      this.requests.delete(message.id);
    }
    await new Promise<void>((resolve, reject) => {
      process.stdout.write(JSON.stringify(message) + '\n', (error) =>
        error ? reject(error) : resolve(),
      );
    });
  }

  async close() {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.detach?.();
    process.stdin.removeListener('error', this.handleError);
    process.stdout.removeListener('error', this.handleError);
    process.stdin.pause();
    this.onclose?.();
  }
}
