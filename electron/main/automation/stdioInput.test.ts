import { spawnSync } from 'node:child_process';
import { closeSync, openSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const script = `
  import { openMcpInput } from ${JSON.stringify(new URL('./stdioInput.ts', import.meta.url).href)};
  const input = openMcpInput(0);
  input.on('error', error => { console.error(error); process.exitCode = 1; });
  input.pipe(process.stdout);
`;

describe('inherited MCP input', () => {
  it('reads large Unicode input from a real child-process pipe and exits on EOF', () => {
    const input = Buffer.from(
      'Chant: \u1f08\u03bb\u03bb\u03b7\u03bb\u03bf\u03cd\u03ca\u03b1\n'.repeat(
        65536,
      ),
    );
    const child = spawnSync(
      process.execPath,
      ['--experimental-strip-types', '--input-type=module', '--eval', script],
      { input, timeout: 10_000, maxBuffer: input.length + 4096 },
    );
    expect(child.error).toBeUndefined();
    expect(child.status, child.stderr.toString()).toBe(0);
    expect(child.stdout).toEqual(input);
  });

  it('reads a redirected file through the inherited descriptor', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'neanes-stdio-input-'));
    const file = path.join(directory, 'input.jsonl');
    const input = '{"jsonrpc":"2.0","id":1,"method":"ping"}\n';
    await writeFile(file, input);
    const fd = openSync(file, 'r');
    try {
      const child = spawnSync(
        process.execPath,
        ['--experimental-strip-types', '--input-type=module', '--eval', script],
        { stdio: [fd, 'pipe', 'pipe'], timeout: 10_000 },
      );
      expect(child.error).toBeUndefined();
      expect(child.status, child.stderr.toString()).toBe(0);
      expect(child.stdout.toString()).toBe(input);
    } finally {
      closeSync(fd);
      await rm(directory, { recursive: true, force: true });
    }
  });
});
