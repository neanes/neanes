import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  appendFile,
  mkdtemp,
  readFile,
  realpath,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const release = path.resolve('release');
const temporary = process.env.RUNNER_TEMP;
assert.ok(temporary, 'RUNNER_TEMP must point to a disposable CI directory.');
const directory = await mkdtemp(path.join(temporary, 'neanes packaged mcp '));
let executable;
if (process.platform === 'darwin') {
  const suffix = process.arch === 'arm64' ? '-arm64' : '';
  const archive = path.join(release, `Neanes-${version}${suffix}-mac.zip`);
  execFileSync('ditto', ['-x', '-k', archive, directory], { stdio: 'inherit' });
  executable = path.join(directory, 'Neanes.app/Contents/MacOS/Neanes');
} else if (process.platform === 'win32') {
  const folder =
    process.arch === 'arm64' ? 'win-arm64-unpacked' : 'win-unpacked';
  executable = path.join(release, folder, 'Neanes.exe');
} else if (process.platform === 'linux') {
  const suffix = process.arch === 'arm64' ? '-arm64' : '';
  const appImage = path.join(release, `Neanes-${version}${suffix}.AppImage`);
  // Extract the actual distributed image without requiring FUSE on the runner.
  execFileSync(appImage, ['--appimage-extract'], {
    cwd: directory,
    stdio: 'ignore',
  });
  executable = path.join(directory, 'squashfs-root/neanes');
  // Ubuntu restricts unprivileged user namespaces to explicitly allowed apps.
  // Allow the extracted binary while keeping Electron's sandbox enabled.
  const binary = await realpath(executable);
  await writeFile(
    path.join(temporary, 'neanes-packaged-electron'),
    [
      'abi <abi/4.0>,',
      'include <tunables/global>',
      '',
      `profile neanes-packaged-electron "${binary}" flags=(unconfined) {`,
      '  userns,',
      '}',
      '',
    ].join('\n'),
  );
} else {
  throw new Error(`Unsupported platform: ${process.platform}`);
}
assert.ok(
  (await stat(executable)).isFile(),
  `Missing packaged executable: ${executable}`,
);
assert.ok(
  process.env.GITHUB_ENV,
  'Run this preparation script in GitHub Actions.',
);
await appendFile(
  process.env.GITHUB_ENV,
  `NEANES_PACKAGED_EXECUTABLE=${executable}\n`,
);
console.log(`Packaged MCP executable: ${executable}`);
