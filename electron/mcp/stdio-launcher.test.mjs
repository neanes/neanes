import { Readable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { createStartupNewlineFilter } from './stdio-launcher.mjs';

async function filtered(chunks) {
  const output = [];
  for await (const chunk of Readable.from(chunks).pipe(
    createStartupNewlineFilter(),
  )) {
    output.push(chunk);
  }
  return Buffer.concat(output).toString('utf8');
}

describe('Electron startup newline filter', () => {
  const reply = '{"jsonrpc":"2.0","id":1,"result":{}}\n';

  it('removes exactly one CRLF even when split across pipe chunks', async () => {
    expect(await filtered([Buffer.from('\r'), Buffer.from('\n' + reply)])).toBe(
      reply,
    );
  });

  it('keeps protocol messages arriving with the startup prefix', async () => {
    expect(await filtered([Buffer.from('\r\n' + reply + reply)])).toBe(
      reply + reply,
    );
  });

  it('preserves output when there is no startup newline', async () => {
    expect(
      await filtered([Buffer.from(reply[0]), Buffer.from(reply.slice(1))]),
    ).toBe(reply);
  });

  it('preserves later blank lines and non-protocol output for strict client validation', async () => {
    expect(await filtered([Buffer.from('\r\n\r\ninvalid\n' + reply)])).toBe(
      '\r\ninvalid\n' + reply,
    );
  });

  it('does not discard an incomplete prefix at EOF', async () => {
    expect(await filtered([Buffer.from('\r')])).toBe('\r');
  });
});
