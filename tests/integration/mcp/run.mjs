import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scenarios = [
  'bridge-protocol',
  'message-size',
  'headless-launch',
  'agent-access',
  'shutdown',
  'metadata',
  'text-search',
  'element-copy',
  'rich-text-update',
  'preview',
];
const requested = process.argv.slice(2);
if (requested.length === 1 && requested[0] === '--list') {
  console.log(scenarios.join('\n'));
} else {
  for (const name of requested) {
    if (!scenarios.includes(name)) {
      throw new Error(`Unknown self-launching MCP scenario: ${name}`);
    }
  }
  for (const name of requested.length ? requested : scenarios) {
    console.log(`Running MCP integration scenario: ${name}`);
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL(`${name}-smoke.mjs`, import.meta.url))],
      {
        cwd: fileURLToPath(new URL('../../..', import.meta.url)),
        stdio: 'inherit',
      },
    );
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      console.error(`${name} failed (${result.signal ?? result.status}).`);
      process.exit(result.status ?? 1);
    }
  }
}
