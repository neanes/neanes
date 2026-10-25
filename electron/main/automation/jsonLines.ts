import type { Readable } from 'node:stream';

// Framing for the internal editor connection. Bound incomplete
// messages too, so a peer cannot grow the receive buffer without a newline.
export function readJsonLines(
  stream: Readable,
  maxBytes: number,
  receive: (message: unknown) => void,
  invalid: (error: Error) => void,
) {
  let chunks: Buffer[] = [];
  let size = 0;
  const onData = (chunk: Buffer) => {
    let start = 0;
    while (start < chunk.length) {
      const newline = chunk.indexOf(10, start);
      const end = newline < 0 ? chunk.length : newline;
      const part = chunk.subarray(start, end);
      size += part.length;
      if (size > maxBytes) {
        stream.destroy(new Error('Message exceeds size limit.'));
        return;
      }
      chunks.push(part);
      if (newline < 0) {
        return;
      }
      const line = Buffer.concat(chunks, size).toString('utf8');
      chunks = [];
      size = 0;
      let message: unknown;
      try {
        message = JSON.parse(line);
      } catch (error) {
        invalid(error as Error);
        start = newline + 1;
        continue;
      }
      receive(message);
      start = newline + 1;
    }
  };
  stream.on('data', onData);
  return () => {
    stream.removeListener('data', onData);
    chunks = [];
  };
}
