import { readFileSync } from 'node:fs';

const metadataPath = process.argv[2] ?? 'dist/latest-mac.yml';
const metadata = readFileSync(metadataPath, 'utf8');

const version = metadata.match(/^version:\s*['"]?([^'"\n]+)['"]?$/m)?.[1];

if (!version) {
  fail('Could not find a version in macOS update metadata.');
}

const expectedUrls = [
  `Neanes-${version}-mac.zip`,
  `Neanes-${version}.dmg`,
  `Neanes-${version}-arm64-mac.zip`,
  `Neanes-${version}-arm64.dmg`,
];

const missingUrls = expectedUrls.filter(
  (url) => !metadata.includes(`url: ${url}`),
);

if (missingUrls.length > 0) {
  fail(`macOS update metadata is missing: ${missingUrls.join(', ')}`);
}

console.log(
  `macOS update metadata includes Intel and arm64 artifacts for ${version}.`,
);

function fail(message) {
  console.error(message);
  console.error(`Checked ${metadataPath}`);
  process.exit(1);
}
